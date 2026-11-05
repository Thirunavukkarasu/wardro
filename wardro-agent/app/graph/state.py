"""Shared LangGraph state for the Wardro AI agent workflow."""

from typing import Annotated, NotRequired, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

from app.graph.routing import AgentName, Intent


class WardroState(TypedDict):
    """State passed through every graph node.

    Identity fields (``user_id``, ``household_id``, ``profile_id``) are populated
    from trusted application context, never parsed from the user's message. They
    are required in the initial state so every agent works with the same,
    authoritative values.
    """

    messages: Annotated[list[BaseMessage], add_messages]
    user_id: str
    household_id: str | None
    profile_id: str | None
    thread_id: str
    intent: NotRequired[Intent | None]
    selected_agent: NotRequired[AgentName | None]
    agent_response: NotRequired[str | None]
    errors: list[str]
