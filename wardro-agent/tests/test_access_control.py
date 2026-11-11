"""Tests for trusted-context resolution."""

import pytest

from app.config import Settings
from app.policies.access_control import (
    ContextResolutionError,
    resolve_trusted_context,
)


def _settings(environment: str) -> Settings:
    return Settings(app_env=environment, _env_file=None)


def test_verified_firebase_identity_wins() -> None:
    context = resolve_trusted_context(
        settings=_settings("production"),
        user_id="spoofed",
        household_id=None,
        profile_id="profile-1",
        thread_id="thread-1",
        verified_user_id="firebase-uid",
    )

    assert context.user_id == "firebase-uid"
    assert context.profile_id == "profile-1"
    assert context.identity_source == "firebase_token"


def test_production_rejects_unverified_identity() -> None:
    with pytest.raises(ContextResolutionError):
        resolve_trusted_context(
            settings=_settings("production"),
            user_id="body-user",
            household_id=None,
            profile_id="profile-1",
            thread_id="thread-1",
        )


def test_development_keeps_body_identity() -> None:
    context = resolve_trusted_context(
        settings=_settings("development"),
        user_id="dev-user",
        household_id=None,
        profile_id="profile-1",
        thread_id="thread-1",
    )

    assert context.user_id == "dev-user"
    assert context.identity_source == "development_request_body"
