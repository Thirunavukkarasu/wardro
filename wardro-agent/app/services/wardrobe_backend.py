"""Read-only client for the Wardro wardrobe backend.

The Bun service remains the system of record. This client only reads the
profile-scoped inventory through the existing authenticated API; it never
writes. In development the Firebase ID token is forwarded from the app. Once
the Bun AI proxy lands, Bun will supply a short-lived internal context instead
and the raw token will disappear from this boundary.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import httpx

from app.config import Settings


class WardrobeBackendError(RuntimeError):
    """Raised when the wardrobe backend cannot return profile inventory."""

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True, slots=True)
class BackendWardrobeItem:
    """A wardrobe item as returned by the Bun API."""

    item_id: int
    name: str
    category: str | None = None
    colour: str | None = None
    brand: str | None = None
    size: str | None = None
    state: str | None = None
    photo_uri: str | None = None
    price: float | None = None
    wardrobe_id: int | None = None

    def as_dict(self) -> dict[str, Any]:
        """Return a JSON/checkpoint-safe representation."""
        return asdict(self)


class WardrobeBackendClient:
    """Minimal async reader for the profile-scoped wardrobe API."""

    def __init__(
        self,
        settings: Settings,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._base_url = settings.backend_api_url.rstrip("/")
        self._timeout = settings.wardrobe_backend_timeout
        self._transport = transport

    def _endpoint(self) -> str:
        if self._base_url.endswith("/api"):
            return f"{self._base_url}/wardrobeItems"
        return f"{self._base_url}/api/wardrobeItems"

    async def list_items(
        self,
        *,
        token: str,
        profile_id: str | int,
    ) -> list[BackendWardrobeItem]:
        """Fetch every item in the selected profile.

        Filtering is intentionally left to the agent for now. The inventory is
        small enough that one profile-scoped read is cheaper than several
        round-trips; once the item count grows, add query parameters to the
        backend instead of filtering a large payload in Python.
        """
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "X-Profile-Id": str(profile_id),
        }

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                transport=self._transport,
            ) as client:
                response = await client.get(self._endpoint(), headers=headers)
        except httpx.HTTPError as exc:
            raise WardrobeBackendError("Could not reach the wardrobe backend.") from exc

        if response.status_code == 401:
            raise WardrobeBackendError(
                "The wardrobe backend rejected the session token.",
                status_code=401,
            )
        if response.status_code == 404:
            raise WardrobeBackendError(
                "The selected profile was not found.",
                status_code=404,
            )
        if not response.is_success:
            raise WardrobeBackendError(
                f"The wardrobe backend returned {response.status_code}.",
                status_code=response.status_code,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise WardrobeBackendError("The wardrobe backend returned invalid JSON.") from exc

        rows = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(rows, list):
            raise WardrobeBackendError(
                "The wardrobe backend response did not contain an item list."
            )

        return [self._map_item(row) for row in rows if isinstance(row, dict)]

    @staticmethod
    def _map_item(row: dict[str, Any]) -> BackendWardrobeItem:
        raw_id = row.get("id")
        try:
            item_id = int(raw_id)
        except (TypeError, ValueError) as exc:
            raise WardrobeBackendError(
                "The wardrobe backend returned an item without a valid id."
            ) from exc

        price = row.get("price")
        try:
            price_value = float(price) if price is not None else None
        except (TypeError, ValueError):
            price_value = None

        wardrobe_id = row.get("wardrobeId")
        try:
            wardrobe_id_value = int(wardrobe_id) if wardrobe_id is not None else None
        except (TypeError, ValueError):
            wardrobe_id_value = None

        return BackendWardrobeItem(
            item_id=item_id,
            name=str(row.get("itemName") or row.get("item_name") or "Untitled item"),
            category=_optional_text(row.get("category")),
            colour=_optional_text(row.get("color") or row.get("colour")),
            brand=_optional_text(row.get("brand")),
            size=_optional_text(row.get("size")),
            state=_optional_text(row.get("state")),
            photo_uri=_optional_text(row.get("photoUri") or row.get("photo_uri")),
            price=price_value,
            wardrobe_id=wardrobe_id_value,
        )


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
