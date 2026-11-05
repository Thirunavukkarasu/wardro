"""Intent classification and routing tests."""

import pytest

from app.graph.routing import (
    AgentName,
    Intent,
    IntentClassification,
    IntentClassifier,
    normalize_intent,
    resolve_agent,
    rule_based_intent,
)
from tests.conftest import FakeProvider


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("Show me all my dresses", Intent.WARDROBE_ANALYSIS),
        ("What should I wear for a wedding?", Intent.OUTFIT_RECOMMENDATION),
        ("Identify this clothing item", Intent.IMAGE_ANALYSIS),
        ("How can I organize my wardrobe?", Intent.GENERAL_ADVICE),
    ],
)
def test_rule_based_examples(message: str, expected: Intent) -> None:
    match = rule_based_intent(message)

    assert match is not None
    assert match[0] is expected


def test_rule_based_returns_none_for_ambiguous_message() -> None:
    assert rule_based_intent("I have a formal event next month") is None


async def test_classifier_uses_rules_without_calling_llm(
    fake_provider: FakeProvider,
) -> None:
    classifier = IntentClassifier(fake_provider)

    result = await classifier.classify("Show me all my dresses")

    assert result.intent is Intent.WARDROBE_ANALYSIS
    assert fake_provider.structured_calls == []


async def test_classifier_uses_llm_for_ambiguous_messages(
    fake_provider: FakeProvider,
) -> None:
    fake_provider.structured_result = IntentClassification(
        intent=Intent.OUTFIT_RECOMMENDATION,
        confidence=0.8,
        reasoning="The user is asking about an event.",
    )
    classifier = IntentClassifier(fake_provider)

    result = await classifier.classify("I have a formal event next month")

    assert result.intent is Intent.OUTFIT_RECOMMENDATION
    assert len(fake_provider.structured_calls) == 1


async def test_classifier_falls_back_when_llm_fails(
    fake_provider: FakeProvider,
) -> None:
    fake_provider.structured_error = RuntimeError("ollama is down")
    classifier = IntentClassifier(fake_provider)

    result = await classifier.classify("I have a formal event next month")

    assert result.intent is Intent.GENERAL_ADVICE
    assert result.confidence == 0.0


async def test_classifier_falls_back_without_provider() -> None:
    classifier = IntentClassifier(provider=None)

    result = await classifier.classify("I have a formal event next month")

    assert result.intent is Intent.GENERAL_ADVICE


@pytest.mark.parametrize(
    ("intent", "agent"),
    [
        (Intent.WARDROBE_ANALYSIS, AgentName.WARDROBE_ANALYST),
        (Intent.OUTFIT_RECOMMENDATION, AgentName.OUTFIT_STYLIST),
        (Intent.IMAGE_ANALYSIS, AgentName.VISION_ANALYST),
        (Intent.GENERAL_ADVICE, AgentName.WARDROBE_ADVISOR),
    ],
)
def test_each_intent_maps_to_one_agent(intent: Intent, agent: AgentName) -> None:
    assert resolve_agent(intent) is agent


def test_unknown_intent_falls_back_to_advisor() -> None:
    assert resolve_agent("not-a-real-intent") is AgentName.WARDROBE_ADVISOR
    assert resolve_agent(None) is AgentName.WARDROBE_ADVISOR
    assert normalize_intent("nonsense") is Intent.GENERAL_ADVICE
