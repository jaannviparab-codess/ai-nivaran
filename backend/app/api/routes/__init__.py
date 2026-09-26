"""Aggregates every feature router under a single ``api_router`` so
``app.main`` only has to mount one prefix ("/api")."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import analytics, assistant, auth, issues

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(issues.router)
api_router.include_router(analytics.router)
api_router.include_router(assistant.router)

__all__ = ["api_router"]
