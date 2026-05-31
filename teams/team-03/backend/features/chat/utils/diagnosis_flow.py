"""Shared thresholds and helpers for chat diagnosis UX flow."""

from __future__ import annotations

import logging

from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.chat.utils.diagnosis_explanation import (
    EARLY_FINALIZATION_THRESHOLD,
    HIGH_VALUE_SYMPTOM_WEIGHT,
    LOW_RELIABILITY_MESSAGE,
    build_differentiation_summary,
    is_reliable_confidence,
    should_finalize_early,
)
from features.rag.schemas.disease import DiseaseMatch
from features.triage.schemas.diagnostic import FollowUpQuestion

logger = logging.getLogger(__name__)

# Minimum confidence before SMS alert and standard final cards.
FINAL_CONFIDENCE_THRESHOLD = 0.70
AMBIGUITY_GAP_THRESHOLD = 0.15
SUFFICIENT_SYMPTOM_COUNT = 3

VOICE_TRANSCRIPTION_MIN_CONFIDENCE = 0.45
VOICE_LANGUAGE_MISMATCH_MIN = 0.55

GATHERING_INTRO_TEXT = "I have a few questions to identify the disease."
FINAL_INTRO_TEMPLATE = "Preliminary assessment for your {animal}."
MORE_SYMPTOMS_TEXT = "Please share any other symptoms you notice."

VOICE_UNCLEAR_TEXT = (
    "I could not clearly understand the audio. Please try again."
)
VOICE_LANGUAGE_MISMATCH_TEMPLATE = (
    "It sounds like you spoke in {detected}, but {selected} is selected. "
    "Please confirm the language or try again."
)


def top_confidence(diagnosis: DiagnosisResponse) -> float:
    if not diagnosis.candidate_diseases:
        return 0.0
    return diagnosis.candidate_diseases[0].confidence_score


def has_high_value_pending_questions(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """True when an unanswered follow-up targets a high-weight distinguishing symptom."""
    from features.rag.repositories import get_default_repository

    repository = get_default_repository()
    repository.ensure_loaded()
    pending = select_next_followup(diagnosis, conversation_state)
    if pending is None or not pending.symptom:
        return False

    symptom_id = repository.resolve_symptom_id(pending.symptom)
    if not symptom_id:
        return False

    for match in diagnosis.candidate_diseases[:3]:
        weight = repository.get_symptom_weights(match.disease_id).get(symptom_id, 0.0)
        if weight >= HIGH_VALUE_SYMPTOM_WEIGHT:
            return True
    return False


def has_sufficient_evidence(
    diagnosis: DiagnosisResponse | None = None,
    *,
    matches: list[DiseaseMatch] | None = None,
) -> bool:
    """True when reported symptoms already support a leading diagnosis."""
    candidate_matches = matches
    if candidate_matches is None and diagnosis is not None:
        candidate_matches = diagnosis.candidate_diseases
    if not candidate_matches:
        return False

    top = candidate_matches[0]
    matched_count = len(top.matched_symptoms)

    if should_finalize_early(
        top.confidence_score,
        has_high_value_pending=False,
    ):
        return True
    if top.confidence_score >= FINAL_CONFIDENCE_THRESHOLD:
        return True
    if matched_count >= SUFFICIENT_SYMPTOM_COUNT:
        return True
    if matched_count >= 2:
        if len(candidate_matches) < 2:
            return True
        gap = top.confidence_score - candidate_matches[1].confidence_score
        if gap >= AMBIGUITY_GAP_THRESHOLD:
            return True
    return False


def build_gathering_intro_text(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> str:
    """Explain why a follow-up question is being asked."""
    from features.chat.services.conversation_state import ConversationState

    state = conversation_state if isinstance(conversation_state, ConversationState) else None
    symptoms = state.active_symptoms() if state else []
    if not symptoms or not diagnosis.candidate_diseases:
        return GATHERING_INTRO_TEXT

    differentiation = build_differentiation_summary(diagnosis.candidate_diseases)
    if differentiation and len(diagnosis.candidate_diseases) >= 2:
        return differentiation

    readable = ", ".join(symptoms[:3])
    top_name = diagnosis.candidate_diseases[0].disease_name
    return (
        f"Based on {readable}, {top_name} is one possibility. "
        f"I need one more detail to narrow it down."
    )


def evaluate_voice_input(
    *,
    transcription_confidence: float,
    language_confidence: float,
    requested_language: str | None,
    detected_language: str | None,
    fallback_used: bool,
    selected_language: str,
) -> str | None:
    """
    Return a blocking reason for unreliable voice input.

    Values: ``unclear``, ``language_mismatch``, or ``None`` when safe to proceed.
    """
    if fallback_used:
        return "unclear"
    if transcription_confidence < VOICE_TRANSCRIPTION_MIN_CONFIDENCE:
        return "unclear"

    requested = (requested_language or selected_language or "").split("-")[0].lower()
    detected = (detected_language or "").split("-")[0].lower()
    selected = selected_language.split("-")[0].lower()

    if (
        requested
        and detected
        and requested != detected
        and language_confidence >= VOICE_LANGUAGE_MISMATCH_MIN
    ):
        return "language_mismatch"
    return None


def select_next_followup(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> FollowUpQuestion | None:
    """Return the first follow-up question that has not been asked or answered."""
    from features.chat.services.conversation_state import ConversationState

    state = conversation_state if isinstance(conversation_state, ConversationState) else None
    for followup in diagnosis.followup_questions:
        if state and state.should_skip_question(followup.question, followup.symptom):
            continue
        return followup
    return None


def has_pending_followup(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    return select_next_followup(diagnosis, conversation_state) is not None


def is_questioning_exhausted(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """True when the question service has no remaining actionable follow-ups."""
    return not has_pending_followup(diagnosis, conversation_state)


def should_show_final_diagnosis(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """
    Show disease analysis and first aid when:
    - a leading candidate exists,
    - no pending follow-up remains, and
    - confidence meets the threshold OR questioning is exhausted.
    """
    from features.chat.services.conversation_state import ConversationState

    state = conversation_state if isinstance(conversation_state, ConversationState) else None
    if isinstance(state, ConversationState) and state.diagnosis_finalized:
        return bool(diagnosis.candidate_diseases)

    if not diagnosis.candidate_diseases:
        return False

    confidence = top_confidence(diagnosis)
    if not is_reliable_confidence(confidence):
        return False

    high_value_pending = has_high_value_pending_questions(diagnosis, state)
    if should_finalize_early(confidence, has_high_value_pending=high_value_pending):
        return True

    if has_sufficient_evidence(diagnosis=diagnosis):
        return True

    if has_pending_followup(diagnosis, state):
        return False

    if confidence >= FINAL_CONFIDENCE_THRESHOLD:
        return True

    return is_questioning_exhausted(diagnosis, state)


def should_show_low_reliability_message(diagnosis: DiagnosisResponse) -> bool:
    """True when confidence is too low to present a disease call."""
    if not diagnosis.candidate_diseases:
        return True
    return not is_reliable_confidence(top_confidence(diagnosis))


def low_reliability_message() -> str:
    return LOW_RELIABILITY_MESSAGE


def is_information_gathering(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """True when the assistant should ask a follow-up instead of showing final cards."""
    if should_show_low_reliability_message(diagnosis):
        return has_pending_followup(diagnosis, conversation_state)
    if should_show_final_diagnosis(diagnosis, conversation_state):
        return False
    return has_pending_followup(diagnosis, conversation_state)


def is_final_diagnosis(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """Alias for final card rendering and first-aid lookup."""
    return should_show_final_diagnosis(diagnosis, conversation_state)


def should_generate_sms_alert(
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> bool:
    """SMS alerts only after sufficient confidence and when not gathering information."""
    if not should_show_final_diagnosis(diagnosis, conversation_state):
        return False
    return top_confidence(diagnosis) >= FINAL_CONFIDENCE_THRESHOLD


def log_diagnosis_decision(
    *,
    stage: str,
    symptoms: list[str],
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> None:
    """Structured debug logging for diagnosis finalization audits."""
    from features.chat.services.conversation_state import ConversationState

    state = conversation_state if isinstance(conversation_state, ConversationState) else None
    confirmed = list(state.confirmed_symptoms) if state else []
    rejected = list(state.rejected_symptoms) if state else []
    pending = select_next_followup(diagnosis, state)
    logger.info(
        "diagnosis_flow stage=%s symptoms=%s confirmed=%s rejected=%s "
        "confidence=%.3f followups=%d pending=%s show_final=%s sms=%s finalized=%s",
        stage,
        symptoms,
        confirmed,
        rejected,
        top_confidence(diagnosis),
        len(diagnosis.followup_questions),
        pending.symptom if pending else None,
        should_show_final_diagnosis(diagnosis, state),
        should_generate_sms_alert(diagnosis, state),
        getattr(state, "diagnosis_finalized", False) if state else False,
    )
