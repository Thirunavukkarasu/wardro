"""Wardrobe Analyst agent: inventory questions and wardrobe analysis."""

from collections.abc import Sequence

from langchain_core.messages import BaseMessage

from app.agents.base import invoke_agent
from app.agents.prompts import WARDROBE_ANALYST_SYSTEM_PROMPT
from app.services.ollama_provider import ChatProvider
from app.tools.wardrobe_tools import WardrobeContext


async def run_wardrobe_analyst(
    message: str,
    provider: ChatProvider,
    *,
    wardrobe_context: WardrobeContext | None = None,
    history: Sequence[BaseMessage] = (),
) -> str:
    """Answer a wardrobe inventory or analysis question.

    Args:
        message: The user's request.
        provider: Shared chat provider.
        wardrobe_context: Trusted wardrobe data, if any.
        history: Prior conversation messages, excluding the current message.

    Returns:
        The agent's response text.
    """
    context = wardrobe_context or WardrobeContext()
    return await invoke_agent(
        provider,
        system_prompt=WARDROBE_ANALYST_SYSTEM_PROMPT,
        user_message=message,
        context=context.as_prompt_text(),
        history=history,
    )
