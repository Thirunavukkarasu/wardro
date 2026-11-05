"""LangGraph node implementations.

Every node is a small, independently testable async function. Node factories
receive their dependencies (settings, provider, classifier) explicitly instead of
reading global state.
"""

import logging
from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from app.agents.outfit_stylist import run_outfit_stylist
from app.agents.vision_analyst import run_vision_analyst
from app.agents.wardrobe_advisor import run_wardrobe_advisor
from app.agents.wardrobe_analyst import run_wardrobe_analyst
from app.config import Settings
from app.graph.routing import (
    AgentName,
    IntentClassifier,
    normalize_intent,
    resolve_agent,
)
from app.graph.state import WardroState
from app.services.ollama_provider import ChatProvider, OllamaError
from app.tools.wardrobe_tools import WardrobeContext, get_wardrobe_context

logger = logging.getLogger(__name__)

NodeReturn = dict[str, Any]
AsyncNode = Callable[[WardroState], Awaitable[NodeReturn]]

NODE_VALIDATE_INPUT = "validate_input"
NODE_CLASSIFY_INTENT = "classify_intent"
NODE_SELECT_AGENT = "select_agent"
NODE_FORMAT_RESPONSE = "format_response"


def latest_user_message(messages: Sequence[BaseMessage]) -> str:
    """Return the text of the most recent human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return _message_text(message)
    return ""


def conversation_history(messages: Sequence[BaseMessage], limit: int) -> tuple[BaseMessage, ...]:
    """Return prior messages, excluding the current (last) user message."""
    if limit <= 0 or len(messages) <= 1:
        return ()
    return tuple(messages[:-1][-limit:])


def make_validate_input_node(settings: Settings) -> AsyncNode:
    """Create the input validation node."""

    async def validate_input(state: WardroState) -> NodeReturn:
        errors: list[str] = []
        if not state.get("user_id", "").strip():
            errors.append("Trusted user context is missing.")

        message = latest_user_message(state.get("messages", []))
        if not message:
            errors.append("A non-empty user message is required.")
        elif len(message) > settings.max_message_length:
            errors.append(f"Message exceeds the {settings.max_message_length} character limit.")

        return {"errors": errors} if errors else {}

    return validate_input


def make_classify_intent_node(classifier: IntentClassifier) -> AsyncNode:
    """Create the intent classification node."""

    async def classify_intent(state: WardroState) -> NodeReturn:
        message = latest_user_message(state.get("messages", []))
        classification = await classifier.classify(message)
        return {"intent": classification.intent}

    return classify_intent


def make_select_agent_node() -> AsyncNode:
    """Create the deterministic agent selection node."""

    async def select_agent(state: WardroState) -> NodeReturn:
        intent = normalize_intent(state.get("intent"))
        return {"intent": intent, "selected_agent": resolve_agent(intent)}

    return select_agent


def make_wardrobe_analyst_node(provider: ChatProvider, *, history_limit: int) -> AsyncNode:
    """Create the wardrobe analyst node."""

    async def wardrobe_analyst(state: WardroState) -> NodeReturn:
        return await _execute_agent(
            AgentName.WARDROBE_ANALYST,
            lambda: run_wardrobe_analyst(
                latest_user_message(state["messages"]),
                provider,
                wardrobe_context=_wardrobe_context(state),
                history=conversation_history(state["messages"], history_limit),
            ),
        )

    return wardrobe_analyst


def make_outfit_stylist_node(provider: ChatProvider, *, history_limit: int) -> AsyncNode:
    """Create the outfit stylist node."""

    async def outfit_stylist(state: WardroState) -> NodeReturn:
        return await _execute_agent(
            AgentName.OUTFIT_STYLIST,
            lambda: run_outfit_stylist(
                latest_user_message(state["messages"]),
                provider,
                wardrobe_context=_wardrobe_context(state),
                history=conversation_history(state["messages"], history_limit),
            ),
        )

    return outfit_stylist


def make_vision_analyst_node(provider: ChatProvider, *, history_limit: int) -> AsyncNode:
    """Create the vision analyst node."""

    async def vision_analyst(state: WardroState) -> NodeReturn:
        return await _execute_agent(
            AgentName.VISION_ANALYST,
            lambda: run_vision_analyst(
                latest_user_message(state["messages"]),
                provider,
                history=conversation_history(state["messages"], history_limit),
            ),
        )

    return vision_analyst


def make_wardrobe_advisor_node(provider: ChatProvider, *, history_limit: int) -> AsyncNode:
    """Create the wardrobe advisor node."""

    async def wardrobe_advisor(state: WardroState) -> NodeReturn:
        return await _execute_agent(
            AgentName.WARDROBE_ADVISOR,
            lambda: run_wardrobe_advisor(
                latest_user_message(state["messages"]),
                provider,
                wardrobe_context=_wardrobe_context(state),
                history=conversation_history(state["messages"], history_limit),
            ),
        )

    return wardrobe_advisor


def make_format_response_node() -> AsyncNode:
    """Create the response formatting node.

    The node always produces a user-facing message, even after an upstream
    failure, so the API never has to return an empty or broken response.
    """

    async def format_response(state: WardroState) -> NodeReturn:
        errors = list(state.get("errors") or [])
        agent_response = state.get("agent_response")

        if agent_response:
            text = agent_response.strip()
        elif errors and not state.get("selected_agent"):
            text = "I couldn't process that request: " + " ".join(errors)
        elif errors:
            text = (
                "I couldn't complete that request because the local language model "
                "request failed. Please check that Ollama is running and that the "
                "configured models are installed, then try again."
            )
        else:
            text = "I wasn't able to produce a response for that request. Please try again."

        return {"agent_response": text, "messages": [AIMessage(content=text)]}

    return format_response


def route_after_validation(state: WardroState) -> str:
    """Conditional edge: skip classification when validation failed."""
    return NODE_FORMAT_RESPONSE if state.get("errors") else NODE_CLASSIFY_INTENT


def route_to_agent(state: WardroState) -> str:
    """Conditional edge: map the selected agent to its node name."""
    return resolve_agent(state.get("intent")).value


async def _execute_agent(
    agent: AgentName,
    handler: Callable[[], Awaitable[str]],
) -> NodeReturn:
    """Run an agent handler and convert failures into state errors."""
    try:
        text = await handler()
    except OllamaError as exc:
        logger.warning("Agent %s failed: %s", agent.value, exc)
        return {"agent_response": None, "errors": [f"{agent.value}: {exc}"]}
    except Exception as exc:  # noqa: BLE001 - one agent must not crash the API
        logger.exception("Agent %s raised an unexpected error", agent.value)
        return {
            "agent_response": None,
            "errors": [f"{agent.value}: unexpected error: {exc}"],
        }

    return {"agent_response": text}


def _wardrobe_context(state: WardroState) -> WardrobeContext:
    return get_wardrobe_context(
        household_id=state.get("household_id"),
        profile_id=state.get("profile_id"),
    )


def _message_text(message: BaseMessage) -> str:
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
