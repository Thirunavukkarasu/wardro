"""Firebase ID-token verification for authenticated chat requests.

Local development can continue to use request-body identity. Deployed
environments require an ``Authorization: Bearer <Firebase ID token>`` header;
the verified uid becomes the trusted user context, and the same token is
forwarded to the read-only wardrobe backend.
"""

import logging
import threading
from dataclasses import dataclass
from typing import Annotated

import firebase_admin
from fastapi import Depends, Header, Request
from firebase_admin import auth as firebase_auth

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)
_init_lock = threading.Lock()


@dataclass(frozen=True, slots=True)
class VerifiedFirebaseUser:
    """A verified Firebase identity and the token that proved it."""

    uid: str
    token: str


def _firebase_app(settings: Settings):
    """Return the Firebase Admin app, initialising it with ADC once."""
    with _init_lock:
        try:
            return firebase_admin.get_app()
        except ValueError:
            return firebase_admin.initialize_app(
                options={"projectId": settings.firebase_project_id}
            )


def verify_firebase_id_token(
    token: str,
    settings: Settings,
) -> VerifiedFirebaseUser | None:
    """Verify a Firebase ID token and return its uid, or ``None``."""
    try:
        app = _firebase_app(settings)
        decoded = firebase_auth.verify_id_token(
            token,
            app=app,
            check_revoked=False,
        )
    except Exception as exc:  # noqa: BLE001 - invalid tokens are a normal outcome
        logger.warning("Firebase token verification failed: %s", exc)
        return None

    uid = decoded.get("uid") or decoded.get("sub")
    if not isinstance(uid, str) or not uid:
        return None
    return VerifiedFirebaseUser(uid=uid, token=token)


async def get_verified_firebase_user(
    request: Request,
    authorization: str | None = Header(default=None),
) -> VerifiedFirebaseUser | None:
    """Resolve a verified user from the Authorization header, when present."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    settings = getattr(request.app.state, "settings", None) or get_settings()
    return verify_firebase_id_token(token, settings)


VerifiedUserDep = Annotated[
    VerifiedFirebaseUser | None,
    Depends(get_verified_firebase_user),
]
