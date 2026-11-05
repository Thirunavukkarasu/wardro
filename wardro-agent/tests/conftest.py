"""Shared test fixtures.

All tests use a fake chat provider, so the suite runs without an Ollama server.
"""

from collections.abc import Sequence
from typing import Any

import pytest
from langchain_core.messages import BaseMessage, HumanMessage

from app.config import Settings
from app.graph.routing import Intent, IntentClassification
from app.services.ollama_provider import OllamaHealth

TEST_CHAT_MODEL = "test-chat"
TEST_VISION_MODEL = "test-vision"


class FakeProvider:
    """Duck-typed chat provider that records calls for assertions."""

    def __init__(self, *, response: str = "Fake agent response.") -> None:
        self.response = response
        self.chat_error: Exception | None = None
        self.structured_error: Exception | None = None
        self.structured_result = IntentClassification(
            intent=Intent.GENERAL_ADVICE,
            confidence=0.4,
            reasoning="Fake classifier result.",
        )
        self.health = OllamaHealth(
            reachable=True,
            status="ok",
            base_url="http://localhost:11434",
            chat_model=TEST_CHAT_MODEL,
            vision_model=TEST_VISION_MODEL,
            chat_model_available=True,
            vision_model_available=True,
            installed_models=(f"{TEST_CHAT_MODEL}:latest", f"{TEST_VISION_MODEL}:latest"),
        )
        self.chat_calls: list[list[BaseMessage]] = []
        self.structured_calls: list[list[BaseMessage]] = []

    async def achat(
        self,
        messages: Sequence[BaseMessage],
        *,
        model: str | None = None,
    ) -> str:
        del model
        self.chat_calls.append(list(messages))
        if self.chat_error is not None:
            raise self.chat_error
        return self.response

    async def achat_structured(
        self,
        messages: Sequence[BaseMessage],
        schema: type[Any],
        *,
        model: str | None = None,
    ) -> Any:
        del model
        self.structured_calls.append(list(messages))
        if self.structured_error is not None:
            raise self.structured_error
        return schema.model_validate(self.structured_result.model_dump())

    async def check_health(self) -> OllamaHealth:
        return self.health


@pytest.fixture
def settings() -> Settings:
    """Development settings that never touch the network."""
    return Settings(
        _env_file=None,
        app_name="Wardro AI Test",
        app_env="development",
        debug=True,
        ollama_base_url="http://localhost:11434",
        ollama_chat_model=TEST_CHAT_MODEL,
        ollama_vision_model=TEST_VISION_MODEL,
        ollama_temperature=0.2,
        database_url=None,
    )


@pytest.fixture
def fake_provider() -> FakeProvider:
    """A fake provider shared by graph, agent, and API tests."""
    return FakeProvider()


@pytest.fixture
def make_state() -> Any:
    """Factory for a valid initial graph state."""

    def _make(message: str = "Show me all my dresses", **overrides: Any) -> dict[str, Any]:
        state: dict[str, Any] = {
            "messages": [HumanMessage(content=message)],
            "user_id": "user-123",
            "household_id": "family-123",
            "profile_id": "profile-123",
            "thread_id": "thread-123",
            "intent": None,
            "selected_agent": None,
            "agent_response": None,
            "errors": [],
        }
        state.update(overrides)
        return state

    return _make
