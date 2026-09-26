from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import IssueCategory, IssueSeverity, IssueStatus, Language

if TYPE_CHECKING:
    from app.models.ai_conversation import AIConversation
    from app.models.follow_up import FollowUp
    from app.models.issue_ai_analysis import IssueAIAnalysis
    from app.models.issue_comment import IssueComment
    from app.models.issue_confirmation import IssueConfirmation
    from app.models.issue_duplicate import IssueDuplicate
    from app.models.issue_image import IssueImage
    from app.models.issue_resolution import IssueResolution
    from app.models.issue_status_history import IssueStatusHistory
    from app.models.issue_verification import IssueVerification
    from app.models.notification import Notification
    from app.models.priority_score import PriorityScore
    from app.models.user import User


class Issue(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "issues"

    tracking_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    category: Mapped[IssueCategory] = mapped_column(
        SAEnum(IssueCategory, name="issue_category", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    severity: Mapped[IssueSeverity] = mapped_column(
        SAEnum(IssueSeverity, name="issue_severity", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    status: Mapped[IssueStatus] = mapped_column(
        SAEnum(IssueStatus, name="issue_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=IssueStatus.reported,
        server_default=IssueStatus.reported.value,
        index=True,
    )

    # --- Location (embedded directly on Issue; lat/lng indexed for geo queries) ---
    lat: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    lng: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_importance: Mapped[float] = mapped_column(Float, nullable=False, default=0.6, server_default="0.6")

    language: Mapped[Language | None] = mapped_column(
        SAEnum(Language, name="issue_language", values_callable=lambda e: [m.value for m in e]),
        nullable=True,
    )
    voice_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)

    reporter_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reporter_display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    reporter_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default="true")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")

    # Denormalized, incrementally-maintained aggregate estimates (avoid recomputing on every read).
    people_affected_estimate: Mapped[int] = mapped_column(Integer, default=1, nullable=False, server_default="1")
    grouped_report_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False, server_default="1")

    # When set, this Issue was merged into another (the "primary") issue as a duplicate report.
    duplicate_of_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True, index=True
    )

    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # --- Relationships ---
    reporter: Mapped["User | None"] = relationship(back_populates="reported_issues", foreign_keys=[reporter_id])

    duplicate_of: Mapped["Issue | None"] = relationship(
        "Issue", remote_side="Issue.id", foreign_keys=[duplicate_of_id], back_populates="duplicate_children"
    )
    duplicate_children: Mapped[list["Issue"]] = relationship(
        "Issue", back_populates="duplicate_of", foreign_keys=[duplicate_of_id]
    )

    images: Mapped[list["IssueImage"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueImage.created_at"
    )
    ai_analyses: Mapped[list["IssueAIAnalysis"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueAIAnalysis.created_at"
    )
    priority_scores: Mapped[list["PriorityScore"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="PriorityScore.calculated_at"
    )
    status_history: Mapped[list["IssueStatusHistory"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueStatusHistory.created_at"
    )
    confirmations: Mapped[list["IssueConfirmation"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueConfirmation.created_at"
    )
    comments: Mapped[list["IssueComment"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueComment.created_at"
    )
    resolutions: Mapped[list["IssueResolution"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueResolution.resolved_at"
    )
    verifications: Mapped[list["IssueVerification"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan", order_by="IssueVerification.created_at"
    )
    notifications: Mapped[list["Notification"]] = relationship(back_populates="issue", cascade="all, delete-orphan")
    follow_ups: Mapped[list["FollowUp"]] = relationship(back_populates="issue", cascade="all, delete-orphan")
    conversations: Mapped[list["AIConversation"]] = relationship(back_populates="issue", cascade="all, delete-orphan")

    duplicate_links_as_primary: Mapped[list["IssueDuplicate"]] = relationship(
        "IssueDuplicate",
        foreign_keys="IssueDuplicate.primary_issue_id",
        back_populates="primary_issue",
        cascade="all, delete-orphan",
    )
    duplicate_link_as_child: Mapped["IssueDuplicate | None"] = relationship(
        "IssueDuplicate",
        foreign_keys="IssueDuplicate.duplicate_issue_id",
        back_populates="duplicate_issue",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def latest_ai_analysis(self) -> "IssueAIAnalysis | None":
        return self.ai_analyses[-1] if self.ai_analyses else None

    @property
    def latest_priority_score(self) -> "PriorityScore | None":
        return self.priority_scores[-1] if self.priority_scores else None

    @property
    def latest_resolution(self) -> "IssueResolution | None":
        return self.resolutions[-1] if self.resolutions else None
