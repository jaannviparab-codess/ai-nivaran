from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import IssueCategory, IssueSeverity

if TYPE_CHECKING:
    from app.models.issue import Issue


class IssueAIAnalysis(Base, UUIDPkMixin):
    __tablename__ = "issue_ai_analyses"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    detected_category: Mapped[IssueCategory] = mapped_column(
        SAEnum(IssueCategory, name="ai_detected_category", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[IssueSeverity] = mapped_column(
        SAEnum(IssueSeverity, name="ai_analysis_severity", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    safety_risk: Mapped[IssueSeverity] = mapped_column(
        SAEnum(IssueSeverity, name="ai_analysis_safety_risk", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    possible_causes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue: Mapped["Issue"] = relationship(back_populates="ai_analyses")
