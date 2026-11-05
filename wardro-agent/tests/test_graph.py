"""Full LangGraph workflow tests."""

from collections.abc import Callable
from typing import Any

import pytest
from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import InMemorySaver

from app.config import Settings
from app.graph.checkpointer import build_checkpointer
from app.graph.nodes import make_select_agent_node
from app.graph.routing import AgentName, Intent, IntentClassification
from app.graph.workflow import build_workflow
from app.services.ollama_provider import OllamaUnavailableError
from tests.conftest import FakeProvider

StateFactory = Callable[[str], dict[str, Any]]


@pytest.mark.parametrize(
    ("message", "intent", "agent"),
    [
        ("Show me all my dresses", Intent.WARDROBE_ANALYSIS, AgentName.WARDROBE_ANALYST),
        (
            "What should I wear for a wedding?",
            Intent.OUTFIT_RECOMMENDATION,
            AgentName.OUTFIT_STYLIST,
        ),
        ("Identify this clothing item", Intent.IMAGE_ANALYSIS, AgentName.VISION_ANALYST),
        ("How can I organize my wardrobe?", Intent.GENERAL_ADVICE, AgentName.WARDROBE_ADVISOR),
    ],
)
async def test_full_graph_routes_each_intent(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
    message: str,
    intent: Intent,
    agent: AgentName,
) -> None:
    graph = build_workflow(provider=fake_provider, settings=settings)

    result = await graph.ainvoke(
        make_state(message),
        config={"configurable": {"thread_id": "thread-123"}},
    )

    assert result["intent"] is intent
    assert result["selected_agent"] is agent
    assert result["agent_response"] == fake_provider.response
    assert result["errors"] == []
    assert isinstance(result["messages"][-1], AIMessage)


async def test_ambiguous_message_uses_llm_classification(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    fake_provider.structured_result = IntentClassification(
        intent=Intent.OUTFIT_RECOMMENDATION,
        confidence=0.77,
        reasoning="Event styling request.",
    )
    graph = build_workflow(provider=fake_provider, settings=settings)

    result = await graph.ainvoke(
        make_state("I have a formal event next month"),
        config={"configurable": {"thread_id": "thread-123"}},
    )

    assert result["intent"] is Intent.OUTFIT_RECOMMENDATION
    assert result["selected_agent"] is AgentName.OUTFIT_STYLIST
    assert len(fake_provider.structured_calls) == 1


async def test_classifier_failure_falls_back_to_general_advice(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    fake_provider.structured_error = RuntimeError("classifier failed")
    graph = build_workflow(provider=fake_provider, settings=settings)

    result = await graph.ainvoke(
        make_state("I have a formal event next month"),
        config={"configurable": {"thread_id": "thread-123"}},
    )

    assert result["intent"] is Intent.GENERAL_ADVICE
    assert result["selected_agent"] is AgentName.WARDROBE_ADVISOR


async def test_agent_failure_is_reported_without_crashing(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    fake_provider.chat_error = OllamaUnavailableError("Ollama is unavailable")
    graph = build_workflow(provider=fake_provider, settings=settings)

    result = await graph.ainvoke(
        make_state("Show me all my dresses"),
        config={"configurable": {"thread_id": "thread-123"}},
    )

    assert result["errors"]
    assert "Ollama is unavailable" in result["errors"][0]
    assert "couldn't complete" in result["agent_response"]
    assert isinstance(result["messages"][-1], AIMessage)


async def test_validation_failure_skips_agents(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    graph = build_workflow(provider=fake_provider, settings=settings)

    result = await graph.ainvoke(
        make_state("   "),
        config={"configurable": {"thread_id": "thread-123"}},
    )

    assert result.get("intent") is None
    assert "non-empty user message" in result["errors"][0]
    assert result["agent_response"].startswith("I couldn't process that request")
    assert fake_provider.chat_calls == []


async def test_workflow_accepts_a_checkpointer(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    graph = build_workflow(
        provider=fake_provider,
        settings=settings,
        checkpointer=InMemorySaver(),
    )
    config = {"configurable": {"thread_id": "thread-memory"}}

    await graph.ainvoke(make_state("Show me all my dresses"), config=config)
    snapshot = await graph.aget_state(config)

    assert snapshot.values["thread_id"] == "thread-123"
    assert snapshot.values["selected_agent"] is AgentName.WARDROBE_ANALYST
    assert any(isinstance(message, AIMessage) for message in snapshot.values["messages"])


async def test_checkpointer_preserves_history_across_turns(
    settings: Settings,
    fake_provider: FakeProvider,
    make_state: StateFactory,
) -> None:
    graph = build_workflow(
        provider=fake_provider,
        settings=settings,
        checkpointer=InMemorySaver(),
    )
    config = {"configurable": {"thread_id": "thread-memory"}}

    await graph.ainvoke(make_state("Show me all my dresses"), config=config)
    await graph.ainvoke(make_state("What should I wear for a wedding?"), config=config)

    snapshot = await graph.aget_state(config)
    assert snapshot.values["selected_agent"] is AgentName.OUTFIT_STYLIST
    assert snapshot.values["intent"] is Intent.OUTFIT_RECOMMENDATION
    # system prompt + previous human/assistant pair + current user message
    assert len(fake_provider.chat_calls[-1]) == 4


async def test_select_agent_node_falls_back_for_unknown_intent(
    make_state: StateFactory,
) -> None:
    node = make_select_agent_node()
    state = make_state("hello")
    state["intent"] = "not-a-known-intent"

    result = await node(state)

    assert result["intent"] is Intent.GENERAL_ADVICE
    assert result["selected_agent"] is AgentName.WARDROBE_ADVISOR


def test_checkpointer_factory_is_disabled_in_this_milestone(settings: Settings) -> None:
    assert build_checkpointer(settings) is None
