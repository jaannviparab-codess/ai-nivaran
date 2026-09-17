from __future__ import annotations

from app.models.enums import IssueCategory
from app.schemas.base import CamelModel


class DashboardStats(CamelModel):
    total_reports: int
    active_issues: int
    resolved_issues: int
    critical_issues: int
    avg_resolution_days: float
    reports_this_month: int
    community_confirmations: int


class CategoryBreakdown(CamelModel):
    category: IssueCategory
    count: int


class AreaBreakdown(CamelModel):
    ward: str
    count: int
    resolved_count: int


class MonthlyTrendPoint(CamelModel):
    month: str
    reported: int
    resolved: int


class ResolvedVsActive(CamelModel):
    resolved: int
    active: int


class AnalyticsSnapshot(CamelModel):
    stats: DashboardStats
    by_category: list[CategoryBreakdown]
    by_area: list[AreaBreakdown]
    monthly_trend: list[MonthlyTrendPoint]
    resolved_vs_active: ResolvedVsActive
