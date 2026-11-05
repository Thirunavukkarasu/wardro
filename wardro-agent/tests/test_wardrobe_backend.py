"""Read-only wardrobe backend client tests (no live server required)."""

import httpx
import pytest

from app.config import Settings
from app.services.wardrobe_backend import (
    WardrobeBackendClient,
    WardrobeBackendError,
)
from app.tools.wardrobe_tools import WardrobeContext


def make_settings(**overrides: object) -> Settings:
    return Settings(
        _env_file=None,
        backend_api_url="http://backend.test",
        wardrobe_backend_timeout=2.0,
        **overrides,
    )


async def test_list_items_maps_profile_scoped_rows() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == "http://backend.test/api/wardrobeItems"
        assert request.headers["Authorization"] == "Bearer token-123"
        assert request.headers["X-Profile-Id"] == "6"
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "id": 26,
                        "itemName": "Black Crew T-Shirt",
                        "category": "Tops",
                        "color": "Black",
                        "brand": "Atelier Nord",
                        "size": "M",
                        "state": "in_use",
                        "photoUri": "http://localhost:3000/demo/images/tiru-black-crew-tshirt.jpg",
                        "price": 1200,
                        "wardrobeId": 10,
                    }
                ]
            },
        )

    client = WardrobeBackendClient(
        make_settings(),
        transport=httpx.MockTransport(handler),
    )
    items = await client.list_items(token="token-123", profile_id="6")

    assert len(items) == 1
    item = items[0]
    assert item.item_id == 26
    assert item.name == "Black Crew T-Shirt"
    assert item.category == "Tops"
    assert item.colour == "Black"
    assert item.brand == "Atelier Nord"
    assert item.size == "M"
    assert item.state == "in_use"
    assert item.price == 1200.0
    assert item.wardrobe_id == 10


async def test_list_items_surfaces_auth_failure_without_the_token() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "Invalid or expired token"})

    client = WardrobeBackendClient(
        make_settings(),
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(WardrobeBackendError) as error:
        await client.list_items(token="super-secret-token", profile_id="6")

    assert error.value.status_code == 401
    assert "super-secret-token" not in str(error.value)


def test_wardrobe_context_renders_snapshot_items() -> None:
    context = WardrobeContext.from_snapshot(
        {
            "available": True,
            "source": "backend",
            "note": "",
            "items": [
                {
                    "item_id": 26,
                    "name": "Black Crew T-Shirt",
                    "category": "Tops",
                    "colour": "Black",
                    "brand": "Atelier Nord",
                    "size": "M",
                    "state": "in_use",
                }
            ],
        }
    )

    prompt = context.as_prompt_text()
    assert "Wardrobe data available: yes" in prompt
    assert "[item 26] Black Crew T-Shirt" in prompt
    assert "colour Black" in prompt


def test_wardrobe_context_is_explicitly_unavailable_without_a_snapshot() -> None:
    context = WardrobeContext.from_snapshot(None)

    assert context.available is False
    assert "Do not invent items" in context.as_prompt_text()
