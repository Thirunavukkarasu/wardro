"""Intent classification and deterministic intent-to-agent routing."""

import logging
from collections.abc import Mapping
from enum import StrEnum
from types import MappingProxyType
from typing import Final

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict, Field

from app.agents.prompts import INTENT_CLASSIFIER_SYSTEM_PROMPT
from app.services.ollama_provider import ChatProvider

logger = logging.getLogger(__name__)


class Intent(StrEnum):
    """Supported user intents."""

    WARDROBE_ANALYSIS = "wardrobe_analysis"
    OUTFIT_RECOMMENDATION = "outfit_recommendation"
    IMAGE_ANALYSIS = "image_analysis"
    GENERAL_ADVICE = "general_advice"


class AgentName(StrEnum):
    """Agents that can handle an intent."""

    WARDROBE_ANALYST = "wardrobe_analyst"
    OUTFIT_STYLIST = "outfit_stylist"
    VISION_ANALYST = "vision_analyst"
    WARDROBE_ADVISOR = "wardrobe_advisor"


INTENT_TO_AGENT: Final[Mapping[Intent, AgentName]] = MappingProxyType(
    {
        Intent.WARDROBE_ANALYSIS: AgentName.WARDROBE_ANALYST,
        Intent.OUTFIT_RECOMMENDATION: AgentName.OUTFIT_STYLIST,
        Intent.IMAGE_ANALYSIS: AgentName.VISION_ANALYST,
        Intent.GENERAL_ADVICE: AgentName.WARDROBE_ADVISOR,
    }
)

FALLBACK_INTENT: Final[Intent] = Intent.GENERAL_ADVICE


class IntentClassification(BaseModel):
    """Structured output of intent classification."""

    model_config = ConfigDict(extra="ignore")

    intent: Intent
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    reasoning: str = Field(default="", max_length=1000)


# Ordered rules: the first matching intent wins. Image requests come first so
# "analyse this photo of my wardrobe" is treated as an image request.
_KEYWORD_RULES: Final[tuple[tuple[Intent, tuple[str, ...]], ...]] = (
    (
        Intent.IMAGE_ANALYSIS,
        (
            "image",
            "photo",
            "picture",
            "identify this",
            "recognise this",
            "recognize this",
            "analyze this item",
            "analyse this item",
            "upload a",
        ),
    ),
    (
        Intent.OUTFIT_RECOMMENDATION,
        (
            "what should i wear",
            "what to wear",
            "outfit",
            "wear for",
            "wear to",
            "dress for",
            "style me",
            "styling",
            "goes with",
            "match with",
            "combination",
        ),
    ),
    (
        Intent.WARDROBE_ANALYSIS,
        (
            "show me all",
            "list my",
            "inventory",
            "how many",
            "do i own",
            "what do i own",
            "my dresses",
            "my clothes",
            "wardrobe contain",
            "catalog",
            "catalogue",
            "wardrobe analysis",
            "analyze my wardrobe",
            "analyse my wardrobe",
        ),
    ),
    (
        Intent.GENERAL_ADVICE,
        (
            "organize",
            "organise",
            "care",
            "wash",
            "clean",
            "stain",
            "store",
            "storage",
            "declutter",
            "advice",
            "tips",
            "capsule",
        ),
    ),
)


def rule_based_intent(message: str) -> tuple[Intent, str] | None:
    """Return the first keyword-matched intent and the matching keyword.

    Returns ``None`` when no rule matches, signalling that the message is
    ambiguous and should be classified by the LLM.
    """
    normalized = " ".join(message.lower().split())
    if not normalized:
        return None

    for intent, keywords in _KEYWORD_RULES:
        for keyword in keywords:
            if keyword in normalized:
                return intent, keyword
    return None


def normalize_intent(intent: Intent | str | None) -> Intent:
    """Coerce a value to a known intent, falling back for unknown values."""
    if isinstance(intent, Intent):
        return intent

    if isinstance(intent, str):
        try:
            return Intent(intent)
        except ValueError:
            logger.warning("Unknown intent %r; falling back to general advice", intent)

    return FALLBACK_INTENT


def resolve_agent(intent: Intent | str | None) -> AgentName:
    """Map an intent to an agent, falling back safely for unknown values."""
    return INTENT_TO_AGENT[normalize_intent(intent)]


class IntentClassifier:
    """Classify user messages using deterministic rules, then the LLM if needed."""

    def __init__(self, provider: ChatProvider | None = None) -> None:
        self._provider = provider

    async def classify(self, message: str) -> IntentClassification:
        """Classify ``message`` and always return a valid known intent.

        Keyword rules keep common requests fast and deterministic. Ambiguous
        messages are sent to the LLM for structured classification. Any failure
        falls back to :data:`FALLBACK_INTENT`.
        """
        rule_match = rule_based_intent(message)
        if rule_match is not None:
            intent, keyword = rule_match
            return IntentClassification(
                intent=intent,
                confidence=0.85,
                reasoning=f"Matched keyword '{keyword}'.",
            )

        llm_result = await self._classify_with_llm(message)
        if llm_result is not None:
            return llm_result

        return IntentClassification(
            intent=FALLBACK_INTENT,
            confidence=0.0,
            reasoning=(
                "No deterministic rule matched and the LLM classifier was unavailable; "
                "fell back to general advice."
            ),
        )

    async def _classify_with_llm(self, message: str) -> IntentClassification | None:
        if self._provider is None or not message.strip():
            return None

        try:
            result = await self._provider.achat_structured(
                [
                    SystemMessage(content=INTENT_CLASSIFIER_SYSTEM_PROMPT),
                    HumanMessage(content=message),
                ],
                IntentClassification,
            )
        except Exception as exc:  # noqa: BLE001 - classification must never break requests
            logger.warning("LLM intent classification failed: %s", exc)
            return None

        if result.intent not in INTENT_TO_AGENT:
            logger.warning("LLM returned unsupported intent %r", result.intent)
            return None
        return result
