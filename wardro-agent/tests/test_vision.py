"""Vision analyzer tests using a fake model provider."""

from app.vision.image_analyzer import ImageAnalyzer
from app.vision.schemas import ImageAnalysisRequest
from tests.conftest import FakeProvider


async def test_image_analyzer_parses_structured_json() -> None:
    provider = FakeProvider(
        response=(
            '```json\n{"items":[{"garment_type":"t-shirt","category":"Tops",'
            '"primary_color":"black","pattern":"solid","material":"cotton",'
            '"occasions":["casual"],"confidence":0.95}],'
            '"summary":"A black cotton t-shirt."}\n```'
        )
    )
    analyzer = ImageAnalyzer(provider, model="vision-test")

    result = await analyzer.analyze(
        ImageAnalysisRequest(image_base64="ZmFrZQ==", hint="What is this?")
    )

    assert result.status == "completed"
    assert result.model == "vision-test"
    assert result.items[0].garment_type == "t-shirt"
    assert result.items[0].primary_color == "black"
    assert result.detail == "A black cotton t-shirt."

    image_message = provider.chat_calls[-1][-1]
    assert isinstance(image_message.content, list)
    assert image_message.content[1]["type"] == "image_url"
    assert image_message.content[1]["image_url"]["url"].startswith("data:image/jpeg;base64,")


async def test_image_analyzer_reports_invalid_json() -> None:
    provider = FakeProvider(response="I think this is a shirt.")
    analyzer = ImageAnalyzer(provider, model="vision-test")

    result = await analyzer.analyze(ImageAnalysisRequest(image_base64="ZmFrZQ=="))

    assert result.status == "not_available"
    assert "valid JSON" in result.detail


async def test_image_analyzer_without_a_provider_is_explicitly_unavailable() -> None:
    result = await ImageAnalyzer().analyze(ImageAnalysisRequest(image_base64="ZmFrZQ=="))

    assert result.status == "not_available"
    assert "OLLAMA_VISION_MODEL" in result.detail
