"""Reads AI_PROVIDER / VISION_PROVIDER / SPEECH_PROVIDER from settings and
returns the matching provider implementation. Every capability defaults to a
zero-dependency demo implementation, so the app runs with no external keys.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.services.ai.embedding_service import DemoEmbeddingProvider, EmbeddingProvider, OpenAIEmbeddingProvider
from app.services.ai.llm_service import AnthropicProvider, DemoLLMProvider, LLMProvider, OpenAIProvider
from app.services.ai.transcription_service import DemoTranscriptionProvider, TranscriptionProvider
from app.services.ai.vision_service import DemoVisionProvider, OpenAIVisionProvider, VisionProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider()
    if settings.AI_PROVIDER == "anthropic" and settings.ANTHROPIC_API_KEY:
        return AnthropicProvider()
    return DemoLLMProvider()


@lru_cache
def get_vision_provider() -> VisionProvider:
    if settings.VISION_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        return OpenAIVisionProvider()
    return DemoVisionProvider()


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    # Embeddings are only offered by the OpenAI branch of AI_PROVIDER (Anthropic
    # has no public embeddings endpoint); anything else runs the local demo
    # embedding, which needs no external key.
    if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider()
    return DemoEmbeddingProvider()


@lru_cache
def get_transcription_provider() -> TranscriptionProvider:
    return DemoTranscriptionProvider()
