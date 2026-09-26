"""Transcription provider abstraction.

The frontend performs browser-side transcription (Web Speech API) and forwards
the resulting text as ``CreateIssuePayload.voiceTranscript``. This service
exists mainly so a real server-side speech-to-text provider can be plugged in
later for raw audio uploads; in demo mode (and today, in all modes, since no
raw-audio upload path exists yet) it is a simple pass-through.
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class TranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_or_text: str, language: str | None = None) -> str:
        ...


class DemoTranscriptionProvider(TranscriptionProvider):
    """Returns whatever transcript text the client already sent."""

    def transcribe(self, audio_or_text: str, language: str | None = None) -> str:
        return audio_or_text or ""


class OpenAITranscriptionProvider(TranscriptionProvider):
    """Placeholder for a real server-side speech-to-text integration (e.g.
    Whisper) once the frontend gains a raw-audio upload path. Until then it
    safely behaves the same as the demo provider."""

    def transcribe(self, audio_or_text: str, language: str | None = None) -> str:
        return DemoTranscriptionProvider().transcribe(audio_or_text, language)
