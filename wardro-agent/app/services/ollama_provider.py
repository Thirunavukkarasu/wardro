"""Async Ollama provider shared by every agent and the intent classifier.

The provider owns all model construction and error translation. Agents receive a
:class:`ChatProvider` through dependency injection and never build LLM clients
themselves, so models and URLs only ever come from :class:`app.config.Settings`.
"""

import logging
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Literal, Protocol, TypeVar, runtime_checkable

import httpx
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from langchain_ollama import ChatOllama
from pydantic import BaseModel

from app.config import Settings

logger = logging.getLogger(__name__)

ModelT = TypeVar("ModelT", bound=BaseModel)
OllamaHealthStatus = Literal["ok", "degraded", "unavailable"]


class OllamaError(RuntimeError):
    """Base class for errors raised by the Ollama provider."""


class OllamaUnavailableError(OllamaError):
    """Raised when the local Ollama server cannot be reached."""


class OllamaModelNotFoundError(OllamaError):
    """Raised when the configured model is not installed in Ollama."""


@runtime_checkable
class ChatProvider(Protocol):
    """Minimal async chat interface used by agents and graph nodes."""

    async def achat(
        self,
        messages: Sequence[BaseMessage],
        *,
        model: str | None = None,
    ) -> str:
        """Return the assistant text for ``messages``."""
        ...

    async def achat_structured(
        self,
        messages: Sequence[BaseMessage],
        schema: type[ModelT],
        *,
        model: str | None = None,
    ) -> ModelT:
        """Return a validated structured response for ``messages``."""
        ...


@dataclass(frozen=True, slots=True)
class OllamaHealth:
    """Result of a connectivity and model-availability check."""

    reachable: bool
    status: OllamaHealthStatus
    base_url: str
    chat_model: str
    vision_model: str
    chat_model_available: bool | None
    vision_model_available: bool | None
    installed_models: tuple[str, ...] = ()
    detail: str | None = None


class OllamaProvider:
    """Create and invoke ChatOllama models from application settings."""

    def __init__(
        self,
        settings: Settings,
        *,
        model_factory: Callable[[str], BaseChatModel] | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._model_factory = model_factory or self._build_chat_model
        self._http_client = http_client
        self._models: dict[str, BaseChatModel] = {}

    @property
    def chat_model_name(self) -> str:
        """Configured text-generation model name."""
        return self._settings.ollama_chat_model

    @property
    def vision_model_name(self) -> str:
        """Configured vision model name."""
        return self._settings.ollama_vision_model

    @property
    def chat_model(self) -> BaseChatModel:
        """Return the configured chat model (constructed lazily)."""
        return self._model_for(self.chat_model_name)

    @property
    def vision_model(self) -> BaseChatModel:
        """Return the configured vision model (constructed lazily)."""
        return self._model_for(self.vision_model_name)

    async def achat(
        self,
        messages: Sequence[BaseMessage],
        *,
        model: str | None = None,
    ) -> str:
        """Invoke a model and return its text content.

        Raises:
            OllamaUnavailableError: The Ollama server could not be reached.
            OllamaModelNotFoundError: The requested model is not installed.
            OllamaError: Any other Ollama or model failure.
        """
        model_name = model or self.chat_model_name
        llm = self._model_for(model_name)
        try:
            response = await llm.ainvoke(list(messages))
        except Exception as exc:  # noqa: BLE001 - normalised into domain errors below
            raise self._translate_error(exc, model_name) from exc

        if isinstance(response, BaseMessage):
            return _message_text(response)
        return str(response)

    async def achat_structured(
        self,
        messages: Sequence[BaseMessage],
        schema: type[ModelT],
        *,
        model: str | None = None,
    ) -> ModelT:
        """Invoke a model using Ollama structured output and validate the result."""
        model_name = model or self.chat_model_name
        llm = self._model_for(model_name)
        try:
            runnable = llm.with_structured_output(schema)
            result = await runnable.ainvoke(list(messages))
        except Exception as exc:  # noqa: BLE001 - normalised into domain errors below
            raise self._translate_error(exc, model_name) from exc

        if isinstance(result, schema):
            return result
        return schema.model_validate(result)

    async def check_health(self) -> OllamaHealth:
        """Check server connectivity and whether both configured models are installed.

        This method never raises; failures are reported in the returned object.
        """
        base_url = self._settings.ollama_base_url.rstrip("/")
        client, owns_client = self._health_client()
        try:
            response = await client.get(
                f"{base_url}/api/tags",
                timeout=self._settings.ollama_health_timeout,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:  # noqa: BLE001 - health checks must never raise
            logger.warning("Ollama health check failed: %s", exc)
            return OllamaHealth(
                reachable=False,
                status="unavailable",
                base_url=base_url,
                chat_model=self.chat_model_name,
                vision_model=self.vision_model_name,
                chat_model_available=None,
                vision_model_available=None,
                detail=f"Could not reach Ollama at {base_url}: {exc}",
            )
        finally:
            if owns_client:
                await client.aclose()

        installed = _installed_model_names(payload)
        chat_available = _is_model_installed(installed, self.chat_model_name)
        vision_available = _is_model_installed(installed, self.vision_model_name)
        status: OllamaHealthStatus = "ok" if chat_available and vision_available else "degraded"
        detail = None
        if status == "degraded":
            missing = [
                name
                for name, available in (
                    (self.chat_model_name, chat_available),
                    (self.vision_model_name, vision_available),
                )
                if not available
            ]
            detail = (
                "Configured Ollama model(s) not installed: "
                + ", ".join(missing)
                + ". Pull them with `ollama pull <model>`."
            )

        return OllamaHealth(
            reachable=True,
            status=status,
            base_url=base_url,
            chat_model=self.chat_model_name,
            vision_model=self.vision_model_name,
            chat_model_available=chat_available,
            vision_model_available=vision_available,
            installed_models=tuple(sorted(installed)),
            detail=detail,
        )

    def _build_chat_model(self, model_name: str) -> BaseChatModel:
        """Construct a ChatOllama client without performing a network call."""
        return ChatOllama(
            model=model_name,
            base_url=self._settings.ollama_base_url,
            temperature=self._settings.ollama_temperature,
            num_predict=self._settings.ollama_num_predict,
            reasoning=False if self._settings.ollama_disable_thinking else None,
            validate_model_on_init=False,
            client_kwargs={"timeout": self._settings.ollama_request_timeout},
        )

    def _model_for(self, model_name: str) -> BaseChatModel:
        model = self._models.get(model_name)
        if model is None:
            model = self._model_factory(model_name)
            self._models[model_name] = model
        return model

    def _health_client(self) -> tuple[httpx.AsyncClient, bool]:
        if self._http_client is not None:
            return self._http_client, False
        return httpx.AsyncClient(timeout=self._settings.ollama_health_timeout), True

    def _translate_error(self, exc: Exception, model_name: str) -> OllamaError:
        if isinstance(exc, OllamaError):
            return exc

        text = str(exc).lower()
        if getattr(exc, "status_code", None) == 404 or ("model" in text and "not found" in text):
            return OllamaModelNotFoundError(
                f"Ollama model '{model_name}' is not installed at "
                f"{self._settings.ollama_base_url}. Pull it with `ollama pull {model_name}`."
            )

        if isinstance(
            exc,
            (
                httpx.ConnectError,
                httpx.ConnectTimeout,
                httpx.ReadTimeout,
                httpx.TimeoutException,
                httpx.NetworkError,
                ConnectionError,
                TimeoutError,
            ),
        ):
            return OllamaUnavailableError(
                f"Ollama is unavailable at {self._settings.ollama_base_url}. "
                "Start it with `ollama serve` and try again."
            )

        return OllamaError(f"Ollama request failed for model '{model_name}': {exc}")


def _message_text(message: BaseMessage) -> str:
    """Extract text from a message whose content may contain content blocks."""
    content = message.content
    if isinstance(content, str):
        return content.strip()

    parts: list[str] = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            text = block.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "".join(parts).strip()


def _installed_model_names(payload: object) -> set[str]:
    """Extract model names from an Ollama ``/api/tags`` response."""
    if not isinstance(payload, dict):
        return set()

    models = payload.get("models")
    if not isinstance(models, list):
        return set()

    names: set[str] = set()
    for item in models:
        if isinstance(item, dict):
            name = item.get("name") or item.get("model")
            if isinstance(name, str):
                names.add(name)
    return names


def _is_model_installed(installed: set[str], wanted: str) -> bool:
    """Match an exact model name, or an untagged name against ``:latest``.

    Ollama treats ``qwen3`` as ``qwen3:latest``; it does not resolve an untagged
    name to an arbitrary installed tag such as ``qwen3:4b``.
    """
    if wanted in installed:
        return True
    return ":" not in wanted and f"{wanted}:latest" in installed
