"""Core issue orchestration: AI analysis, persistence, status transitions,
confirmations, and ORM -> API-schema serialization.

This is the single place that knows how an ``Issue`` ORM row (plus its child
rows) maps onto the frontend's ``Issue`` / ``IssueListItem`` JSON shape, so
routes stay thin.
"""
from __future__ import annotations

import random
import string
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.errors import ApiException
from app.models.enums import (
    ImageKind,
    IssueCategory,
    IssueSeverity,
    IssueStatus,
    RESOLVED_LIKE_STATUSES,
    StatusActor,
)
from app.models.issue import Issue
from app.models.issue_ai_analysis import IssueAIAnalysis
from app.models.issue_confirmation import IssueConfirmation
from app.models.issue_image import IssueImage
from app.models.issue_resolution import IssueResolution
from app.models.issue_status_history import IssueStatusHistory
from app.models.issue_verification import IssueVerification
from app.models.priority_score import PriorityScore
from app.models.user import User
from app.schemas.common import GeoPoint
from app.schemas.issue import (
    AIAnalysisSchema,
    AnalyzeIssueResponse,
    CreateIssuePayload,
    DuplicateGroupInfo,
    Issue as IssueSchema,
    IssueConfirmationSummary,
    IssueImageSchema,
    IssueListItem,
    IssueLocation,
    IssueResolutionSchema,
    PriorityFactor,
    PriorityScoreBreakdown,
    StatusHistoryEntry,
)
from app.services.ai import duplicate_detection
from app.services.ai.llm_service import build_possible_causes, build_summary, safety_risk_for
from app.services.ai.priority_engine import PriorityResult, calculate_priority, default_location_importance
from app.services.ai.provider_factory import get_llm_provider, get_vision_provider
from app.services.image_service import get_image_bytes, save_base64_image
from app.services.placeholder_service import category_placeholder_url

SEVERITY_ORDER: dict[IssueSeverity, int] = {
    IssueSeverity.low: 0,
    IssueSeverity.medium: 1,
    IssueSeverity.high: 2,
    IssueSeverity.critical: 3,
}

CONFIRMATION_PEOPLE_AFFECTED_BUMP = 3


def generate_tracking_id() -> str:
    year = datetime.now(timezone.utc).year
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"NVR-{year}-{rand}"


# ---------------------------------------------------------------------------
# AI analysis (shared by the preview /analyze endpoint and real creation)
# ---------------------------------------------------------------------------


@dataclass
class AnalysisOutcome:
    category: IssueCategory
    confidence: float
    severity: IssueSeverity
    safety_risk: IssueSeverity
    summary: str
    possible_causes: list[str]
    is_demo: bool
    model_version: str


def run_ai_analysis(
    description: str,
    language: str | None,
    category_hint: IssueCategory | None,
    image_bytes: bytes | None,
) -> AnalysisOutcome:
    """Combines the text-classification (LLM) provider with the image (vision)
    provider when a photo is available. Text is treated as the primary signal
    (it carries the citizen's own words); the vision hint is used to fill in a
    category when text classification couldn't confidently pick one, and to
    push severity upward (never downward) when the photo implies a worse
    situation than the text alone suggests -- appropriate caution for a public
    safety tool.
    """
    llm_result = get_llm_provider().classify_and_summarize(description, language, category_hint)

    category = llm_result.category
    confidence = llm_result.confidence
    severity = llm_result.severity
    is_demo = llm_result.is_demo

    if image_bytes:
        vision_result = get_vision_provider().analyze_image(image_bytes, description)
        if category == IssueCategory.other and vision_result.category_hint:
            category = vision_result.category_hint
        confidence = round(min(0.97, confidence * 0.65 + vision_result.confidence * 0.35), 2)
        if vision_result.severity_hint and SEVERITY_ORDER[vision_result.severity_hint] > SEVERITY_ORDER[severity]:
            severity = vision_result.severity_hint
        is_demo = is_demo or vision_result.is_demo

    if category != llm_result.category:
        summary = build_summary(category)
        possible_causes = build_possible_causes(category)
    else:
        summary = llm_result.summary
        possible_causes = llm_result.possible_causes

    return AnalysisOutcome(
        category=category,
        confidence=confidence,
        severity=severity,
        safety_risk=safety_risk_for(severity),
        summary=summary,
        possible_causes=possible_causes,
        is_demo=is_demo,
        model_version=llm_result.model_version,
    )


def _priority_result_to_schema(result: PriorityResult) -> PriorityScoreBreakdown:
    return PriorityScoreBreakdown(
        score=result.score,
        factors=[
            PriorityFactor(label=f.label, weight=f.weight, contribution=f.contribution, detail=f.detail)
            for f in result.factors
        ],
        calculated_at=result.calculated_at,
    )


def analyze_draft(db: Session, payload: CreateIssuePayload) -> AnalyzeIssueResponse:
    """Preview step: runs the full analysis pipeline but persists nothing."""
    image_bytes = get_image_bytes(payload.image_base64) if payload.image_base64 else None
    language_value = payload.language.value if payload.language else None
    outcome = run_ai_analysis(payload.description, language_value, payload.category, image_bytes)

    location_importance = payload.location.location_importance

    duplicates = duplicate_detection.find_possible_duplicates(
        db,
        category=outcome.category,
        lat=payload.location.lat,
        lng=payload.location.lng,
        description=payload.description,
    )
    people_affected = 1
    if duplicates:
        people_affected = len(duplicates) * duplicate_detection.PEOPLE_AFFECTED_PER_DUPLICATE + 1

    priority = calculate_priority(
        severity=outcome.severity,
        safety_risk=outcome.safety_risk,
        people_affected=people_affected,
        days_open=0,
        location_importance=location_importance,
    )

    analysis_schema = AIAnalysisSchema(
        id=f"draft-ai-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        issue_id="draft",
        detected_category=outcome.category,
        confidence=outcome.confidence,
        severity=outcome.severity,
        safety_risk=outcome.safety_risk,
        summary=outcome.summary,
        possible_causes=outcome.possible_causes,
        is_demo=outcome.is_demo,
        model_version=outcome.model_version,
        created_at=datetime.now(timezone.utc),
    )

    from app.services.ai.llm_service import CATEGORY_LABELS_EN

    location_label = payload.location.ward or payload.location.address or "your location"
    suggested_title = f"{CATEGORY_LABELS_EN[outcome.category]} reported near {location_label}"

    return AnalyzeIssueResponse(
        analysis=analysis_schema,
        priority=_priority_result_to_schema(priority),
        possible_duplicates=[serialize_issue_list_item(c.issue) for c in duplicates],
        suggested_title=suggested_title,
    )


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def create_issue(db: Session, payload: CreateIssuePayload, current_user: User | None) -> Issue:
    image_bytes = get_image_bytes(payload.image_base64) if payload.image_base64 else None
    language_value = payload.language.value if payload.language else None
    outcome = run_ai_analysis(payload.description, language_value, payload.category, image_bytes)

    location_importance = payload.location.location_importance
    if location_importance is None:
        location_importance = default_location_importance(outcome.severity)

    tracking_id = generate_tracking_id()
    while db.execute(select(Issue.id).where(Issue.tracking_id == tracking_id)).first():
        tracking_id = generate_tracking_id()  # pragma: no cover - astronomically unlikely

    reporter_display_name = payload.reporter_display_name or (
        current_user.display_name if current_user else "Anonymous Citizen"
    )

    issue = Issue(
        tracking_id=tracking_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=outcome.category,
        severity=outcome.severity,
        status=IssueStatus.ai_analyzed,
        lat=payload.location.lat,
        lng=payload.location.lng,
        address=payload.location.address,
        ward=payload.location.ward,
        city=payload.location.city,
        landmark=payload.location.landmark,
        location_importance=location_importance,
        language=payload.language,
        voice_transcript=payload.voice_transcript,
        reporter_id=current_user.id if current_user else None,
        reporter_display_name=reporter_display_name,
        reporter_contact=payload.reporter_contact,
        is_public=payload.is_public if payload.is_public is not None else True,
        is_demo=False,
        people_affected_estimate=1,
        grouped_report_count=1,
    )
    db.add(issue)
    db.flush()  # assigns issue.id for use by child rows below

    if image_bytes:
        image_url = save_base64_image(payload.image_base64, subdir="issues")
        caption = "Photo submitted with the report"
    else:
        image_url = category_placeholder_url(outcome.category, "report")
        caption = "Demo placeholder image (no photo was submitted with this report)"
    db.add(IssueImage(issue_id=issue.id, url=image_url, kind=ImageKind.report, caption=caption))

    db.add(
        IssueAIAnalysis(
            issue_id=issue.id,
            detected_category=outcome.category,
            confidence=outcome.confidence,
            severity=outcome.severity,
            safety_risk=outcome.safety_risk,
            summary=outcome.summary,
            possible_causes=outcome.possible_causes,
            is_demo=outcome.is_demo,
            model_version=outcome.model_version,
        )
    )

    db.add(
        IssueStatusHistory(
            issue_id=issue.id,
            status=IssueStatus.reported,
            actor=StatusActor.citizen,
            note="Report submitted by citizen.",
        )
    )
    db.add(
        IssueStatusHistory(
            issue_id=issue.id,
            status=IssueStatus.ai_analyzed,
            actor=StatusActor.ai,
            note="AI classified the issue and generated a priority estimate.",
        )
    )

    # The reporter's own submission counts as an implicit "still present" confirmation.
    db.add(
        IssueConfirmation(
            issue_id=issue.id,
            still_present=True,
            confirmer_id=current_user.id if current_user else None,
            confirmer_display_name=reporter_display_name,
        )
    )

    # Duplicate detection + grouping. May bump issue.people_affected_estimate
    # (via the match branch below) and the matched primary's own counters.
    match = duplicate_detection.group_or_create(db, issue)
    if match is not None:
        primary = match.issue
        db.add(
            IssueConfirmation(
                issue_id=primary.id,
                still_present=True,
                confirmer_display_name=reporter_display_name,
            )
        )
        db.add(
            IssueStatusHistory(
                issue_id=primary.id,
                status=primary.status,
                actor=StatusActor.system,
                note=f"Another citizen report ({issue.tracking_id}) was merged into this issue.",
            )
        )

    priority = calculate_priority(
        severity=outcome.severity,
        safety_risk=outcome.safety_risk,
        people_affected=issue.people_affected_estimate,
        days_open=0,
        location_importance=issue.location_importance,
    )
    db.add(
        PriorityScore(
            issue_id=issue.id,
            score=priority.score,
            factors=[
                {"label": f.label, "weight": f.weight, "contribution": f.contribution, "detail": f.detail}
                for f in priority.factors
            ],
        )
    )

    db.commit()
    db.refresh(issue)
    return issue


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def _recent_still_present_count(issue: Issue) -> int:
    """Counts "still present" confirmations recorded since the issue's most
    recent resolution -- confirmations from before that resolution shouldn't
    count towards reopening it again."""
    resolution = issue.latest_resolution
    cutoff = _aware(resolution.resolved_at) if resolution else None
    return sum(
        1
        for c in issue.confirmations
        if c.still_present and (cutoff is None or _aware(c.created_at) >= cutoff)
    )


def confirm_issue(db: Session, issue: Issue, still_present: bool, confirmer: User | None) -> int:
    issue.confirmations.append(
        IssueConfirmation(
            still_present=still_present,
            confirmer_id=confirmer.id if confirmer else None,
            confirmer_display_name=confirmer.display_name if confirmer else None,
        )
    )
    # Flush so the new confirmation's server-generated `created_at` is
    # populated before _recent_still_present_count() reads it below.
    db.flush()

    if still_present:
        issue.people_affected_estimate = (issue.people_affected_estimate or 0) + CONFIRMATION_PEOPLE_AFFECTED_BUMP

        if issue.status in RESOLVED_LIKE_STATUSES:
            recent_still_present = _recent_still_present_count(issue)
            if recent_still_present >= settings.REOPEN_CONFIRMATION_THRESHOLD:
                issue.status = IssueStatus.reopened
                issue.status_history.append(
                    IssueStatusHistory(
                        status=IssueStatus.reopened,
                        actor=StatusActor.system,
                        note=(
                            f"Reopened automatically after {recent_still_present} citizens reported "
                            "the issue is still present."
                        ),
                    )
                )

    db.commit()
    db.refresh(issue)
    return len(issue.confirmations)


def verify_issue(db: Session, issue: Issue, confirmed: bool, verifier: User | None) -> Issue:
    issue.verifications.append(IssueVerification(confirmed=confirmed, verifier_id=verifier.id if verifier else None))

    new_status = IssueStatus.citizen_verified if confirmed else IssueStatus.reopened
    issue.status = new_status
    issue.status_history.append(
        IssueStatusHistory(
            status=new_status,
            actor=StatusActor.citizen,
            note=(
                "Citizen confirmed the fix is holding."
                if confirmed
                else "Citizen reported the issue is still present after being marked resolved."
            ),
        )
    )
    db.commit()
    db.refresh(issue)
    return issue


def patch_issue_status(db: Session, issue: Issue, new_status: IssueStatus | None, note: str | None, actor_user: User) -> Issue:
    if new_status is not None and new_status != issue.status:
        issue.status = new_status
        issue.status_history.append(
            IssueStatusHistory(
                status=new_status,
                actor=StatusActor.authority,
                note=note or f"Status updated to {new_status.value.replace('_', ' ')}.",
            )
        )
        if new_status in RESOLVED_LIKE_STATUSES:
            issue.resolutions.append(
                IssueResolution(
                    resolution_note=note,
                    resolved_by_label=actor_user.display_name,
                    resolved_by_user_id=actor_user.id,
                )
            )
        if new_status not in (IssueStatus.reported, IssueStatus.ai_analyzed):
            issue.is_escalated = False
    elif note:
        issue.status_history.append(IssueStatusHistory(status=issue.status, actor=StatusActor.authority, note=note))

    db.commit()
    db.refresh(issue)
    return issue


# ---------------------------------------------------------------------------
# Querying
# ---------------------------------------------------------------------------


def _issue_query():
    return select(Issue).options(
        selectinload(Issue.images),
        selectinload(Issue.ai_analyses),
        selectinload(Issue.status_history),
        selectinload(Issue.confirmations),
        selectinload(Issue.resolutions),
        selectinload(Issue.verifications),
        selectinload(Issue.duplicate_of).selectinload(Issue.confirmations),
    )


def get_issue_by_id(db: Session, issue_id: uuid.UUID) -> Issue | None:
    return db.execute(_issue_query().where(Issue.id == issue_id)).scalars().first()


def get_issue_by_tracking_id(db: Session, tracking_id: str) -> Issue | None:
    return db.execute(_issue_query().where(Issue.tracking_id == tracking_id.strip())).scalars().first()


def parse_csv_enum(value: str | None, enum_cls, field_name: str) -> list | None:
    if not value:
        return None
    items = []
    for token in value.split(","):
        token = token.strip()
        if not token:
            continue
        try:
            items.append(enum_cls(token))
        except ValueError as exc:
            raise ApiException(
                f"Invalid {field_name}: '{token}'.", status_code=400, code="INVALID_FILTER"
            ) from exc
    return items or None


def list_issues(
    db: Session,
    category: list[IssueCategory] | None = None,
    severity: list[IssueSeverity] | None = None,
    status: list[IssueStatus] | None = None,
    search: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[Issue]:
    query = (
        select(Issue)
        .where(Issue.duplicate_of_id.is_(None))
        .options(
            selectinload(Issue.images),
            selectinload(Issue.ai_analyses),
            selectinload(Issue.confirmations),
        )
        .order_by(Issue.reported_at.desc())
    )
    if category:
        query = query.where(Issue.category.in_(category))
    if severity:
        query = query.where(Issue.severity.in_(severity))
    if status:
        query = query.where(Issue.status.in_(status))
    if search:
        like = f"%{search.strip()}%"
        query = query.where(or_(Issue.title.ilike(like), Issue.tracking_id.ilike(like)))
    if date_from:
        query = query.where(Issue.reported_at >= date_from)
    if date_to:
        query = query.where(Issue.reported_at <= date_to)

    return list(db.execute(query).scalars().unique().all())


# ---------------------------------------------------------------------------
# Serialization (ORM -> API schema)
# ---------------------------------------------------------------------------


def _days_open(issue: Issue) -> int:
    if issue.status in RESOLVED_LIKE_STATUSES:
        return 0
    delta = datetime.now(timezone.utc) - _aware(issue.reported_at)
    return max(0, delta.days)


def _current_priority_breakdown(issue: Issue) -> PriorityScoreBreakdown:
    analysis = issue.latest_ai_analysis
    severity = analysis.severity if analysis else issue.severity
    safety_risk = analysis.safety_risk if analysis else issue.severity
    result = calculate_priority(
        severity=severity,
        safety_risk=safety_risk,
        people_affected=issue.people_affected_estimate,
        days_open=_days_open(issue),
        location_importance=issue.location_importance,
    )
    return _priority_result_to_schema(result)


def _confirmation_summary(issue: Issue) -> IssueConfirmationSummary:
    confirmations = issue.confirmations or []
    still_present = sum(1 for c in confirmations if c.still_present)
    resolved = sum(1 for c in confirmations if not c.still_present)
    return IssueConfirmationSummary(
        total=len(confirmations),
        still_present=still_present,
        resolved=resolved,
        people_affected_estimate=issue.people_affected_estimate,
    )


def _duplicate_info(issue: Issue) -> DuplicateGroupInfo | None:
    if issue.duplicate_of_id is not None and issue.duplicate_of is not None:
        primary = issue.duplicate_of
        return DuplicateGroupInfo(
            is_duplicate_group=True,
            primary_issue_id=str(primary.id),
            grouped_report_count=primary.grouped_report_count,
            confirmations=len(primary.confirmations) if primary.confirmations else primary.grouped_report_count,
        )
    if issue.grouped_report_count and issue.grouped_report_count > 1:
        return DuplicateGroupInfo(
            is_duplicate_group=True,
            primary_issue_id=str(issue.id),
            grouped_report_count=issue.grouped_report_count,
            confirmations=len(issue.confirmations) if issue.confirmations else issue.grouped_report_count,
        )
    return None


def _resolution_schema(issue: Issue) -> IssueResolutionSchema | None:
    resolution = issue.latest_resolution
    if not resolution:
        return None
    return IssueResolutionSchema(
        resolved_at=resolution.resolved_at,
        before_image_url=resolution.before_image_url,
        after_image_url=resolution.after_image_url,
        resolution_note=resolution.resolution_note,
        resolved_by_label=resolution.resolved_by_label,
    )


def serialize_issue_list_item(issue: Issue) -> IssueListItem:
    thumbnail = issue.images[0].url if issue.images else None
    return IssueListItem(
        id=str(issue.id),
        tracking_id=issue.tracking_id,
        title=issue.title,
        category=issue.category,
        severity=issue.severity,
        status=issue.status,
        location=GeoPoint(lat=issue.lat, lng=issue.lng),
        priority_score=_current_priority_breakdown(issue).score,
        confirmation_count=len(issue.confirmations) if issue.confirmations else 0,
        reported_at=issue.reported_at,
        thumbnail_url=thumbnail,
    )


def serialize_issue(issue: Issue) -> IssueSchema:
    analysis = issue.latest_ai_analysis
    ai_analysis_schema = None
    if analysis:
        ai_analysis_schema = AIAnalysisSchema(
            id=str(analysis.id),
            issue_id=str(issue.id),
            detected_category=analysis.detected_category,
            confidence=analysis.confidence,
            severity=analysis.severity,
            safety_risk=analysis.safety_risk,
            summary=analysis.summary,
            possible_causes=list(analysis.possible_causes or []),
            is_demo=analysis.is_demo,
            model_version=analysis.model_version,
            created_at=analysis.created_at,
        )

    location = IssueLocation(
        lat=issue.lat,
        lng=issue.lng,
        address=issue.address,
        ward=issue.ward,
        city=issue.city,
        landmark=issue.landmark,
        location_importance=issue.location_importance,
    )

    images = [
        IssueImageSchema(id=str(img.id), url=img.url, kind=img.kind, caption=img.caption, created_at=img.created_at)
        for img in issue.images
    ]

    status_history = [
        StatusHistoryEntry(id=str(h.id), status=h.status, note=h.note, actor=h.actor, created_at=h.created_at)
        for h in issue.status_history
    ]

    return IssueSchema(
        id=str(issue.id),
        tracking_id=issue.tracking_id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        severity=issue.severity,
        status=issue.status,
        location=location,
        images=images,
        ai_analysis=ai_analysis_schema,
        priority_score=_current_priority_breakdown(issue),
        status_history=status_history,
        confirmations=_confirmation_summary(issue),
        duplicate_info=_duplicate_info(issue),
        resolution=_resolution_schema(issue),
        reported_at=issue.reported_at,
        updated_at=issue.updated_at,
        days_open=_days_open(issue),
        reporter_display_name=issue.reporter_display_name,
        is_demo=issue.is_demo,
    )
