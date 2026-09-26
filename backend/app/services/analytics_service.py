"""Aggregate dashboard/analytics computations.

Deliberately does the month/ward aggregation in Python rather than
dialect-specific SQL (``date_trunc`` on Postgres vs ``strftime`` on SQLite) so
the exact same code path works against either backend -- useful for the
quick SQLite sanity check and harmless at the modest data volumes a civic
reporting app deals with.
"""
from __future__ import annotations

import calendar
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import RESOLVED_LIKE_STATUSES, IssueSeverity
from app.models.issue import Issue
from app.models.issue_confirmation import IssueConfirmation
from app.models.issue_resolution import IssueResolution
from app.schemas.analytics import (
    AnalyticsSnapshot,
    AreaBreakdown,
    CategoryBreakdown,
    DashboardStats,
    MonthlyTrendPoint,
    ResolvedVsActive,
)


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _average_resolution_days(db: Session) -> float:
    rows = db.execute(
        select(Issue.reported_at, func.max(IssueResolution.resolved_at))
        .join(IssueResolution, IssueResolution.issue_id == Issue.id)
        .group_by(Issue.id, Issue.reported_at)
    ).all()
    if not rows:
        return 0.0
    total_days = sum(max(0.0, (_aware(resolved_at) - _aware(reported_at)).total_seconds() / 86400) for reported_at, resolved_at in rows)
    return round(total_days / len(rows), 1)


def compute_dashboard_stats(db: Session) -> DashboardStats:
    primary_filter = Issue.duplicate_of_id.is_(None)

    total_reports = db.scalar(select(func.count(Issue.id))) or 0
    resolved_issues = db.scalar(
        select(func.count(Issue.id)).where(primary_filter, Issue.status.in_(RESOLVED_LIKE_STATUSES))
    ) or 0
    active_issues = db.scalar(
        select(func.count(Issue.id)).where(primary_filter, ~Issue.status.in_(RESOLVED_LIKE_STATUSES))
    ) or 0
    critical_issues = db.scalar(
        select(func.count(Issue.id)).where(
            primary_filter, Issue.severity == IssueSeverity.critical, ~Issue.status.in_(RESOLVED_LIKE_STATUSES)
        )
    ) or 0

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    reports_this_month = db.scalar(select(func.count(Issue.id)).where(Issue.reported_at >= month_start)) or 0

    community_confirmations = db.scalar(select(func.count(IssueConfirmation.id))) or 0

    return DashboardStats(
        total_reports=total_reports,
        active_issues=active_issues,
        resolved_issues=resolved_issues,
        critical_issues=critical_issues,
        avg_resolution_days=_average_resolution_days(db),
        reports_this_month=reports_this_month,
        community_confirmations=community_confirmations,
    )


def compute_category_breakdown(db: Session) -> list[CategoryBreakdown]:
    rows = db.execute(
        select(Issue.category, func.count(Issue.id))
        .where(Issue.duplicate_of_id.is_(None))
        .group_by(Issue.category)
        .order_by(func.count(Issue.id).desc())
    ).all()
    return [CategoryBreakdown(category=category, count=count) for category, count in rows]


def compute_area_breakdown(db: Session) -> list[AreaBreakdown]:
    rows = db.execute(
        select(Issue.ward, Issue.status).where(Issue.duplicate_of_id.is_(None), Issue.ward.is_not(None))
    ).all()
    counts: dict[str, dict[str, int]] = {}
    for ward, status in rows:
        bucket = counts.setdefault(ward, {"count": 0, "resolved": 0})
        bucket["count"] += 1
        if status in RESOLVED_LIKE_STATUSES:
            bucket["resolved"] += 1
    breakdown = [AreaBreakdown(ward=ward, count=data["count"], resolved_count=data["resolved"]) for ward, data in counts.items()]
    breakdown.sort(key=lambda a: a.count, reverse=True)
    return breakdown


def compute_monthly_trend(db: Session, months: int = 6) -> list[MonthlyTrendPoint]:
    now = datetime.now(timezone.utc)
    periods: list[tuple[int, int]] = []
    year, month = now.year, now.month
    for _ in range(months):
        periods.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    periods.reverse()

    reported_dates = db.execute(select(Issue.reported_at)).scalars().all()
    resolved_dates = db.execute(select(func.max(IssueResolution.resolved_at)).group_by(IssueResolution.issue_id)).scalars().all()

    points: list[MonthlyTrendPoint] = []
    for year, month in periods:
        reported_count = sum(1 for dt in reported_dates if _aware(dt).year == year and _aware(dt).month == month)
        resolved_count = sum(1 for dt in resolved_dates if dt and _aware(dt).year == year and _aware(dt).month == month)
        points.append(MonthlyTrendPoint(month=calendar.month_abbr[month], reported=reported_count, resolved=resolved_count))
    return points


def get_analytics_snapshot(db: Session) -> AnalyticsSnapshot:
    stats = compute_dashboard_stats(db)
    return AnalyticsSnapshot(
        stats=stats,
        by_category=compute_category_breakdown(db),
        by_area=compute_area_breakdown(db),
        monthly_trend=compute_monthly_trend(db),
        resolved_vs_active=ResolvedVsActive(resolved=stats.resolved_issues, active=stats.active_issues),
    )
