"""Outfit Stylist agent: outfit recommendations and occasion styling."""

from collections.abc import Sequence

from langchain_core.messages import BaseMessage

from app.agents.base import invoke_agent
from app.agents.prompts import OUTFIT_STYLIST_SYSTEM_PROMPT
from app.services.ollama_provider import ChatProvider
from app.tools.wardrobe_tools import WardrobeContext


async def run_outfit_stylist(
    message: str,
    provider: ChatProvider,
    *,
    wardrobe_context: WardrobeContext | None = None,
    history: Sequence[BaseMessage] = (),
) -> str:
    """Suggest an outfit or styling combination.

    When real wardrobe data is unavailable, the prompt requires the model to
    label its suggestions as illustrative rather than wardrobe-based.

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
        system_prompt=OUTFIT_STYLIST_SYSTEM_PROMPT,
        user_message=message,
        context=context.as_prompt_text(),
        history=history,
    )
