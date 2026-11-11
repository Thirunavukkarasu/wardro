"""Trusted-context resolution and development-only identity injection.

Production identity must come from verified authentication middleware. Until
that middleware exists, this module exposes an explicit, opt-in development path
that reads identity from the request body *only* when ``APP_ENV=development``.
Outside development it refuses to trust client-supplied identity.
"""

import logging
from dataclasses import dataclass
from typing import Literal
from uuid import uuid4

from app.config import Settings

logger = logging.getLogger(__name__)

DEVELOPMENT_IDENTITY_SOURCE = "development_request_body"


class ContextResolutionError(ValueError):
    """Raised when trusted request context cannot be established."""


@dataclass(frozen=True, slots=True)
class TrustedRequestContext:
    """Identity and conversation context resolved by the application boundary."""

    user_id: str
    household_id: str | None
    profile_id: str | None
    thread_id: str
    identity_source: Literal["development_request_body", "firebase_token"] = (
        DEVELOPMENT_IDENTITY_SOURCE
    )


def resolve_trusted_context(
    *,
    settings: Settings,
    user_id: str | None,
    household_id: str | None,
    profile_id: str | None,
    thread_id: str | None,
    verified_user_id: str | None = None,
) -> TrustedRequestContext:
    """Resolve identity for a chat request.

    A verified Firebase uid always wins. Development can fall back to the
    request body; every other environment refuses unverified identity.
    """
    if verified_user_id:
        return TrustedRequestContext(
            user_id=verified_user_id,
            household_id=_optional_value(household_id),
            profile_id=_optional_value(profile_id),
            thread_id=_optional_value(thread_id) or f"thread-{uuid4().hex}",
            identity_source="firebase_token",
        )

    if not settings.is_development:
        raise ContextResolutionError(
            "Authenticated identity is required. Send a valid Firebase ID token."
        )

    resolved_user_id = (user_id or "").strip()
    if not resolved_user_id:
        raise ContextResolutionError(
            "user_id is required when development-only context injection is enabled."
        )

    logger.debug(
        "Using development-only identity injection for user_id=%s (not authenticated)",
        resolved_user_id,
    )

    return TrustedRequestContext(
        user_id=resolved_user_id,
        household_id=_optional_value(household_id),
        profile_id=_optional_value(profile_id),
        thread_id=_optional_value(thread_id) or f"thread-{uuid4().hex}",
    )


def _optional_value(value: str | None) -> str | None:
    cleaned = (value or "").strip()
    return cleaned or None
