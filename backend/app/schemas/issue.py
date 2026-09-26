from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.models.enums import ImageKind, IssueCategory, IssueSeverity, IssueStatus, Language, StatusActor
from app.schemas.base import CamelModel
from app.schemas.common import GeoPoint


class IssueLocation(GeoPoint):
    address: str | None = Field(default=None, max_length=500)
    ward: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    landmark: str | None = Field(default=None, max_length=255)
    location_importance: float | None = Field(default=None, ge=0, le=1)


class IssueImageSchema(CamelModel):
    id: str
    url: str
    kind: ImageKind
    caption: str | None = None
    created_at: datetime


class AIAnalysisSchema(CamelModel):
    id: str
    issue_id: str
    detected_category: IssueCategory
    confidence: float = Field(ge=0, le=1)
    severity: IssueSeverity
    safety_risk: IssueSeverity
    summary: str
    possible_causes: list[str]
    is_demo: bool
    model_version: str
    created_at: datetime


class PriorityFactor(CamelModel):
    label: str
    weight: float
    contribution: float
    detail: str


class PriorityScoreBreakdown(CamelModel):
    score: float = Field(ge=0, le=100)
    factors: list[PriorityFactor]
    calculated_at: datetime


class StatusHistoryEntry(CamelModel):
    id: str
    status: IssueStatus
    note: str | None = None
    actor: StatusActor
    created_at: datetime


class IssueConfirmationSummary(CamelModel):
    total: int
    still_present: int
    resolved: int
    people_affected_estimate: int


class IssueCommentSchema(CamelModel):
    id: str
    issue_id: str
    author_name: str
    message: str
    created_at: datetime


class DuplicateGroupInfo(CamelModel):
    is_duplicate_group: bool
    primary_issue_id: str
    grouped_report_count: int
    confirmations: int


class IssueResolutionSchema(CamelModel):
    resolved_at: datetime
    before_image_url: str | None = None
    after_image_url: str | None = None
    resolution_note: str | None = None
    resolved_by_label: str | None = None


class Issue(CamelModel):
    id: str
    tracking_id: str
    title: str
    description: str
    category: IssueCategory
    severity: IssueSeverity
    status: IssueStatus
    location: IssueLocation
    images: list[IssueImageSchema]
    ai_analysis: AIAnalysisSchema | None = None
    priority_score: PriorityScoreBreakdown | None = None
    status_history: list[StatusHistoryEntry]
    confirmations: IssueConfirmationSummary
    duplicate_info: DuplicateGroupInfo | None = None
    resolution: IssueResolutionSchema | None = None
    reported_at: datetime
    updated_at: datetime
    days_open: int
    reporter_display_name: str | None = None
    is_demo: bool | None = None


class IssueListItem(CamelModel):
    id: str
    tracking_id: str
    title: str
    category: IssueCategory
    severity: IssueSeverity
    status: IssueStatus
    location: GeoPoint
    priority_score: float
    confirmation_count: int
    reported_at: datetime
    thumbnail_url: str | None = None


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class CreateIssuePayload(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=3, max_length=5000)
    category: IssueCategory | None = None
    location: IssueLocation
    image_base64: str | None = Field(default=None, max_length=20_000_000)
    voice_transcript: str | None = Field(default=None, max_length=5000)
    language: Language | None = None
    reporter_display_name: str | None = Field(default=None, max_length=120)
    reporter_contact: str | None = Field(default=None, max_length=255)
    is_public: bool | None = True


class AnalyzeIssueResponse(CamelModel):
    analysis: AIAnalysisSchema
    priority: PriorityScoreBreakdown
    possible_duplicates: list[IssueListItem]
    suggested_title: str


class ConfirmIssueRequest(CamelModel):
    still_present: bool


class ConfirmIssueResponse(CamelModel):
    confirmations: int


class VerifyIssueRequest(CamelModel):
    confirmed: bool


class PatchIssueRequest(CamelModel):
    status: IssueStatus | None = None
    note: str | None = Field(default=None, max_length=2000)
