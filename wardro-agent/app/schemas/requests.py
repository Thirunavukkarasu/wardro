"""API request models."""

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRequest(BaseModel):
    """A chat turn sent to the agent workflow.

    ``user_id``, ``household_id`` and ``profile_id`` are illustrative in this
    milestone. They are read from the body only in development; production
    identity must be supplied by authentication middleware.
    """

    model_config = ConfigDict(extra="forbid")

    message: str = Field(
        min_length=1,
        max_length=8000,
        description="The user's message.",
    )
    thread_id: str | None = Field(
        default=None,
        max_length=128,
        description="Conversation thread identifier. Generated when omitted.",
    )
    user_id: str | None = Field(
        default=None,
        max_length=128,
        description="DEVELOPMENT ONLY: trusted identity must come from auth middleware.",
    )
    household_id: str | None = Field(
        default=None,
        max_length=128,
        description="DEVELOPMENT ONLY: trusted household context must come from auth.",
    )
    profile_id: str | None = Field(
        default=None,
        max_length=128,
        description="DEVELOPMENT ONLY: trusted profile context must come from auth.",
    )
    firebase_token: str | None = Field(
        default=None,
        max_length=4096,
        description=(
            "DEVELOPMENT ONLY: Firebase ID token forwarded to the read-only "
            "wardrobe backend. Never logged, stored in graph state, or checkpointed. "
            "Replaced by the Bun internal-JWT proxy in the next milestone."
        ),
    )
    image_base64: str | None = Field(
        default=None,
        description=(
            "Base64 image data for a single-image analysis request. When present, "
            "the request is routed to the vision analyzer instead of the graph."
        ),
    )
    image_media_type: str = Field(
        default="image/jpeg",
        max_length=64,
        description="MIME type for image_base64.",
    )

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        """Reject whitespace-only messages after trimming."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("message must not be blank")
        return cleaned
