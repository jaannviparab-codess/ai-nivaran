"""Duplicate-issue detection.

Given a new issue's category/location/description, find existing open issues
(status not in resolved/citizen_verified) of the same category within
``DUPLICATE_RADIUS_METERS`` (haversine formula) and above
``DUPLICATE_SIMILARITY_THRESHOLD`` embedding cosine-similarity on the
description, ranked best-first.

``group_or_create`` is the helper used by ``POST /api/issues``: when a strong
match is found it links the freshly-created issue to the matched primary issue
via an ``IssueDuplicate`` row (instead of leaving it as a fully separate,
independently-listed issue), and bumps the primary's aggregate counters.
"""
from __future__ import annotations

import math
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import IssueCategory, OPEN_STATUSES
from app.models.issue import Issue
from app.models.issue_duplicate import IssueDuplicate
from app.services.ai.embedding_service import cosine_similarity
from app.services.ai.provider_factory import get_embedding_provider

EARTH_RADIUS_METERS = 6_371_000

# Each grouped duplicate report is treated as rough evidence of additional
# people affected by the same underlying problem.
PEOPLE_AFFECTED_PER_DUPLICATE = 8


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_METERS * math.asin(min(1.0, math.sqrt(a)))


@dataclass
class DuplicateCandidate:
    issue: Issue
    distance_meters: float
    similarity: float


def find_possible_duplicates(
    db: Session,
    category: IssueCategory,
    lat: float,
    lng: float,
    description: str,
    exclude_issue_id: uuid.UUID | None = None,
    limit: int = 5,
) -> list[DuplicateCandidate]:
    """Rank existing open (non-duplicate, non-resolved) issues of the same
    category within the configured radius, scored by description-embedding
    cosine similarity. Only matches at/above the configured similarity
    threshold are returned, best match first."""

    radius = settings.DUPLICATE_RADIUS_METERS
    lat_delta = radius / 111_320  # ~meters per degree of latitude
    cos_lat = max(math.cos(math.radians(lat)), 0.01)
    lng_delta = radius / (111_320 * cos_lat)

    query = select(Issue).where(
        Issue.category == category,
        Issue.status.in_(OPEN_STATUSES),
        Issue.duplicate_of_id.is_(None),
        Issue.lat.between(lat - lat_delta, lat + lat_delta),
        Issue.lng.between(lng - lng_delta, lng + lng_delta),
    )
    if exclude_issue_id is not None:
        query = query.where(Issue.id != exclude_issue_id)

    candidates = db.execute(query).scalars().all()
    if not candidates:
        return []

    embedder = get_embedding_provider()
    new_vector = embedder.embed(description)

    results: list[DuplicateCandidate] = []
    for issue in candidates:
        distance = haversine_meters(lat, lng, issue.lat, issue.lng)
        if distance > radius:
            continue
        similarity = cosine_similarity(new_vector, embedder.embed(issue.description))
        if similarity >= settings.DUPLICATE_SIMILARITY_THRESHOLD:
            results.append(DuplicateCandidate(issue=issue, distance_meters=distance, similarity=similarity))

    results.sort(key=lambda c: c.similarity, reverse=True)
    return results[:limit]


def group_or_create(db: Session, new_issue: Issue) -> DuplicateCandidate | None:
    """Called right after ``new_issue`` has been added+flushed (so it has an
    id). If a strong duplicate match exists, link ``new_issue`` to the primary
    issue via an ``IssueDuplicate`` row and bump the primary's aggregate
    counters, so confirmations/grouped-report-count add up on one canonical
    tracking id rather than being split across several. Returns the matched
    primary candidate, or ``None`` if this is a genuinely new issue.
    """
    candidates = find_possible_duplicates(
        db,
        category=new_issue.category,
        lat=new_issue.lat,
        lng=new_issue.lng,
        description=new_issue.description,
        exclude_issue_id=new_issue.id,
        limit=1,
    )
    if not candidates:
        return None

    best = candidates[0]
    primary = best.issue
    # Never chain groups: if the matched issue is itself already a duplicate,
    # attach to its ultimate primary instead.
    seen: set[uuid.UUID] = set()
    while primary.duplicate_of_id is not None and primary.duplicate_of is not None and primary.id not in seen:
        seen.add(primary.id)
        primary = primary.duplicate_of

    db.add(
        IssueDuplicate(
            primary_issue_id=primary.id,
            duplicate_issue_id=new_issue.id,
            similarity_score=best.similarity,
        )
    )

    new_issue.duplicate_of_id = primary.id
    primary.grouped_report_count = (primary.grouped_report_count or 1) + 1
    primary.people_affected_estimate = (primary.people_affected_estimate or 0) + PEOPLE_AFFECTED_PER_DUPLICATE

    return DuplicateCandidate(issue=primary, distance_meters=best.distance_meters, similarity=best.similarity)
