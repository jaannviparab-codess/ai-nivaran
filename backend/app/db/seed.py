"""Seeds the database with realistic demo issues (Pune-area wards, varied
categories/severities/statuses, a couple with before/after resolution
photos) so a fresh database isn't empty when someone runs the backend for
real. Mirrors the spirit of frontend/src/lib/mock-data.ts.

This script does NOT create tables -- run migrations first:
    alembic upgrade head
    python -m app.db.seed
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import ImageKind, IssueCategory, IssueSeverity, IssueStatus, StatusActor, UserRole
from app.models.issue import Issue
from app.models.issue_ai_analysis import IssueAIAnalysis
from app.models.issue_confirmation import IssueConfirmation
from app.models.issue_image import IssueImage
from app.models.issue_resolution import IssueResolution
from app.models.issue_status_history import IssueStatusHistory
from app.models.priority_score import PriorityScore
from app.models.user import User
from app.services.ai.llm_service import build_possible_causes, build_summary, safety_risk_for
from app.services.ai.priority_engine import calculate_priority
from app.services.placeholder_service import category_placeholder_url

ADMIN_EMAIL = "admin@nivaran.ai"
ADMIN_PASSWORD = "NivaranAdmin@123"

MODERATOR_EMAIL = "moderator@nivaran.ai"
MODERATOR_PASSWORD = "NivaranMod@123"

# Forward progression of statuses (excludes the "reopened" branch, handled specially).
STATUS_STEPS = [
    IssueStatus.reported,
    IssueStatus.ai_analyzed,
    IssueStatus.verified,
    IssueStatus.under_review,
    IssueStatus.work_started,
    IssueStatus.resolved,
    IssueStatus.citizen_verified,
]

STATUS_NOTES = {
    IssueStatus.reported: "Citizen submitted this report with photo and location.",
    IssueStatus.ai_analyzed: "AI classified the issue and generated an initial priority estimate.",
    IssueStatus.verified: "Report reviewed and confirmed as a valid public issue.",
    IssueStatus.under_review: "Assigned to the relevant department for review.",
    IssueStatus.work_started: "Field team has started resolution work.",
    IssueStatus.resolved: "Issue marked resolved with after-photo evidence.",
    IssueStatus.citizen_verified: "Citizens confirmed the fix is holding.",
    IssueStatus.reopened: "Multiple citizens reported the issue is still present -- reopened for review.",
}

RESOLVED_LIKE = (IssueStatus.resolved, IssueStatus.citizen_verified)


@dataclass
class Seed:
    title: str
    category: IssueCategory
    severity: IssueSeverity
    status: IssueStatus
    ward: str
    lat: float
    lng: float
    days_ago: int
    confirmations: int
    people_affected: int
    description: str
    grouped_report_count: int = 1


SEEDS: list[Seed] = [
    Seed(
        "Large pothole near Main Road signal", IssueCategory.pothole, IssueSeverity.high, IssueStatus.work_started,
        "Kothrud", 18.5074, 73.8077, 12, 47, 200,
        "A deep pothole has formed right after the Main Road signal, causing two-wheelers to swerve into "
        "oncoming traffic, especially dangerous after dark.",
        grouped_report_count=6,
    ),
    Seed(
        "Garbage pile not collected for a week", IssueCategory.garbage, IssueSeverity.medium, IssueStatus.under_review,
        "Shivajinagar", 18.5308, 73.8475, 6, 22, 80,
        "Household waste is piling up near the society gate and has not been collected for over a week, "
        "attracting stray animals.",
    ),
    Seed(
        "Streetlight pole completely dark", IssueCategory.streetlight, IssueSeverity.medium, IssueStatus.verified,
        "Aundh", 18.5629, 73.8072, 4, 9, 60,
        "Three consecutive streetlight poles are non-functional, making the stretch unsafe for pedestrians at night.",
    ),
    Seed(
        "Water pipeline leaking onto footpath", IssueCategory.water_leakage, IssueSeverity.high, IssueStatus.reported,
        "Kharadi", 18.5515, 73.9345, 1, 3, 40,
        "Continuous water leakage from an underground pipeline is flooding the footpath and wasting "
        "significant water daily.",
    ),
    Seed(
        "Open manhole without barricade", IssueCategory.open_manhole, IssueSeverity.critical, IssueStatus.ai_analyzed,
        "Hadapsar", 18.5089, 73.9260, 1, 15, 150,
        "An open manhole with no barricade or warning sign poses a serious fall risk, especially at night. "
        "Immediate attention required.",
    ),
    Seed(
        "Fallen tree blocking half the road", IssueCategory.fallen_tree, IssueSeverity.critical, IssueStatus.resolved,
        "Baner", 18.5590, 73.7868, 20, 31, 300,
        "Heavy winds brought down a large tree which is blocking one lane of traffic completely.",
    ),
    Seed(
        "Debris and construction material blocking lane", IssueCategory.road_obstruction, IssueSeverity.medium,
        IssueStatus.under_review, "Viman Nagar", 18.5679, 73.9143, 5, 11, 70,
        "Construction debris has been left unattended on the road for several days, narrowing the usable lane width.",
    ),
    Seed(
        "Clogged drain causing waterlogging", IssueCategory.drainage, IssueSeverity.high, IssueStatus.work_started,
        "Camp", 18.5122, 73.8797, 9, 26, 120,
        "A blocked storm drain causes ankle-deep waterlogging every time it rains, affecting shopkeepers and "
        "pedestrians.",
    ),
    Seed(
        "Public toilet area extremely unhygienic", IssueCategory.public_cleanliness, IssueSeverity.medium,
        IssueStatus.reported, "Swargate", 18.5010, 73.8636, 2, 7, 90,
        "The public toilet block near the bus stand has not been cleaned in days and lacks running water.",
    ),
    Seed(
        "No wheelchair ramp at pedestrian crossing", IssueCategory.accessibility, IssueSeverity.medium,
        IssueStatus.citizen_verified, "Deccan", 18.5158, 73.8412, 30, 18, 50,
        "The pedestrian crossing near the college lacks a wheelchair ramp, forcing wheelchair users onto the "
        "main carriageway.",
    ),
    Seed(
        "Deep pothole cluster after flyover", IssueCategory.pothole, IssueSeverity.critical, IssueStatus.reopened,
        "Wakad", 18.5993, 73.7625, 25, 63, 400,
        "A cluster of deep potholes right after the flyover exit has caused several two-wheeler accidents. "
        "Previously marked resolved but citizens report it has reappeared.",
    ),
    Seed(
        "Overflowing garbage bin near market", IssueCategory.garbage, IssueSeverity.low, IssueStatus.resolved,
        "Kothrud", 18.5030, 73.8120, 15, 12, 55,
        "The community garbage bin near the vegetable market overflows daily by the afternoon.",
    ),
    Seed(
        "Broken footpath tiles causing trips", IssueCategory.damaged_road, IssueSeverity.low, IssueStatus.verified,
        "Erandwane", 18.5049, 73.8291, 3, 5, 35,
        "Several footpath tiles are broken or missing, creating a tripping hazard for elderly pedestrians.",
    ),
    Seed(
        "Street flooding due to poor drainage design", IssueCategory.drainage, IssueSeverity.high,
        IssueStatus.under_review, "Hadapsar", 18.4967, 73.9394, 8, 34, 210,
        "Even light rain causes this stretch to flood ankle-deep within minutes due to an undersized drain.",
    ),
    Seed(
        "Unclassified public nuisance near bus depot", IssueCategory.other, IssueSeverity.medium,
        IssueStatus.reported, "Camp", 18.5140, 73.8750, 2, 4, 30,
        "Residents report a recurring public nuisance near the bus depot that doesn't fit a standard "
        "category and needs an in-person inspection.",
    ),
]


def _status_history_for(seed_item: Seed, reported_at: datetime) -> list[tuple[IssueStatus, StatusActor, str, datetime]]:
    if seed_item.status == IssueStatus.reopened:
        steps = STATUS_STEPS[:6]  # reported .. resolved
    else:
        steps = STATUS_STEPS[: STATUS_STEPS.index(seed_item.status) + 1]

    span_days = max(seed_item.days_ago, len(steps))
    entries: list[tuple[IssueStatus, StatusActor, str, datetime]] = []
    for i, step in enumerate(steps):
        offset_days = max(span_days - round((span_days / len(steps)) * i), 0)
        if step == IssueStatus.reported:
            actor = StatusActor.citizen
        elif step == IssueStatus.ai_analyzed:
            actor = StatusActor.ai
        elif step == IssueStatus.resolved:
            actor = StatusActor.authority
        else:
            actor = StatusActor.authority if i % 2 == 0 else StatusActor.system
        entries.append((step, actor, STATUS_NOTES[step], reported_at + timedelta(days=seed_item.days_ago - offset_days)))

    if seed_item.status == IssueStatus.reopened:
        entries.append(
            (
                IssueStatus.reopened,
                StatusActor.system,
                STATUS_NOTES[IssueStatus.reopened],
                reported_at + timedelta(days=max(seed_item.days_ago - 1, 0)),
            )
        )
    return entries


def seed() -> None:
    db = SessionLocal()
    try:
        existing_admin = db.execute(select(User).where(User.email == ADMIN_EMAIL)).scalars().first()
        if existing_admin:
            print(f"Database already seeded (found {ADMIN_EMAIL}). Skipping.")
            return

        db.add(
            User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                display_name="Nivaran Admin",
                role=UserRole.admin,
            )
        )
        db.add(
            User(
                email=MODERATOR_EMAIL,
                hashed_password=hash_password(MODERATOR_PASSWORD),
                display_name="Ward Moderator",
                role=UserRole.moderator,
            )
        )

        now = datetime.now(timezone.utc)

        for i, seed_item in enumerate(SEEDS):
            reported_at = now - timedelta(days=seed_item.days_ago)
            is_resolved_like = seed_item.status in RESOLVED_LIKE
            location_importance = 0.9 if seed_item.severity == IssueSeverity.critical else 0.6
            safety_risk = safety_risk_for(seed_item.severity)

            issue = Issue(
                tracking_id=f"NVR-{now.year}-{9000 + i:05d}",
                title=seed_item.title,
                description=seed_item.description,
                category=seed_item.category,
                severity=seed_item.severity,
                status=seed_item.status,
                lat=seed_item.lat,
                lng=seed_item.lng,
                address=f"Near {seed_item.ward} main road, Pune",
                ward=seed_item.ward,
                city="Pune",
                location_importance=location_importance,
                reporter_display_name="Anonymous Citizen",
                is_public=True,
                is_demo=True,
                people_affected_estimate=seed_item.people_affected,
                grouped_report_count=seed_item.grouped_report_count,
                reported_at=reported_at,
            )
            db.add(issue)
            db.flush()

            db.add(
                IssueImage(
                    issue_id=issue.id,
                    url=category_placeholder_url(seed_item.category, "report"),
                    kind=ImageKind.report,
                    caption="Photo submitted with the report",
                )
            )

            db.add(
                IssueAIAnalysis(
                    issue_id=issue.id,
                    detected_category=seed_item.category,
                    confidence=0.82,
                    severity=seed_item.severity,
                    safety_risk=safety_risk,
                    summary=build_summary(seed_item.category),
                    possible_causes=build_possible_causes(seed_item.category),
                    is_demo=True,
                    model_version="nivaran-vision-demo-v1",
                    created_at=reported_at,
                )
            )

            for step, actor, note, ts in _status_history_for(seed_item, reported_at):
                db.add(IssueStatusHistory(issue_id=issue.id, status=step, actor=actor, note=note, created_at=ts))

            resolved_count = round(seed_item.confirmations * 0.9) if is_resolved_like else 0
            for c in range(seed_item.confirmations):
                still_present = c >= resolved_count
                db.add(
                    IssueConfirmation(
                        issue_id=issue.id,
                        still_present=still_present,
                        created_at=reported_at + timedelta(days=min(c, max(seed_item.days_ago, 1))),
                    )
                )

            days_open = 0 if is_resolved_like else seed_item.days_ago
            priority = calculate_priority(
                severity=seed_item.severity,
                safety_risk=safety_risk,
                people_affected=seed_item.people_affected,
                days_open=days_open,
                location_importance=location_importance,
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

            if is_resolved_like:
                db.add(
                    IssueResolution(
                        issue_id=issue.id,
                        resolved_at=reported_at + timedelta(days=max(seed_item.days_ago - 4, 1)),
                        before_image_url=category_placeholder_url(seed_item.category, "before"),
                        after_image_url=category_placeholder_url(seed_item.category, "after"),
                        resolution_note="Field team completed the repair and closed out the work order.",
                        resolved_by_label="Public Works Field Team",
                    )
                )

        db.commit()
        print(f"Seeded {len(SEEDS)} demo issues.")
        print(f"Demo admin login     -> email: {ADMIN_EMAIL}  password: {ADMIN_PASSWORD}")
        print(f"Demo moderator login -> email: {MODERATOR_EMAIL}  password: {MODERATOR_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
