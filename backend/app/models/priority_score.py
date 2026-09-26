from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID

if TYPE_CHECKING:
    from app.models.issue import Issue


class PriorityScore(Base, UUIDPkMixin):
    __tablename__ = "priority_scores"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    # List of {label, weight, contribution, detail} dicts -- see PriorityFactor schema.
    factors: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue: Mapped["Issue"] = relationship(back_populates="priority_scores")
