"""Generates simple, offline-safe SVG placeholder images for demo/seed issues
and for citizen reports submitted without a photo.

Mirrors the visual style of the frontend's ``lib/placeholder.ts`` (gradient +
glyph + label), but persists a real file under UPLOAD_DIR so it is served back
as a genuinely reachable URL -- consistent with how real uploaded photos are
served -- rather than an inline data URI.
"""
from __future__ import annotations

from app.core.config import settings
from app.models.enums import IssueCategory
from app.services.ai.llm_service import CATEGORY_LABELS_EN

CATEGORY_GLYPH: dict[IssueCategory, str] = {
    IssueCategory.pothole: "⬤",
    IssueCategory.garbage: "\U0001f5d1",
    IssueCategory.streetlight: "\U0001f4a1",
    IssueCategory.water_leakage: "\U0001f4a7",
    IssueCategory.damaged_road: "▬",
    IssueCategory.open_manhole: "⬡",
    IssueCategory.fallen_tree: "\U0001f333",
    IssueCategory.road_obstruction: "\U0001f6a7",
    IssueCategory.drainage: "〰",
    IssueCategory.public_cleanliness: "✦",
    IssueCategory.accessibility: "♿",
    IssueCategory.other: "❔",
}

CATEGORY_GRADIENT: dict[IssueCategory, tuple[str, str]] = {
    IssueCategory.pothole: ("#1d4ed8", "#0891b2"),
    IssueCategory.garbage: ("#65a30d", "#a3a300"),
    IssueCategory.streetlight: ("#eab308", "#f97316"),
    IssueCategory.water_leakage: ("#0891b2", "#2563eb"),
    IssueCategory.damaged_road: ("#475569", "#1e293b"),
    IssueCategory.open_manhole: ("#7c2d12", "#dc2626"),
    IssueCategory.fallen_tree: ("#166534", "#22c55e"),
    IssueCategory.road_obstruction: ("#ea580c", "#f97316"),
    IssueCategory.drainage: ("#0e7490", "#164e63"),
    IssueCategory.public_cleanliness: ("#0d9488", "#22d3ee"),
    IssueCategory.accessibility: ("#7e22ce", "#a855f7"),
    IssueCategory.other: ("#475569", "#64748b"),
}


def _build_svg(category: IssueCategory, variant: str) -> str:
    from_color, to_color = CATEGORY_GRADIENT[category]
    glyph = CATEGORY_GLYPH[category]
    label = "Resolved" if variant == "after" else CATEGORY_LABELS_EN[category]
    overlay = '<rect width="800" height="600" fill="#16a34a" opacity="0.12"/>' if variant == "after" else ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{from_color}"/>
      <stop offset="100%" stop-color="{to_color}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  {overlay}
  <text x="400" y="270" font-size="140" text-anchor="middle" fill="rgba(255,255,255,0.9)">{glyph}</text>
  <text x="400" y="360" font-size="30" font-family="Arial, sans-serif" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-weight="700">{label}</text>
  <text x="400" y="400" font-size="18" font-family="Arial, sans-serif" text-anchor="middle" fill="rgba(255,255,255,0.75)" letter-spacing="2">SAMPLE / DEMO IMAGE -- {variant.upper()}</text>
</svg>"""


def category_placeholder_url(category: IssueCategory, variant: str = "report") -> str:
    """Writes (if not already present) a deterministic SVG placeholder for
    this category+variant under ``UPLOAD_DIR/placeholders`` and returns its
    public URL, e.g. ``/uploads/placeholders/pothole-report.svg``."""
    filename = f"{category.value}-{variant}.svg"
    target_dir = settings.upload_dir_path / "placeholders"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    if not target_path.exists():
        target_path.write_text(_build_svg(category, variant), encoding="utf-8")
    return f"/uploads/placeholders/{filename}"
