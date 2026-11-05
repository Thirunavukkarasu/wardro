"""Shared helpers for agent modules."""

from collections.abc import Sequence

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.services.ollama_provider import ChatProvider


async def invoke_agent(
    provider: ChatProvider,
    *,
    system_prompt: str,
    user_message: str,
    context: str | None = None,
    history: Sequence[BaseMessage] = (),
    model: str | None = None,
) -> str:
    """Run a single chat completion for an agent.

    Args:
        provider: Shared chat provider (never constructed inside agents).
        system_prompt: Centralised system prompt for the agent role.
        user_message: The current user request.
        context: Optional trusted context block such as wardrobe data or subsystem status.
        history: Prior conversation messages, excluding the current user message.
        model: Optional model override; defaults to the provider's chat model.

    Returns:
        The assistant's text response.
    """
    messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
    messages.extend(history)

    human_content = user_message
    if context:
        human_content = f"Trusted context:\n{context}\n\nUser request:\n{user_message}"
    messages.append(HumanMessage(content=human_content))

    return await provider.achat(messages, model=model)
