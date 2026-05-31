"""Deterministic veterinary SMS alert generation."""

from __future__ import annotations

from features.rag.repositories.disease_repository import DiseaseRepository, get_default_repository
from features.rag.schemas.disease import DiseaseMatch
from features.rag.schemas.enums import TriageSeverity
from features.rag.schemas.responses import TriageResult
from features.sms_alerts.schemas.alert import MAX_ALERT_MESSAGE_LENGTH, AlertDraft

_SEVERITY_HEADERS: dict[TriageSeverity, str] = {
    TriageSeverity.CRITICAL: "CRITICAL VETERINARY ALERT",
    TriageSeverity.URGENT: "URGENT VETERINARY ALERT",
    TriageSeverity.SELF_TREATABLE: "VETERINARY ALERT",
}

_SEVERITY_CLOSING: dict[TriageSeverity, str] = {
    TriageSeverity.CRITICAL: "Immediate veterinary attention required.",
    TriageSeverity.URGENT: "Immediate veterinary attention recommended.",
    TriageSeverity.SELF_TREATABLE: (
        "Monitor the animal and consult a veterinarian if symptoms worsen."
    ),
}

_SEVERITY_EMOJI: dict[TriageSeverity, str] = {
    TriageSeverity.CRITICAL: "🚨",
    TriageSeverity.URGENT: "⚠️",
    TriageSeverity.SELF_TREATABLE: "📋",
}


class SmsAlertService:
    """Build structured alert drafts from disease matches and triage outcomes."""

    def __init__(self, repository: DiseaseRepository | None = None) -> None:
        self._repository = repository or get_default_repository()

    def generate_alert(
        self,
        animal_type: str,
        disease_match: DiseaseMatch,
        triage_result: TriageResult,
        symptoms: list[str],
    ) -> AlertDraft:
        """Generate a concise English alert draft (no LLM)."""
        cleaned_symptoms = self._clean_symptoms(symptoms)
        severity = triage_result.severity
        header = _SEVERITY_HEADERS[severity]
        message = self._build_message(
            animal_type=animal_type,
            disease_id=disease_match.disease_id,
            disease_name=disease_match.disease_name,
            confidence_score=disease_match.confidence_score,
            severity=severity,
            symptoms=cleaned_symptoms,
        )
        action_line = self._extract_action_from_alert(message) or _SEVERITY_CLOSING[severity]
        whatsapp_message = self._build_whatsapp_message(
            header=header,
            animal_type=animal_type,
            disease_name=disease_match.disease_name,
            confidence_score=disease_match.confidence_score,
            severity=severity,
            symptoms=cleaned_symptoms,
            action_line=action_line,
        )

        return AlertDraft(
            animal_type=self._format_animal_type(animal_type),
            suspected_disease=disease_match.disease_name.strip(),
            confidence_score=disease_match.confidence_score,
            severity=severity,
            symptoms=cleaned_symptoms,
            message=message,
            whatsapp_message=self._enforce_max_length(whatsapp_message),
        )

    def _build_message(
        self,
        *,
        animal_type: str,
        disease_id: str,
        disease_name: str,
        confidence_score: float,
        severity: TriageSeverity,
        symptoms: list[str],
    ) -> str:
        self._repository.ensure_loaded()
        template = self._repository.get_sms_template(disease_id)
        if template:
            message = self._normalize_escapes(
                template.format(
                    severity_header=_SEVERITY_HEADERS[severity],
                    animal_type=self._format_animal_type(animal_type),
                    disease_name=disease_name.strip(),
                    confidence=self._format_confidence(confidence_score),
                    symptoms=self._format_symptoms_line(symptoms),
                    severity=self._format_severity_label(severity),
                )
            )
            return self._enforce_max_length(message)

        header = _SEVERITY_HEADERS[severity]
        closing = _SEVERITY_CLOSING[severity]
        symptoms_line = self._format_symptoms_line(symptoms)

        sections = [
            header,
            "",
            f"Animal: {self._format_animal_type(animal_type)}",
            "",
            "Suspected Disease:",
            disease_name.strip(),
            "",
            "Confidence:",
            self._format_confidence(confidence_score),
            "",
            "Symptoms:",
            symptoms_line,
            "",
            "Severity:",
            self._format_severity_label(severity),
            "",
            closing,
        ]
        message = "\n".join(sections)
        return self._enforce_max_length(message)

    def _build_whatsapp_message(
        self,
        *,
        header: str,
        animal_type: str,
        disease_name: str,
        confidence_score: float,
        severity: TriageSeverity,
        symptoms: list[str],
        action_line: str,
    ) -> str:
        emoji = _SEVERITY_EMOJI[severity]
        severity_label = severity.value.replace("_", " ").title()
        sections = [
            f"{emoji} *{header}*",
            "",
            f"*Animal:* {self._format_animal_type(animal_type)}",
            f"*Suspected Disease:* {disease_name.strip()}",
            f"*Confidence:* {self._format_confidence(confidence_score)}",
            f"*Symptoms:* {self._format_symptoms_line(symptoms)}",
            f"*Severity:* {severity_label}",
            "",
            action_line.strip(),
            "",
            "_Via PashuMitra AI_",
        ]
        return "\n".join(sections)

    @staticmethod
    def _normalize_escapes(text: str) -> str:
        """Convert CSV literal ``\\n`` sequences into real line breaks."""
        return text.replace("\\n", "\n").replace("\\t", "\t")

    @staticmethod
    def _extract_action_from_alert(message: str) -> str:
        """Return the guidance paragraph at the end of a formatted alert."""
        normalized = SmsAlertService._normalize_escapes(message)
        marker = "\n\nSeverity:\n"
        if marker in normalized:
            tail = normalized.split(marker, 1)[1]
            if "\n\n" in tail:
                _, action = tail.split("\n\n", 1)
                return action.strip()

        parts = [part.strip() for part in normalized.split("\n\n") if part.strip()]
        if not parts:
            return ""
        last = parts[-1]
        if last.upper().startswith(("VETERINARY", "URGENT", "CRITICAL")):
            return ""
        if last.startswith("Severity:"):
            lines = last.split("\n")
            return lines[-1].strip() if len(lines) > 1 else ""
        return last

    @staticmethod
    def _clean_symptoms(symptoms: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for symptom in symptoms:
            label = symptom.strip()
            if not label:
                continue
            key = label.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(label)
        return cleaned

    @staticmethod
    def _format_animal_type(animal_type: str) -> str:
        normalized = animal_type.strip().replace("_", " ")
        if not normalized:
            return "Unknown"
        return normalized.title()

    @staticmethod
    def _format_confidence(confidence_score: float) -> str:
        percent = int(round(confidence_score * 100))
        return f"{percent}%"

    @staticmethod
    def _format_severity_label(severity: TriageSeverity) -> str:
        return severity.value.replace("_", " ").upper()

    @staticmethod
    def _format_symptoms_line(symptoms: list[str]) -> str:
        if not symptoms:
            return "None reported"
        return ", ".join(SmsAlertService._format_symptom_label(symptom) for symptom in symptoms)

    @staticmethod
    def _format_symptom_label(symptom: str) -> str:
        return symptom.strip().title()

    @staticmethod
    def _enforce_max_length(message: str) -> str:
        if len(message) <= MAX_ALERT_MESSAGE_LENGTH:
            return message
        truncated = message[: MAX_ALERT_MESSAGE_LENGTH - 3].rstrip()
        return f"{truncated}..."
