"""Wardrobe context for the agents.

The API layer fetches a profile-scoped inventory snapshot and puts it in graph
state. This module turns that snapshot into a prompt block. If no snapshot is
available (for example, the request carried no development token), the context
is explicitly unavailable so agents cannot invent garments.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class WardrobeItem:
    """A single garment in a user's wardrobe."""

    item_id: str
    name: str
    category: str
    colour: str | None = None
    brand: str | None = None
    size: str | None = None
    state: str | None = None
    photo_uri: str | None = None
    notes: str | None = None

    @classmethod
    def from_snapshot(cls, row: dict[str, Any]) -> "WardrobeItem":
        """Build an item from the API's serialized inventory snapshot."""
        return cls(
            item_id=str(row.get("item_id") or row.get("id") or ""),
            name=str(row.get("name") or row.get("itemName") or "Untitled item"),
            category=str(row.get("category") or "Uncategorised"),
            colour=_optional_text(row.get("colour") or row.get("color")),
            brand=_optional_text(row.get("brand")),
            size=_optional_text(row.get("size")),
            state=_optional_text(row.get("state")),
            photo_uri=_optional_text(row.get("photo_uri") or row.get("photoUri")),
            notes=_optional_text(row.get("notes")),
        )


@dataclass(frozen=True, slots=True)
class WardrobeContext:
    """Wardrobe data available to an agent for one request."""

    items: tuple[WardrobeItem, ...] = field(default_factory=tuple)
    available: bool = False
    source: str = "unavailable"
    note: str = "No profile inventory was supplied for this request. Do not invent items."

    @classmethod
    def from_snapshot(cls, payload: dict[str, Any] | None) -> "WardrobeContext":
        """Build context from the serializable snapshot in graph state."""
        if not payload:
            return cls()

        rows = payload.get("items")
        items: tuple[WardrobeItem, ...] = ()
        if isinstance(rows, list):
            items = tuple(WardrobeItem.from_snapshot(row) for row in rows if isinstance(row, dict))

        return cls(
            items=items,
            available=bool(payload.get("available")),
            source=str(payload.get("source") or "backend"),
            note=str(payload.get("note") or ""),
        )

    def as_prompt_text(self) -> str:
        """Render the context as a compact block for a model prompt."""
        if not self.available:
            return f"Wardrobe data available: no. {self.note}"

        if not self.items:
            return (
                "Wardrobe data available: yes, but the wardrobe is currently empty. "
                f"Source: {self.source}."
            )

        lines = [f"Wardrobe data available: yes. Source: {self.source}. Items ({len(self.items)}):"]
        lines.extend(
            f"- [item {item.item_id}] {item.name} ({item.category}"
            + (f"; colour {item.colour}" if item.colour else "")
            + (f"; brand {item.brand}" if item.brand else "")
            + (f"; size {item.size}" if item.size else "")
            + (f"; state {item.state}" if item.state else "")
            + ")"
            for item in self.items
        )
        return "\n".join(lines)


def get_wardrobe_context(
    *,
    household_id: str | None = None,
    profile_id: str | None = None,
) -> WardrobeContext:
    """Return an explicit unavailable context when no inventory was fetched."""
    del household_id, profile_id
    return WardrobeContext(available=False, source="unavailable")


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
