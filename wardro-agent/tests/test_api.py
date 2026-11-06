"""FastAPI startup, health, and chat endpoint tests."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.dependencies import get_image_analyzer, get_wardrobe_backend
from app.graph.routing import Intent, IntentClassification
from app.main import create_app
from app.schemas.responses import ChatResponse
from app.services.ollama_provider import OllamaHealth, OllamaUnavailableError
from app.services.wardrobe_backend import BackendWardrobeItem
from app.vision.schemas import DetectedGarment, ImageAnalysisResult
from tests.conftest import TEST_CHAT_MODEL, TEST_VISION_MODEL, FakeProvider


@pytest.fixture
def client(settings: Settings, fake_provider: FakeProvider) -> Iterator[TestClient]:
    application = create_app(settings=settings, provider=fake_provider)
    with TestClient(application) as test_client:
        yield test_client


def test_cors_allows_the_expo_web_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/chat",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"


def test_application_starts_and_reports_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "wardro-ai",
        "version": "0.1.0",
        "environment": "development",
    }


def test_ollama_health_reports_available_models(
    client: TestClient,
    fake_provider: FakeProvider,
) -> None:
    response = client.get("/health/ollama")

    assert response.status_code == 200
    body = response.json()
    assert body["reachable"] is True
    assert body["status"] == "ok"
    assert body["chat_model"] == TEST_CHAT_MODEL
    assert body["vision_model"] == TEST_VISION_MODEL
    assert body["chat_model_available"] is True
    assert body["vision_model_available"] is True


def test_ollama_health_returns_503_when_unreachable(
    client: TestClient,
    fake_provider: FakeProvider,
) -> None:
    fake_provider.health = OllamaHealth(
        reachable=False,
        status="unavailable",
        base_url="http://localhost:11434",
        chat_model=TEST_CHAT_MODEL,
        vision_model=TEST_VISION_MODEL,
        chat_model_available=None,
        vision_model_available=None,
        detail="Could not reach Ollama",
    )

    response = client.get("/health/ollama")

    assert response.status_code == 503
    assert response.json()["status"] == "unavailable"


def test_chat_returns_structured_response(client: TestClient) -> None:
    response = client.post(
        "/api/v1/chat",
        json={
            "message": "Show me all my dresses",
            "thread_id": "thread-123",
            "user_id": "user-123",
            "household_id": "family-123",
            "profile_id": "profile-123",
        },
    )

    assert response.status_code == 200
    body = response.json()
    validated = ChatResponse.model_validate(body)
    assert validated.success is True
    assert validated.thread_id == "thread-123"
    assert validated.intent is Intent.WARDROBE_ANALYSIS
    assert validated.agent.value == "wardrobe_analyst"
    assert validated.message == "Fake agent response."
    assert validated.metadata["identity_source"] == "development_request_body"
    assert validated.metadata["persistence"] == "disabled"


def test_chat_uses_profile_inventory_when_development_token_is_supplied(
    settings: Settings,
    fake_provider: FakeProvider,
) -> None:
    class FakeBackend:
        async def list_items(self, *, token: str, profile_id: str):
            assert token == "dev-token"
            assert profile_id == "profile-123"
            return [
                BackendWardrobeItem(
                    item_id=44,
                    name="Grey Pullover Hoodie",
                    category="Tops",
                    colour="Grey",
                    brand="Playhouse",
                    size="5Y",
                    state="in_use",
                )
            ]

    application = create_app(settings=settings, provider=fake_provider)
    application.dependency_overrides[get_wardrobe_backend] = lambda: FakeBackend()

    with TestClient(application) as test_client:
        response = test_client.post(
            "/api/v1/chat",
            json={
                "message": "What tops do I own?",
                "user_id": "user-123",
                "profile_id": "profile-123",
                "firebase_token": "dev-token",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["metadata"]["wardrobe_context"] == "available"
    assert body["metadata"]["wardrobe_item_count"] == 1
    assert fake_provider.chat_calls
    assert "Grey Pullover Hoodie" in str(fake_provider.chat_calls[-1][-1].content)


def test_chat_routes_an_image_to_the_vision_analyzer(
    settings: Settings,
    fake_provider: FakeProvider,
) -> None:
    class FakeImageAnalyzer:
        async def analyze(self, request):
            assert request.image_base64 == "ZmFrZQ=="
            return ImageAnalysisResult(
                status="completed",
                items=[
                    DetectedGarment(
                        garment_type="t-shirt",
                        category="Tops",
                        primary_color="black",
                        pattern="solid",
                        material="cotton",
                        confidence=0.95,
                    )
                ],
                detail="A black cotton t-shirt.",
                model="vision-test",
            )

    application = create_app(settings=settings, provider=fake_provider)
    application.dependency_overrides[get_image_analyzer] = lambda: FakeImageAnalyzer()

    with TestClient(application) as test_client:
        response = test_client.post(
            "/api/v1/chat",
            json={
                "message": "What is this?",
                "user_id": "user-123",
                "image_base64": "ZmFrZQ==",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "image_analysis"
    assert body["agent"] == "vision_analyst"
    assert "black t-shirt" in body["message"].lower()
    assert body["metadata"]["image_analysis"] == "completed"
    assert body["metadata"]["analysis"]["items"][0]["garment_type"] == "t-shirt"


def test_chat_generates_thread_id_when_omitted(client: TestClient) -> None:
    response = client.post(
        "/api/v1/chat",
        json={"message": "How can I organize my wardrobe?", "user_id": "user-123"},
    )

    assert response.status_code == 200
    assert response.json()["thread_id"].startswith("thread-")


def test_chat_requires_user_id_in_development(client: TestClient) -> None:
    response = client.post(
        "/api/v1/chat",
        json={"message": "Show me all my dresses"},
    )

    assert response.status_code == 422
    assert "user_id is required" in response.json()["detail"]


def test_chat_rejects_blank_messages(client: TestClient) -> None:
    response = client.post(
        "/api/v1/chat",
        json={"message": "   ", "user_id": "user-123"},
    )

    assert response.status_code == 422


def test_chat_rejects_client_identity_outside_development(
    settings: Settings,
    fake_provider: FakeProvider,
) -> None:
    production_settings = settings.model_copy(update={"app_env": "production", "debug": False})
    application = create_app(settings=production_settings, provider=fake_provider)

    with TestClient(application) as test_client:
        response = test_client.post(
            "/api/v1/chat",
            json={"message": "Hello", "user_id": "user-123"},
        )

    assert response.status_code == 401
    assert "Authenticated identity is required" in response.json()["detail"]


def test_chat_unknown_intent_falls_back_to_advisor(client: TestClient) -> None:
    response = client.post(
        "/api/v1/chat",
        json={"message": "I have a formal event next month", "user_id": "user-123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "general_advice"
    assert body["agent"] == "wardrobe_advisor"


def test_chat_returns_503_when_ollama_is_unavailable(
    client: TestClient,
    fake_provider: FakeProvider,
) -> None:
    fake_provider.chat_error = OllamaUnavailableError(
        "Ollama is unavailable at http://localhost:11434."
    )

    response = client.post(
        "/api/v1/chat",
        json={"message": "Show me all my dresses", "user_id": "user-123"},
    )

    assert response.status_code == 503
    body = response.json()
    assert body["success"] is False
    assert body["error"] == "Agent request failed"
    assert "Ollama is unavailable" in (body["detail"] or "")
    assert body["metadata"]["user_message"]


def test_chat_ignores_llm_injected_intent_when_rule_matches(
    client: TestClient,
    fake_provider: FakeProvider,
) -> None:
    fake_provider.structured_result = IntentClassification(
        intent=Intent.IMAGE_ANALYSIS,
        confidence=0.9,
        reasoning="Should not be used because a rule matches.",
    )

    response = client.post(
        "/api/v1/chat",
        json={"message": "Identify this clothing item", "user_id": "user-123"},
    )

    assert response.status_code == 200
    assert response.json()["intent"] == "image_analysis"
    assert fake_provider.structured_calls == []
