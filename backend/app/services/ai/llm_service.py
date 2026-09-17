"""LLM provider abstraction: category/severity classification + summary.

Every capability in app/services/ai goes through a small provider interface so
a real model can be swapped in later without touching any calling code. The
demo provider is deterministic and keyword-based, mirroring the
CATEGORY_KEYWORDS / URGENT_KEYWORDS heuristics in the frontend's
``lib/api.ts::analyzeIssueDraft`` so client-side and server-side demo behavior
stay consistent.
"""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.models.enums import IssueCategory, IssueSeverity

logger = logging.getLogger("nivaran.ai.llm")

MODEL_VERSION_DEMO = "nivaran-llm-demo-v1"

# Mirrors CATEGORY_KEYWORDS in frontend/src/lib/api.ts for consistency between
# the client-side demo fallback and this server-side implementation.
CATEGORY_KEYWORDS: list[tuple[IssueCategory, list[str]]] = [
    (IssueCategory.pothole, ["pothole", "khadda", "खड्डा", "गड्ढा"]),
    (IssueCategory.garbage, ["garbage", "waste", "trash", "kachra", "कचरा"]),
    (IssueCategory.streetlight, ["streetlight", "street light", "lamp", "दिवा", "pathdiva"]),
    (IssueCategory.water_leakage, ["water leak", "pipeline", "leakage", "पाणी गळती"]),
    (IssueCategory.open_manhole, ["manhole", "मॅनहोल", "man hole"]),
    (IssueCategory.fallen_tree, ["tree", "झाड", "fallen tree"]),
    (IssueCategory.drainage, ["drain", "gutter", "गटार", "sewage", "drainage"]),
    (IssueCategory.road_obstruction, ["obstruction", "debris", "blocked", "अडथळा"]),
    (IssueCategory.damaged_road, ["road damage", "broken road", "रस्ता", "damaged road"]),
    (IssueCategory.public_cleanliness, ["dirty", "unhygienic", "स्वच्छता", "toilet", "cleanliness"]),
    (IssueCategory.accessibility, ["wheelchair", "ramp", "accessibility", "दिव्यांग"]),
]

URGENT_KEYWORDS = ["accident", "danger", "urgent", "critical", "injur", "risk"]

CATEGORY_LABELS_EN: dict[IssueCategory, str] = {
    IssueCategory.pothole: "Pothole",
    IssueCategory.garbage: "Garbage / Waste",
    IssueCategory.streetlight: "Broken Streetlight",
    IssueCategory.water_leakage: "Water Leakage",
    IssueCategory.damaged_road: "Damaged Road",
    IssueCategory.open_manhole: "Open Manhole",
    IssueCategory.fallen_tree: "Fallen Tree",
    IssueCategory.road_obstruction: "Road Obstruction",
    IssueCategory.drainage: "Drainage Problem",
    IssueCategory.public_cleanliness: "Public Cleanliness",
    IssueCategory.accessibility: "Accessibility Issue",
    IssueCategory.other: "Other",
}

ROOT_CAUSE_BY_CATEGORY: dict[IssueCategory, str] = {
    IssueCategory.pothole: "water accumulation weakening the road surface over time",
    IssueCategory.garbage: "an irregular waste-collection schedule in this area",
    IssueCategory.streetlight: "an electrical fault in the fixture or wiring",
    IssueCategory.water_leakage: "an aging or cracked underground pipeline",
    IssueCategory.damaged_road: "prolonged wear combined with heavy rainfall",
    IssueCategory.open_manhole: "a missing or displaced manhole cover",
    IssueCategory.fallen_tree: "root instability aggravated by recent winds",
    IssueCategory.road_obstruction: "material left on-site without proper clearance",
    IssueCategory.drainage: "a drain that is undersized for local rainfall",
    IssueCategory.public_cleanliness: "inconsistent sanitation coverage in the area",
    IssueCategory.accessibility: "the original design not accounting for accessible access",
    IssueCategory.other: "insufficient information -- manual review recommended",
}


@dataclass
class LLMClassification:
    category: IssueCategory
    confidence: float
    severity: IssueSeverity
    safety_risk: IssueSeverity
    summary: str
    possible_causes: list[str]
    is_demo: bool
    model_version: str


class LLMProvider(ABC):
    @abstractmethod
    def classify_and_summarize(
        self, description: str, language: str | None = None, category_hint: IssueCategory | None = None
    ) -> LLMClassification:
        ...


def classify_from_text(description: str, category_hint: IssueCategory | None) -> tuple[IssueCategory, float]:
    text = description.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(k.lower() in text for k in keywords):
            return category, 0.9
    if category_hint:
        return category_hint, 0.75
    return IssueCategory.other, 0.55


def estimate_severity(description: str, category: IssueCategory) -> IssueSeverity:
    text = description.lower()
    if any(k in text for k in URGENT_KEYWORDS):
        return IssueSeverity.critical
    if category in (IssueCategory.open_manhole, IssueCategory.fallen_tree):
        return IssueSeverity.high
    if len(text) > 180:
        return IssueSeverity.high
    return IssueSeverity.medium


def safety_risk_for(severity: IssueSeverity) -> IssueSeverity:
    if severity == IssueSeverity.critical:
        return IssueSeverity.critical
    if severity == IssueSeverity.high:
        return IssueSeverity.high
    return IssueSeverity.medium


def build_summary(category: IssueCategory) -> str:
    return f"AI detected a likely {CATEGORY_LABELS_EN[category].lower()} issue from the submitted photo and description."


def build_possible_causes(category: IssueCategory) -> list[str]:
    return [f"Possible cause suggested by AI: {ROOT_CAUSE_BY_CATEGORY[category]}."]


class DemoLLMProvider(LLMProvider):
    """Deterministic, keyword-based classification. Always fast, always
    available, and always clearly labeled as demo output -- never presented as
    a verified real-world AI assessment."""

    def classify_and_summarize(
        self, description: str, language: str | None = None, category_hint: IssueCategory | None = None
    ) -> LLMClassification:
        category, confidence = classify_from_text(description, category_hint)
        severity = estimate_severity(description, category)
        safety_risk = safety_risk_for(severity)
        return LLMClassification(
            category=category,
            confidence=confidence,
            severity=severity,
            safety_risk=safety_risk,
            summary=build_summary(category),
            possible_causes=build_possible_causes(category),
            is_demo=True,
            model_version=MODEL_VERSION_DEMO,
        )


def _demo_from_exception(description: str, language: str | None, category_hint: IssueCategory | None) -> LLMClassification:
    return DemoLLMProvider().classify_and_summarize(description, language, category_hint)


class OpenAIProvider(LLMProvider):
    """Calls the OpenAI Chat Completions API. Falls back to DemoLLMProvider
    output (with a logged warning) if the call fails for any reason -- an
    external AI outage must never turn a citizen's report submission into a
    500 error."""

    def classify_and_summarize(
        self, description: str, language: str | None = None, category_hint: IssueCategory | None = None
    ) -> LLMClassification:
        try:
            return self._call_openai(description, language, category_hint)
        except Exception:  # noqa: BLE001 - any failure must gracefully degrade
            logger.warning("OpenAI classify_and_summarize failed; falling back to demo output", exc_info=True)
            return _demo_from_exception(description, language, category_hint)

    def _call_openai(self, description: str, language: str | None, category_hint: IssueCategory | None) -> LLMClassification:
        categories = ", ".join(c.value for c in IssueCategory)
        system_prompt = (
            "You are the classification engine behind Nivaran AI, a civic issue reporting platform "
            "for potholes, garbage, broken streetlights and similar public infrastructure problems. "
            f"Classify the citizen's report into exactly one of these categories: {categories}. "
            "Respond ONLY with compact JSON of the shape: "
            '{"category": "...", "confidence": 0-1, "severity": "low|medium|high|critical", '
            '"safety_risk": "low|medium|high|critical", "summary": "...", "possible_causes": ["..."]}'
        )
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": settings.OPENAI_CHAT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Language: {language or 'en'}\nDescription: {description}"},
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)

        category = IssueCategory(parsed.get("category", "other"))
        possible_causes = parsed.get("possible_causes") or [
            f"Possible cause suggested by AI: {ROOT_CAUSE_BY_CATEGORY[category]}."
        ]
        return LLMClassification(
            category=category,
            confidence=float(parsed.get("confidence", 0.7)),
            severity=IssueSeverity(parsed.get("severity", "medium")),
            safety_risk=IssueSeverity(parsed.get("safety_risk", "medium")),
            summary=parsed.get("summary") or "AI analyzed the reported issue.",
            possible_causes=possible_causes,
            is_demo=False,
            model_version=f"openai:{settings.OPENAI_CHAT_MODEL}",
        )


class AnthropicProvider(LLMProvider):
    """Calls the Anthropic Messages API. Same fallback-on-failure contract as
    OpenAIProvider."""

    def classify_and_summarize(
        self, description: str, language: str | None = None, category_hint: IssueCategory | None = None
    ) -> LLMClassification:
        try:
            return self._call_anthropic(description, language, category_hint)
        except Exception:  # noqa: BLE001
            logger.warning("Anthropic classify_and_summarize failed; falling back to demo output", exc_info=True)
            return _demo_from_exception(description, language, category_hint)

    def _call_anthropic(self, description: str, language: str | None, category_hint: IssueCategory | None) -> LLMClassification:
        categories = ", ".join(c.value for c in IssueCategory)
        system_prompt = (
            "You are the classification engine behind Nivaran AI, a civic issue reporting platform. "
            f"Classify the citizen's report into exactly one of: {categories}. "
            "Respond ONLY with compact JSON: "
            '{"category": "...", "confidence": 0-1, "severity": "low|medium|high|critical", '
            '"safety_risk": "low|medium|high|critical", "summary": "...", "possible_causes": ["..."]}'
        )
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.ANTHROPIC_CHAT_MODEL,
                    "max_tokens": 500,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": f"Language: {language or 'en'}\nDescription: {description}"}
                    ],
                },
            )
            response.raise_for_status()
            content = response.json()["content"][0]["text"]
            parsed = json.loads(content)

        category = IssueCategory(parsed.get("category", "other"))
        possible_causes = parsed.get("possible_causes") or [
            f"Possible cause suggested by AI: {ROOT_CAUSE_BY_CATEGORY[category]}."
        ]
        return LLMClassification(
            category=category,
            confidence=float(parsed.get("confidence", 0.7)),
            severity=IssueSeverity(parsed.get("severity", "medium")),
            safety_risk=IssueSeverity(parsed.get("safety_risk", "medium")),
            summary=parsed.get("summary") or "AI analyzed the reported issue.",
            possible_causes=possible_causes,
            is_demo=False,
            model_version=f"anthropic:{settings.ANTHROPIC_CHAT_MODEL}",
        )
