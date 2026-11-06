"""Independent tests for each agent module."""

from langchain_core.messages import AIMessage, HumanMessage

from app.agents.outfit_stylist import run_outfit_stylist
from app.agents.vision_analyst import run_vision_analyst
from app.agents.wardrobe_advisor import run_wardrobe_advisor
from app.agents.wardrobe_analyst import run_wardrobe_analyst
from app.tools.wardrobe_tools import WardrobeContext, WardrobeItem
from tests.conftest import FakeProvider


def _system_prompt(provider: FakeProvider) -> str:
    content = provider.chat_calls[-1][0].content
    assert isinstance(content, str)
    return content


def _human_prompt(provider: FakeProvider) -> str:
    content = provider.chat_calls[-1][-1].content
    assert isinstance(content, str)
    return content


async def test_wardrobe_analyst_uses_shared_prompt_and_context(
    fake_provider: FakeProvider,
) -> None:
    result = await run_wardrobe_analyst(
        "Show me all my dresses",
        fake_provider,
        wardrobe_context=WardrobeContext(),
    )

    assert result == fake_provider.response
    assert "Wardrobe Analyst" in _system_prompt(fake_provider)
    assert "Wardrobe data available: no" in _human_prompt(fake_provider)
    assert "Show me all my dresses" in _human_prompt(fake_provider)


async def test_wardrobe_analyst_renders_available_items(
    fake_provider: FakeProvider,
) -> None:
    context = WardrobeContext(
        items=(WardrobeItem(item_id="1", name="Navy dress", category="dress", colour="navy"),),
        available=True,
        source="test",
        note="",
    )

    await run_wardrobe_analyst("What dresses do I own?", fake_provider, wardrobe_context=context)

    human = _human_prompt(fake_provider)
    assert "Navy dress" in human
    assert "Wardrobe data available: yes" in human


async def test_outfit_stylist_requires_illustrative_labelling(
    fake_provider: FakeProvider,
) -> None:
    await run_outfit_stylist(
        "What should I wear for a wedding?",
        fake_provider,
        wardrobe_context=WardrobeContext(),
    )

    assert "Outfit Stylist" in _system_prompt(fake_provider)
    assert "illustrative" in _system_prompt(fake_provider)
    assert "Wardrobe data available: no" in _human_prompt(fake_provider)


async def test_wardrobe_advisor_uses_general_advice_prompt(
    fake_provider: FakeProvider,
) -> None:
    await run_wardrobe_advisor(
        "How can I organize my wardrobe?",
        fake_provider,
        wardrobe_context=WardrobeContext(),
    )

    assert "Wardrobe Advisor" in _system_prompt(fake_provider)
    assert "How can I organize my wardrobe?" in _human_prompt(fake_provider)


async def test_vision_analyst_reports_next_milestone(fake_provider: FakeProvider) -> None:
    await run_vision_analyst("Identify this clothing item", fake_provider)

    assert "Vision Analyst" in _system_prompt(fake_provider)
    human = _human_prompt(fake_provider)
    assert "not_available" in human
    assert "OLLAMA_VISION_MODEL" in human


async def test_agents_forward_conversation_history(fake_provider: FakeProvider) -> None:
    history = [
        HumanMessage(content="Earlier question"),
        AIMessage(content="Earlier answer"),
    ]

    await run_wardrobe_advisor("Follow-up", fake_provider, history=history)

    messages = fake_provider.chat_calls[-1]
    assert len(messages) == 4
    assert messages[1].content == "Earlier question"
    assert messages[2].content == "Earlier answer"
    assert "Follow-up" in _human_prompt(fake_provider)
