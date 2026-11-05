"""Single factory for the Wardro AI LangGraph workflow."""

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.config import Settings
from app.graph.nodes import (
    NODE_CLASSIFY_INTENT,
    NODE_FORMAT_RESPONSE,
    NODE_SELECT_AGENT,
    NODE_VALIDATE_INPUT,
    make_classify_intent_node,
    make_format_response_node,
    make_outfit_stylist_node,
    make_select_agent_node,
    make_validate_input_node,
    make_vision_analyst_node,
    make_wardrobe_advisor_node,
    make_wardrobe_analyst_node,
    route_after_validation,
    route_to_agent,
)
from app.graph.routing import AgentName, IntentClassifier
from app.graph.state import WardroState
from app.services.ollama_provider import ChatProvider


def build_workflow(
    *,
    provider: ChatProvider,
    settings: Settings,
    classifier: IntentClassifier | None = None,
    checkpointer: BaseCheckpointSaver | None = None,
) -> CompiledStateGraph:
    """Build and compile the agent workflow.

    Args:
        provider: Shared chat provider injected into every agent node.
        settings: Application settings (history and message limits).
        classifier: Optional classifier override for tests.
        checkpointer: Optional LangGraph checkpointer. Passing a checkpointer here
            is all that is required to enable thread-scoped persistence; the node
            graph itself does not change.

    Returns:
        The compiled graph, ready for ``ainvoke``/``astream``.
    """
    intent_classifier = classifier or IntentClassifier(provider)
    history_limit = settings.max_history_messages

    builder = StateGraph(WardroState)

    builder.add_node(NODE_VALIDATE_INPUT, make_validate_input_node(settings))
    builder.add_node(NODE_CLASSIFY_INTENT, make_classify_intent_node(intent_classifier))
    builder.add_node(NODE_SELECT_AGENT, make_select_agent_node())
    builder.add_node(
        AgentName.WARDROBE_ANALYST.value,
        make_wardrobe_analyst_node(provider, history_limit=history_limit),
    )
    builder.add_node(
        AgentName.OUTFIT_STYLIST.value,
        make_outfit_stylist_node(provider, history_limit=history_limit),
    )
    builder.add_node(
        AgentName.VISION_ANALYST.value,
        make_vision_analyst_node(provider, history_limit=history_limit),
    )
    builder.add_node(
        AgentName.WARDROBE_ADVISOR.value,
        make_wardrobe_advisor_node(provider, history_limit=history_limit),
    )
    builder.add_node(NODE_FORMAT_RESPONSE, make_format_response_node())

    builder.add_edge(START, NODE_VALIDATE_INPUT)
    builder.add_conditional_edges(
        NODE_VALIDATE_INPUT,
        route_after_validation,
        {
            NODE_CLASSIFY_INTENT: NODE_CLASSIFY_INTENT,
            NODE_FORMAT_RESPONSE: NODE_FORMAT_RESPONSE,
        },
    )
    builder.add_edge(NODE_CLASSIFY_INTENT, NODE_SELECT_AGENT)
    builder.add_conditional_edges(
        NODE_SELECT_AGENT,
        route_to_agent,
        {agent.value: agent.value for agent in AgentName},
    )

    for agent in AgentName:
        builder.add_edge(agent.value, NODE_FORMAT_RESPONSE)

    builder.add_edge(NODE_FORMAT_RESPONSE, END)

    return builder.compile(checkpointer=checkpointer)
