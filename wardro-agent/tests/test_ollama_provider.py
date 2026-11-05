"""Ollama provider tests. No real Ollama server is contacted."""

import httpx
import pytest
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.config import Settings
from app.services.ollama_provider import (
    OllamaModelNotFoundError,
    OllamaProvider,
    OllamaUnavailableError,
)


class Answer(BaseModel):
    """Local schema used to exercise structured output."""

    value: str


class _ModelMissingError(Exception):
    status_code = 404


class BrokenConnectionModel:
    async def ainvoke(self, messages: object) -> object:
        del messages
        raise httpx.ConnectError("connection refused")


class MissingModelClient:
    async def ainvoke(self, messages: object) -> object:
        del messages
        raise _ModelMissingError("model not found; run ollama pull")


class _StructuredRunnable:
    async def ainvoke(self, messages: object) -> Answer:
        del messages
        return Answer(value="structured")


class StructuredModel:
    def with_structured_output(self, schema: type[Answer]) -> _StructuredRunnable:
        assert schema is Answer
        return _StructuredRunnable()


def test_models_come_from_settings(settings: Settings) -> None:
    provider = OllamaProvider(settings)

    chat_model = provider.chat_model
    vision_model = provider.vision_model

    assert chat_model.model == settings.ollama_chat_model
    assert vision_model.model == settings.ollama_vision_model
    assert str(chat_model.base_url).rstrip("/") == settings.ollama_base_url
    assert chat_model.temperature == settings.ollama_temperature
    assert chat_model.reasoning is False
    assert provider.chat_model_name == settings.ollama_chat_model
    assert provider.vision_model_name == settings.ollama_vision_model


def test_thinking_can_be_left_to_the_model_default(settings: Settings) -> None:
    provider = OllamaProvider(settings.model_copy(update={"ollama_disable_thinking": False}))

    assert provider.chat_model.reasoning is None


async def test_achat_returns_model_text(settings: Settings) -> None:
    requested: list[str] = []

    def factory(name: str) -> FakeListChatModel:
        requested.append(name)
        return FakeListChatModel(responses=["Hello from the fake model"])

    provider = OllamaProvider(settings, model_factory=factory)

    result = await provider.achat([HumanMessage(content="Hello")])

    assert result == "Hello from the fake model"
    assert requested == [settings.ollama_chat_model]


async def test_achat_translates_connection_errors(settings: Settings) -> None:
    provider = OllamaProvider(settings, model_factory=lambda name: BrokenConnectionModel())

    with pytest.raises(OllamaUnavailableError):
        await provider.achat([HumanMessage(content="Hello")])


async def test_achat_translates_missing_model_errors(settings: Settings) -> None:
    provider = OllamaProvider(settings, model_factory=lambda name: MissingModelClient())

    with pytest.raises(OllamaModelNotFoundError) as exc_info:
        await provider.achat([HumanMessage(content="Hello")])

    assert "ollama pull" in str(exc_info.value)


async def test_achat_structured_returns_validated_schema(settings: Settings) -> None:
    provider = OllamaProvider(settings, model_factory=lambda name: StructuredModel())

    result = await provider.achat_structured([HumanMessage(content="Classify")], Answer)

    assert result == Answer(value="structured")


async def test_health_reports_ok_when_all_models_installed(settings: Settings) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/tags"
        return httpx.Response(
            200,
            json={
                "models": [
                    {"name": f"{settings.ollama_chat_model}:latest"},
                    {"name": f"{settings.ollama_vision_model}:latest"},
                ]
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        health = await OllamaProvider(settings, http_client=client).check_health()
    finally:
        await client.aclose()

    assert health.reachable is True
    assert health.status == "ok"
    assert health.chat_model_available is True
    assert health.vision_model_available is True
    assert health.detail is None


async def test_health_reports_degraded_when_vision_model_missing(
    settings: Settings,
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"models": [{"name": f"{settings.ollama_chat_model}:latest"}]},
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        health = await OllamaProvider(settings, http_client=client).check_health()
    finally:
        await client.aclose()

    assert health.reachable is True
    assert health.status == "degraded"
    assert health.chat_model_available is True
    assert health.vision_model_available is False
    assert settings.ollama_vision_model in (health.detail or "")


async def test_health_does_not_accept_a_different_tag_as_configured_model(
    settings: Settings,
) -> None:
    """Ollama resolves ``qwen3`` to ``qwen3:latest``, not ``qwen3:4b``."""

    def handler(request: httpx.Request) -> httpx.Response:
        del request
        return httpx.Response(
            200,
            json={
                "models": [
                    {"name": f"{settings.ollama_chat_model}:4b"},
                    {"name": f"{settings.ollama_vision_model}:latest"},
                ]
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        health = await OllamaProvider(settings, http_client=client).check_health()
    finally:
        await client.aclose()

    assert health.reachable is True
    assert health.status == "degraded"
    assert health.chat_model_available is False
    assert health.vision_model_available is True
    assert settings.ollama_chat_model in (health.detail or "")


async def test_health_never_raises_when_ollama_is_down(settings: Settings) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        del request
        raise httpx.ConnectError("connection refused")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        health = await OllamaProvider(settings, http_client=client).check_health()
    finally:
        await client.aclose()

    assert health.reachable is False
    assert health.status == "unavailable"
    assert health.chat_model_available is None
    assert health.vision_model_available is None
    assert "Could not reach Ollama" in (health.detail or "")
