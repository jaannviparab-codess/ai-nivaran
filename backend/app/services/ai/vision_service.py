"""Vision provider abstraction: image-based category/severity hints.

There is no real vision model available in demo mode, so the demo provider
derives a plausible result from the description text plus a hash of the image
bytes -- the same image+text combination always produces the same result
(deterministic, not random noise), and the output is always clearly labeled
``is_demo=True``.
"""
from __future__ import annotations

import base64
import hashlib
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.models.enums import IssueCategory, IssueSeverity

logger = logging.getLogger("nivaran.ai.vision")

MODEL_VERSION_DEMO = "nivaran-vision-demo-v1"


@dataclass
class VisionHint:
    category_hint: IssueCategory | None
    severity_hint: IssueSeverity | None
    confidence: float
    is_demo: bool
    model_version: str


class VisionProvider(ABC):
    @abstractmethod
    def analyze_image(self, image_bytes: bytes, description: str) -> VisionHint:
        ...


class DemoVisionProvider(VisionProvider):
    def analyze_image(self, image_bytes: bytes, description: str) -> VisionHint:
        digest = hashlib.sha256(image_bytes + description.encode("utf-8", errors="ignore")).hexdigest()
        seed = int(digest[:8], 16)

        categories = list(IssueCategory)
        severities = list(IssueSeverity)
        category_hint = categories[seed % len(categories)]
        severity_hint = severities[(seed // len(categories)) % len(severities)]
        confidence = round(0.55 + (seed % 30) / 100, 2)  # deterministic 0.55-0.84

        return VisionHint(
            category_hint=category_hint,
            severity_hint=severity_hint,
            confidence=confidence,
            is_demo=True,
            model_version=MODEL_VERSION_DEMO,
        )


class OpenAIVisionProvider(VisionProvider):
    def analyze_image(self, image_bytes: bytes, description: str) -> VisionHint:
        try:
            return self._call_openai(image_bytes, description)
        except Exception:  # noqa: BLE001
            logger.warning("OpenAI vision analysis failed; falling back to demo output", exc_info=True)
            return DemoVisionProvider().analyze_image(image_bytes, description)

    def _call_openai(self, image_bytes: bytes, description: str) -> VisionHint:
        b64 = base64.b64encode(image_bytes).decode("ascii")
        categories = ", ".join(c.value for c in IssueCategory)
        prompt = (
            "You are the vision engine behind Nivaran AI, a civic issue reporting platform. "
            f"Look at the photo and pick the single best-matching category from: {categories}, "
            "and estimate severity (low|medium|high|critical). "
            'Respond ONLY with JSON: {"category": "...", "severity": "...", "confidence": 0-1}'
        )
        with httpx.Client(timeout=25.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": settings.OPENAI_VISION_MODEL,
                    "messages": [
                        {"role": "system", "content": prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": description or "Analyze this civic issue photo."},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                            ],
                        },
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            parsed = json.loads(response.json()["choices"][0]["message"]["content"])

        return VisionHint(
            category_hint=IssueCategory(parsed["category"]) if parsed.get("category") else None,
            severity_hint=IssueSeverity(parsed["severity"]) if parsed.get("severity") else None,
            confidence=float(parsed.get("confidence", 0.7)),
            is_demo=False,
            model_version=f"openai:{settings.OPENAI_VISION_MODEL}",
        )
