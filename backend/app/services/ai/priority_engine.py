"""Pure priority-scoring function.

No I/O, no database access, no side effects -- just severity/safety/affected/
duration/location in, a 0-100 score and a transparent factor breakdown out.
Weights come from settings (PRIORITY_WEIGHT_*) so they're tunable without a
code change.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.config import settings
from app.models.enums import IssueSeverity

SEVERITY_POINTS: dict[IssueSeverity, float] = {
    IssueSeverity.low: 20,
    IssueSeverity.medium: 45,
    IssueSeverity.high: 72,
    IssueSeverity.critical: 95,
}

SAFETY_POINTS: dict[IssueSeverity, float] = {
    IssueSeverity.low: 15,
    IssueSeverity.medium: 40,
    IssueSeverity.high: 68,
    IssueSeverity.critical: 92,
}


@dataclass
class PriorityFactorResult:
    label: str
    weight: float
    contribution: float
    detail: str


@dataclass
class PriorityResult:
    score: float
    factors: list[PriorityFactorResult]
    calculated_at: datetime


def default_location_importance(severity: IssueSeverity) -> float:
    """Fallback used when a report doesn't include an explicit
    location-importance signal (0-1)."""
    return 0.9 if severity == IssueSeverity.critical else 0.6


def calculate_priority(
    severity: IssueSeverity,
    safety_risk: IssueSeverity,
    people_affected: int,
    days_open: int,
    location_importance: float | None,
) -> PriorityResult:
    weights = {
        "severity": settings.PRIORITY_WEIGHT_SEVERITY,
        "safety": settings.PRIORITY_WEIGHT_SAFETY,
        "affected": settings.PRIORITY_WEIGHT_AFFECTED,
        "duration": settings.PRIORITY_WEIGHT_DURATION,
        "location": settings.PRIORITY_WEIGHT_LOCATION,
    }

    if location_importance is None:
        location_importance = default_location_importance(severity)
    location_importance = max(0.0, min(1.0, location_importance))
    people_affected = max(0, people_affected)
    days_open = max(0, days_open)

    severity_points = SEVERITY_POINTS[severity]
    safety_points = SAFETY_POINTS[safety_risk]
    affected_points = min(100.0, round(people_affected / 400 * 100))
    duration_points = min(100.0, round(days_open / 30 * 100))
    location_points = round(location_importance * 100)

    factors = [
        PriorityFactorResult(
            label="Severity",
            weight=weights["severity"],
            contribution=round(severity_points * weights["severity"], 1),
            detail=f"AI classified this as {severity.value} severity.",
        ),
        PriorityFactorResult(
            label="Safety risk",
            weight=weights["safety"],
            contribution=round(safety_points * weights["safety"], 1),
            detail="Estimated potential for accident or injury if left unresolved.",
        ),
        PriorityFactorResult(
            label="People affected",
            weight=weights["affected"],
            contribution=round(affected_points * weights["affected"], 1),
            detail=f"Estimated {people_affected}+ people affected nearby.",
        ),
        PriorityFactorResult(
            label="Duration open",
            weight=weights["duration"],
            contribution=round(duration_points * weights["duration"], 1),
            detail=(
                "Newly reported issue."
                if days_open == 0
                else f"Reported {days_open} day{'s' if days_open != 1 else ''} ago and still unresolved."
            ),
        ),
        PriorityFactorResult(
            label="Location importance",
            weight=weights["location"],
            contribution=round(location_points * weights["location"], 1),
            detail="Based on surrounding report density and area significance.",
        ),
    ]

    score = round(sum(f.contribution for f in factors))
    score = max(0, min(100, score))

    return PriorityResult(score=score, factors=factors, calculated_at=datetime.now(timezone.utc))
