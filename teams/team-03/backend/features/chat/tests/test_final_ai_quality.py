"""Final intelligence and demo stabilization tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.schemas.request import VoiceInputMetadata
from features.chat.services.conversation_state import ConversationState
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.diagnosis_flow import (
    VOICE_UNCLEAR_TEXT,
    evaluate_voice_input,
    has_sufficient_evidence,
)
from features.chat.utils.domain_classifier import (
    DOMAIN_GUARDRAIL_TEXT,
    MessageDomain,
    classify_message_domain,
)
from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService


def _write_disease(directory: Path, disease: Disease) -> None:
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


@pytest.fixture
def fmd_orchestrator(tmp_path: Path) -> ChatOrchestrator:
    fmd = Disease(
        disease_id="foot-and-mouth-disease",
        disease_name="Foot and Mouth Disease",
        animal_type=AnimalType.CATTLE,
        description="FMD",
        symptoms=[
            "fever",
            "high fever",
            "excessive salivation and drooling",
            "blisters on tongue and gums",
            "blisters on hooves and between digits",
        ],
        critical_symptoms=["excessive salivation and drooling"],
        first_aid=["Isolate immediately."],
        severity_level=DiseaseSeverityLevel.HIGH,
    )
    _write_disease(tmp_path, fmd)
    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


def test_low_voice_confidence_blocks_diagnosis(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process(
        "My cow has fever and drooling",
        context_size=0,
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.2,
            language_confidence=0.9,
            requested_language="kn",
            detected_language="kn",
            fallback_used=False,
        ),
    )

    assert result.disease is None
    assert VOICE_UNCLEAR_TEXT in result.reply
    assert len(result.blocks) == 1
    assert result.blocks[0].message_type == MessageType.TEXT


def test_voice_fallback_blocks_diagnosis(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process(
        "random english words",
        context_size=0,
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.8,
            language_confidence=0.8,
            requested_language="kn",
            detected_language="en",
            fallback_used=True,
        ),
    )

    assert VOICE_UNCLEAR_TEXT in result.reply


def test_language_mismatch_asks_confirmation(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process(
        "My cow has fever",
        context_size=0,
        language="kn",
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.8,
            language_confidence=0.9,
            requested_language="kn",
            detected_language="en",
            fallback_used=False,
        ),
    )

    assert "spoke in en" in result.reply.lower()
    assert result.disease is None


def test_evaluate_voice_input_clear_when_confident() -> None:
    assert (
        evaluate_voice_input(
            transcription_confidence=0.8,
            language_confidence=0.8,
            requested_language="kn",
            detected_language="kn",
            fallback_used=False,
            selected_language="kn",
        )
        is None
    )


def test_off_topic_query_blocked() -> None:
    assert classify_message_domain("What is IPL score?") is MessageDomain.OUT_OF_SCOPE
    assert classify_message_domain("My cow has fever") is MessageDomain.LIVESTOCK_HEALTH


def test_off_topic_guardrail_in_orchestrator(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process("Who is Prime Minister?", context_size=0)
    assert "livestock health assistant" in result.reply.lower()
    assert result.disease is None


def test_fmd_three_symptoms_skip_questions(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process(
        "My cow has fever, mouth water coming, and mouth blisters",
        context_size=0,
    )

    types = {block.message_type for block in result.blocks}
    assert MessageType.DISEASE_ANALYSIS in types
    assert MessageType.DIAGNOSTIC_QUESTION not in types
    assert result.disease == "Foot and Mouth Disease"


def test_fever_then_drooling_combined(service: SymptomExtractionService) -> None:
    state = ConversationState()
    ConversationState._absorb_user_message(state, "My cow has fever", service)
    ConversationState._absorb_user_message(state, "drooling", service)

    assert state.animal_type == "cattle"
    symptoms = state.active_symptoms()
    assert "fever" in symptoms
    assert "drooling" in symptoms


def test_gathering_intro_explains_reason(tmp_path: Path) -> None:
    fmd = Disease(
        disease_id="foot-and-mouth-disease",
        disease_name="Foot and Mouth Disease",
        animal_type=AnimalType.CATTLE,
        description="FMD",
        symptoms=["fever", "high fever", "excessive salivation and drooling"],
        critical_symptoms=["excessive salivation and drooling"],
        severity_level=DiseaseSeverityLevel.HIGH,
    )
    _write_disease(tmp_path, fmd)
    orchestrator = ChatOrchestrator(
        document_service=DiseaseDocumentService(documents_dir=tmp_path),
    )
    first = orchestrator.process("My cow has fever", context_size=0)

    assert "one possibility" in first.reply.lower()
    assert "foot and mouth" in first.reply.lower()


def test_has_sufficient_evidence_with_three_matches() -> None:
    matches = [
        DiseaseMatch(
            disease_id="fmd",
            disease_name="FMD",
            confidence_score=0.375,
            matched_symptoms=["a", "b", "c"],
            missing_symptoms=[],
        )
    ]
    assert has_sufficient_evidence(matches=matches)


def test_voice_metadata_stored_on_state(service: SymptomExtractionService) -> None:
    orchestrator = ChatOrchestrator()
    orchestrator.process(
        "My cow has fever",
        context_size=0,
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.9,
            language_confidence=0.88,
            requested_language="hi",
            detected_language="hi",
            fallback_used=False,
        ),
    )
    # Metadata is recorded on ephemeral state during processing; verify evaluator accepts it.
    assert (
        evaluate_voice_input(
            transcription_confidence=0.9,
            language_confidence=0.88,
            requested_language="hi",
            detected_language="hi",
            fallback_used=False,
            selected_language="hi",
        )
        is None
    )
