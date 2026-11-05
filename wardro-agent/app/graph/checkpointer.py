"""Checkpointer factory for LangGraph conversation state.

Milestone 1 deliberately does not persist conversations. ``thread_id`` is
plumbed through the API and passed to the graph, but until a checkpointer is
returned here there is no storage behind it and no cross-request memory.

Next milestone: construct LangGraph's ``AsyncPostgresSaver`` from
``settings.database_url``, run its ``setup()`` during FastAPI startup, and return
it from this function. No workflow node changes will be required.
"""

from langgraph.checkpoint.base import BaseCheckpointSaver

from app.config import Settings


def build_checkpointer(settings: Settings) -> BaseCheckpointSaver | None:
    """Return the configured checkpointer, or ``None`` when persistence is off."""
    del settings
    return None
