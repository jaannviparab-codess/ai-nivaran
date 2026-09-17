"""Issue endpoints: browse, create, confirm, verify, moderate.

Route ordering matters here: literal-path routes (/map, /stats, /analyze,
/track/{trackingId}) must be registered before the generic /{issue_id} route,
otherwise FastAPI/Starlette would match e.g. "/issues/map" against
"/issues/{issue_id}" first (with issue_id="map") since routes are matched in
registration order.

Note: this module deliberately does NOT use ``from __future__ import
annotations`` -- see the comment at the top of ``app/api/routes/auth.py`` for
why that interacts badly with slowapi's ``@limiter.limit(...)`` decorator.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.camel_route import CamelCaseRoute
from app.api.deps import get_current_user_optional, require_roles
from app.core.errors import ApiException, NotFoundError
from app.core.rate_limit import limiter, rate_limit_default
from app.db.session import get_db
from app.models.enums import IssueCategory, IssueSeverity, IssueStatus, UserRole
from app.models.user import User
from app.schemas.analytics import DashboardStats
from app.schemas.issue import (
    AnalyzeIssueResponse,
    ConfirmIssueRequest,
    ConfirmIssueResponse,
    CreateIssuePayload,
    Issue as IssueSchema,
    IssueListItem,
    PatchIssueRequest,
    VerifyIssueRequest,
)
from app.services import issue_service
from app.services.analytics_service import compute_dashboard_stats

router = APIRouter(prefix="/issues", tags=["issues"], route_class=CamelCaseRoute)


def _parse_uuid(value: str, what: str = "issue id") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise ApiException(f"Invalid {what}.", status_code=400, code="INVALID_ID") from exc


@router.get("", response_model=list[IssueListItem])
def list_issues(
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[IssueListItem]:
    categories = issue_service.parse_csv_enum(category, IssueCategory, "category")
    severities = issue_service.parse_csv_enum(severity, IssueSeverity, "severity")
    statuses = issue_service.parse_csv_enum(status, IssueStatus, "status")
    issues = issue_service.list_issues(
        db,
        category=categories,
        severity=severities,
        status=statuses,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )
    return [issue_service.serialize_issue_list_item(i) for i in issues]


@router.get("/map", response_model=list[IssueListItem])
def get_issue_map_data(
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[IssueListItem]:
    return list_issues(category, severity, status, search, date_from, date_to, db)


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)) -> DashboardStats:
    return compute_dashboard_stats(db)


@router.post("/analyze", response_model=AnalyzeIssueResponse)
@limiter.limit(rate_limit_default())
def analyze_issue(request: Request, payload: CreateIssuePayload, db: Session = Depends(get_db)) -> AnalyzeIssueResponse:
    """Preview step: runs the full AI analysis + duplicate-detection pipeline
    but persists nothing."""
    return issue_service.analyze_draft(db, payload)


@router.post("", response_model=IssueSchema)
@limiter.limit(rate_limit_default())
def create_issue(
    request: Request,
    payload: CreateIssuePayload,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> IssueSchema:
    issue = issue_service.create_issue(db, payload, current_user)
    full = issue_service.get_issue_by_id(db, issue.id)
    return issue_service.serialize_issue(full)


@router.get("/track/{tracking_id}", response_model=IssueSchema)
def get_issue_by_tracking_id(tracking_id: str, db: Session = Depends(get_db)) -> IssueSchema:
    issue = issue_service.get_issue_by_tracking_id(db, tracking_id)
    if issue is None:
        raise NotFoundError(f"No issue found with tracking ID '{tracking_id}'.")
    return issue_service.serialize_issue(issue)


@router.get("/{issue_id}", response_model=IssueSchema)
def get_issue(issue_id: str, db: Session = Depends(get_db)) -> IssueSchema:
    parsed_id = _parse_uuid(issue_id)
    issue = issue_service.get_issue_by_id(db, parsed_id)
    if issue is None:
        raise NotFoundError("Issue not found.")
    return issue_service.serialize_issue(issue)


@router.post("/{issue_id}/confirm", response_model=ConfirmIssueResponse)
def confirm_issue(
    issue_id: str,
    payload: ConfirmIssueRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ConfirmIssueResponse:
    parsed_id = _parse_uuid(issue_id)
    issue = issue_service.get_issue_by_id(db, parsed_id)
    if issue is None:
        raise NotFoundError("Issue not found.")
    count = issue_service.confirm_issue(db, issue, payload.still_present, current_user)
    return ConfirmIssueResponse(confirmations=count)


@router.post("/{issue_id}/verify", response_model=IssueSchema)
def verify_issue(
    issue_id: str,
    payload: VerifyIssueRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> IssueSchema:
    parsed_id = _parse_uuid(issue_id)
    issue = issue_service.get_issue_by_id(db, parsed_id)
    if issue is None:
        raise NotFoundError("Issue not found.")
    updated = issue_service.verify_issue(db, issue, payload.confirmed, current_user)
    return issue_service.serialize_issue(updated)


@router.patch("/{issue_id}", response_model=IssueSchema)
def patch_issue(
    issue_id: str,
    payload: PatchIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.moderator, UserRole.admin)),
) -> IssueSchema:
    if payload.status is None and not payload.note:
        raise ApiException("Provide a status and/or a note to update.", status_code=400, code="EMPTY_UPDATE")
    parsed_id = _parse_uuid(issue_id)
    issue = issue_service.get_issue_by_id(db, parsed_id)
    if issue is None:
        raise NotFoundError("Issue not found.")
    updated = issue_service.patch_issue_status(db, issue, payload.status, payload.note, current_user)
    return issue_service.serialize_issue(updated)
