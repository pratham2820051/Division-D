"""Structured chat message types for triage orchestration."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Severity(str, Enum):
    SELF_TREATABLE = "self_treatable"
    URGENT = "urgent"
    CRITICAL = "critical"


class MessageType(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    DIAGNOSTIC_QUESTION = "diagnostic_question"
    DISEASE_ANALYSIS = "disease_analysis"
    FIRST_AID = "first_aid"
    SMS_ALERT = "sms_alert"
    SYSTEM = "system"


class DiseaseCandidate(BaseModel):
    name: str
    confidence: float = Field(..., ge=0, le=100)
    matched_symptoms: list[str] = Field(default_factory=list)
    missing_symptoms: list[str] = Field(default_factory=list)
    contradicted_symptoms: list[str] = Field(default_factory=list)
    confidence_reason: str | None = None


class DiseaseAnalysisPayload(BaseModel):
    diseases: list[DiseaseCandidate]
    severity: Severity


class DiagnosticQuestionPayload(BaseModel):
    question: str
    context: str | None = None
    """Canonical English symptom key — never translate (used for YES/NO tracking)."""
    symptom_key: str | None = None
    """Stable English question id — never translate (dedupes localized question text)."""
    question_key: str | None = None
    options: list[str] = Field(default_factory=lambda: ["Yes", "No", "Custom answer"])


class FirstAidPayload(BaseModel):
    instructions: list[str]
    severity: Severity | None = None


class SmsAlertPayload(BaseModel):
    alert_text: str
    whatsapp_text: str | None = None
    recipient_hint: str = "Local veterinarian"
    recipient_phone: str | None = Field(
        default=None,
        description="Optional vet WhatsApp number (digits with country code, no +).",
    )


class TextPayload(BaseModel):
    text: str


class AssistantBlock(BaseModel):
    message_type: MessageType
    content: str
    payload: dict[str, Any] | None = None
