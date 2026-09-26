from __future__ import annotations

from pydantic import Field

from app.schemas.base import CamelModel


class GeoPoint(CamelModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class ApiError(CamelModel):
    message: str
    code: str | None = None
    field_errors: dict[str, str] | None = None
