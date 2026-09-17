"""Auth dependencies.

Browsing and submitting issues is public (no login required), so most routes
use the optional-auth variant. Only ``GET /auth/me`` and moderator/admin
actions (``PATCH /issues/{id}``) require a real, valid Bearer token.
"""
from __future__ import annotations

import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


def _get_user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = decode_access_token(token)
    except TokenError:
        return None
    subject = payload.get("sub")
    if not subject:
        return None
    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        return None
    return db.execute(select(User).where(User.id == user_id)).scalars().first()


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    return _get_user_from_token(credentials.credentials, db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Authentication required. Provide a Bearer token.")
    user = _get_user_from_token(credentials.credentials, db)
    if user is None:
        raise UnauthorizedError("Invalid or expired token.")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated.")
    return user


def require_roles(*roles: UserRole):
    """Dependency factory: raises 403 unless the current user's role is one of
    ``roles``. Usage: ``Depends(require_roles(UserRole.moderator, UserRole.admin))``.
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenError("You do not have permission to perform this action.")
        return current_user

    return dependency
