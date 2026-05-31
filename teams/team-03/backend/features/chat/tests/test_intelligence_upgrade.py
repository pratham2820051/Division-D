"""Tests for farmer-language intelligence upgrades."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.services.disease_mention_recognizer import (
    DiseaseMentionRecognizer,
    apply_disease_mention_boost,
)
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.text_preprocessor import preprocess_farmer_message
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.disease_retrieval_service import DiseaseRetrievalService
from features.chat.services.diagnosis_orchestrator import DiagnosisOrchestrator


@pytest.fixture
def extractor() -> RuleBasedSymptomExtractor:
    return RuleBasedSymptomExtractor()


@pytest.fixture
def service(extractor: RuleBasedSymptomExtractor) -> SymptomExtractionService:
    return SymptomExtractionService(extractor=extractor)


@pytest.fixture
def mention_recognizer() -> DiseaseMentionRecognizer:
    return DiseaseMentionRecognizer()


# --- Preprocessing & ASR ---


def test_asr_gold_corrected_to_goat(service: SymptomExtractionService) -> None:
    result = service.extract("Here you my gold has been affected with antax")
    assert result.animal_type == AnimalType.GOAT


def test_preprocessor_fixes_disease_typos() -> None:
    text = preprocess_farmer_message("my goat has antax and mastitus")
    assert "anthrax" in text
    assert "mastitis" in text


def test_farmer_language_mouth_water(service: SymptomExtractionService) -> None:
    result = service.extract("Cow has mouth water coming and fever")
    assert "excessive salivation and drooling" in result.symptoms
    assert "fever" in result.symptoms


def test_farmer_language_not_eating(service: SymptomExtractionService) -> None:
    result = service.extract("Buffalo not eating since yesterday")
    assert "reduced appetite" in result.symptoms


def test_farmer_language_skin_bumps(service: SymptomExtractionService) -> None:
    result = service.extract("Cattle with skin bumps on neck")
    assert "firm skin nodules on neck and body" in result.symptoms


def test_farmer_language_milk_reduced(service: SymptomExtractionService) -> None:
    result = service.extract("Cow milk reduced and udder pain")
    assert "reduced milk yield" in result.symptoms


def test_farmer_language_walking_problem(service: SymptomExtractionService) -> None:
    result = service.extract("Goat has walking problem")
    assert "lameness and reluctance to walk" in result.symptoms


# --- Fuzzy spelling ---


def test_fuzzy_mastitus_spelling(service: SymptomExtractionService) -> None:
    result = service.extract("Cow udder swollen with mastitus")
    mention = service.recognize_disease_mention("Cow udder swollen with mastitus")
    assert mention is not None
    assert mention.detected_disease == "Mastitis"


def test_fuzzy_lumpy_disease_alias(service: SymptomExtractionService) -> None:
    mention = service.recognize_disease_mention("My buffalo has lumpy disease")
    assert mention is not None
    assert mention.disease_id == "lumpy-skin-disease"


def test_fmd_alias(service: SymptomExtractionService) -> None:
    mention = service.recognize_disease_mention("Suspected fmd in cattle")
    assert mention is not None
    assert mention.detected_disease == "Foot and Mouth Disease"


# --- Disease mention recognition ---


@pytest.mark.parametrize(
    "message,expected_id",
    [
        ("My goat has anthrax", "anthrax"),
        ("gold affected with antax", "anthrax"),
        ("antrax in cow", "anthrax"),
        ("anthraks problem", "anthrax"),
        ("mastaitis in dairy cow", "mastitis"),
        ("foot and mouth in herd", "foot-and-mouth-disease"),
    ],
)
def test_disease_mention_recognition(
    mention_recognizer: DiseaseMentionRecognizer,
    message: str,
    expected_id: str,
) -> None:
    mention = mention_recognizer.recognize(message)
    assert mention is not None
    assert mention.disease_id == expected_id
    assert mention.confidence >= 0.82


def test_transliterated_anthraks(mention_recognizer: DiseaseMentionRecognizer) -> None:
    mention = mention_recognizer.recognize("goat has anthraks")
    assert mention is not None
    assert mention.disease_id == "anthrax"


# --- Confidence boosting ---


def test_disease_mention_boost_adds_anthrax() -> None:
    mention = DiseaseMentionRecognizer().recognize("goat has anthrax")
    assert mention is not None
    boosted = apply_disease_mention_boost([], mention)
    assert len(boosted) == 1
    assert boosted[0].disease_id == "anthrax"
    assert boosted[0].confidence_score == pytest.approx(0.30)


def test_disease_mention_boost_increases_existing_match() -> None:
    from features.rag.schemas.disease import DiseaseMatch

    mention = DiseaseMentionRecognizer().recognize("anthrax")
    assert mention is not None
    existing = DiseaseMatch(
        disease_id="anthrax",
        disease_name="Anthrax",
        confidence_score=0.12,
        matched_symptoms=["fever"],
        missing_symptoms=["bloody discharge from natural openings"],
    )
    boosted = apply_disease_mention_boost([existing], mention)
    assert boosted[0].confidence_score == pytest.approx(0.42)


# --- End-to-end orchestrator ---


def _write_disease(directory: Path, disease: Disease) -> None:
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")


@pytest.fixture
def anthrax_orchestrator(tmp_path: Path) -> ChatOrchestrator:
    anthrax = Disease(
        disease_id="anthrax",
        disease_name="Anthrax",
        animal_type=AnimalType.GOAT,
        description="Anthrax description.",
        symptoms=[
            "sudden death without warning",
            "high fever",
            "bloody discharge from natural openings",
            "difficulty breathing",
        ],
        critical_symptoms=[
            "sudden death without warning",
            "bloody discharge from natural openings",
        ],
        first_aid=["Do not open carcass."],
        severity_level=DiseaseSeverityLevel.CRITICAL,
    )
    _write_disease(tmp_path, anthrax)
    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


def test_gold_antax_message_runs_anthrax_diagnosis(
    anthrax_orchestrator: ChatOrchestrator,
) -> None:
    result = anthrax_orchestrator.process(
        "Here you my gold has been affected with antax",
        context_size=0,
    )

    assert result.disease == "Anthrax"
    assert result.confidence >= 0.30
    assert "more information" not in result.reply.lower() or result.disease == "Anthrax"


def test_direct_anthrax_mention_diagnosis(anthrax_orchestrator: ChatOrchestrator) -> None:
    result = anthrax_orchestrator.process("My goat has anthrax", context_size=0)
    assert result.disease == "Anthrax"
    assert result.confidence >= 0.30


def test_anthrax_gets_disease_specific_question(tmp_path: Path) -> None:
    anthrax = Disease(
        disease_id="anthrax",
        disease_name="Anthrax",
        animal_type=AnimalType.CATTLE,
        description="Anthrax.",
        symptoms=[
            "sudden death without warning",
            "bloody discharge from natural openings",
        ],
        critical_symptoms=["bloody discharge from natural openings"],
        severity_level=DiseaseSeverityLevel.CRITICAL,
    )
    _write_disease(tmp_path, anthrax)
    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    orchestrator = DiagnosisOrchestrator(
        retrieval_service=DiseaseRetrievalService(document_service=document_service),
        document_service=document_service,
    )
    mention = DiseaseMentionRecognizer().recognize("goat has anthrax")
    response = orchestrator.diagnose("goat", [], disease_mention=mention)

    assert response.candidate_diseases[0].disease_id == "anthrax"
    assert response.followup_questions
    assert "bloody discharge" in response.followup_questions[0].question.lower()
