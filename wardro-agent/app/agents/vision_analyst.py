"""Vision Analyst agent: clothing-image requests.

Image processing itself is intentionally out of scope for this milestone. The
agent asks the shared image analyzer for its status and explains the limitation
through the configured chat model, without ever claiming to have seen an image.
"""

from collections.abc import Sequence

from langchain_core.messages import BaseMessage

from app.agents.base import invoke_agent
from app.agents.prompts import VISION_ANALYST_SYSTEM_PROMPT
from app.services.ollama_provider import ChatProvider
from app.vision.image_analyzer import ImageAnalyzer


async def run_vision_analyst(
    message: str,
    provider: ChatProvider,
    *,
    analyzer: ImageAnalyzer | None = None,
    history: Sequence[BaseMessage] = (),
) -> str:
    """Respond to a clothing-image request with the current subsystem status.

    Args:
        message: The user's request.
        provider: Shared chat provider.
        analyzer: Image analyzer dependency; defaults to the placeholder analyzer.
        history: Prior conversation messages, excluding the current message.

    Returns:
        The agent's response text.
    """
    image_analyzer = analyzer or ImageAnalyzer()
    result = await image_analyzer.analyze()
    context = f"Vision subsystem status: {result.status}. Detail: {result.detail}"

    return await invoke_agent(
        provider,
        system_prompt=VISION_ANALYST_SYSTEM_PROMPT,
        user_message=message,
        context=context,
        history=history,
    )
