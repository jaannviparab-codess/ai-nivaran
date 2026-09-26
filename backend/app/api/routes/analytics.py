"""Analytics endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.camel_route import CamelCaseRoute
from app.db.session import get_db
from app.schemas.analytics import AnalyticsSnapshot
from app.services.analytics_service import get_analytics_snapshot

router = APIRouter(prefix="/analytics", tags=["analytics"], route_class=CamelCaseRoute)


@router.get("", response_model=AnalyticsSnapshot)
def get_analytics(db: Session = Depends(get_db)) -> AnalyticsSnapshot:
    return get_analytics_snapshot(db)
