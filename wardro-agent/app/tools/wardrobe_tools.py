"""Wardrobe context retrieval.

Milestone 1 intentionally has no inventory backend. The single function in this
module is the seam where the wardrobe service will be called in a later
milestone. It never fabricates garments: when data is unavailable it says so and
the agents are instructed to be explicit about that limitation.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class WardrobeItem:
    """A single garment in a user's wardrobe."""

    item_id: str
    name: str
    category: str
    colour: str | None = None
    notes: str | None = None


@dataclass(frozen=True, slots=True)
class WardrobeContext:
    """Wardrobe data available to an agent for one request."""

    items: tuple[WardrobeItem, ...] = field(default_factory=tuple)
    available: bool = False
    source: str = "unavailable"
    note: str = "No wardrobe backend is connected in this milestone. Do not invent items."

    def as_prompt_text(self) -> str:
        """Render the context as a compact block for a model prompt."""
        if not self.available:
            return f"Wardrobe data available: no. {self.note}"

        if not self.items:
            return (
                "Wardrobe data available: yes, but the wardrobe is currently empty. "
                f"Source: {self.source}."
            )

        lines = [f"Wardrobe data available: yes. Source: {self.source}. Items:"]
        lines.extend(
            f"- {item.name} ({item.category}"
            + (f", {item.colour}" if item.colour else "")
            + (f"; {item.notes}" if item.notes else "")
            + ")"
            for item in self.items
        )
        return "\n".join(lines)


def get_wardrobe_context(
    *,
    household_id: str | None = None,
    profile_id: str | None = None,
) -> WardrobeContext:
    """Return wardrobe data for a household/profile.

    This milestone deliberately returns an explicitly unavailable context rather
    than mock inventory, so agents cannot present fabricated garments as real.
    The parameters are accepted now so the call site does not change when the
    backend client is introduced.
    """
    del household_id, profile_id
    return WardrobeContext(available=False, source="unavailable")
