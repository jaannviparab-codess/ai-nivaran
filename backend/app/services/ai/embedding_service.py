"""Embedding provider abstraction, used for duplicate-description similarity.

The demo provider is a hashed bag-of-words vector: not a real semantic
embedding, but consistent (same text always yields the same vector) and cheap
enough to compute locally with no external dependency.
"""
from __future__ import annotations

import hashlib
import logging
import math
import re
from abc import ABC, abstractmethod

import httpx

from app.core.config import settings

logger = logging.getLogger("nivaran.ai.embedding")

DEMO_EMBEDDING_DIMENSIONS = 256
_TOKEN_RE = re.compile(r"[^\W\d_]+", re.UNICODE)  # unicode-aware "words" (incl. Devanagari)


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed(self, text: str) -> list[float]:
        ...


class DemoEmbeddingProvider(EmbeddingProvider):
    """Cheap, fully local, deterministic embedding: a hashed bag-of-words
    vector. Good enough to catch near-duplicate descriptions in demo mode."""

    def embed(self, text: str) -> list[float]:
        vector = [0.0] * DEMO_EMBEDDING_DIMENSIONS
        tokens = _TOKEN_RE.findall(text.lower())
        for token in tokens:
            if len(token) < 2:
                continue
            digest = hashlib.md5(token.encode("utf-8")).hexdigest()
            index = int(digest, 16) % DEMO_EMBEDDING_DIMENSIONS
            vector[index] += 1.0
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def embed(self, text: str) -> list[float]:
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
                    json={"model": settings.OPENAI_EMBEDDING_MODEL, "input": text or " "},
                )
                response.raise_for_status()
                return response.json()["data"][0]["embedding"]
        except Exception:  # noqa: BLE001
            logger.warning("OpenAI embedding call failed; falling back to demo embedding", exc_info=True)
            return DemoEmbeddingProvider().embed(text)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    dot = sum(a[i] * b[i] for i in range(n))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
