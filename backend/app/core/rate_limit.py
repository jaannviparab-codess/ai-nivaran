"""Shared slowapi rate limiter, keyed by client IP."""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])


def rate_limit_default() -> str:
    """Rate limit string built from RATE_LIMIT_PER_MINUTE, for use on sensitive routes."""
    return f"{settings.RATE_LIMIT_PER_MINUTE}/minute"
