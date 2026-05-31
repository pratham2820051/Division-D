"""Integration tests for ChatOrchestrator with real diagnosis services."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.orchestrator import ChatOrchestrator
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService


def _disease(disease_id: str, name: str, symptoms: list[str], first_aid: list[str]) -> Disease:
    return Disease(
        disease_id=disease_id,
        disease_name=name,
        animal_type=AnimalType.CATTLE,
        description=f"Description for {name}.",
        symptoms=symptoms,
        first_aid=first_aid,
        severity_level=DiseaseSeverityLevel.HIGH,
    )


@pytest.fixture
def orchestrator(tmp_path: Path) -> ChatOrchestrator:
    fmd = _disease(
        "fmd",
        "Foot and Mouth Disease",
        ["high fever", "drooling"],
        ["Isolate the animal immediately."],
    )
    mastitis = _disease(
        "mastitis",
        "Mastitis",
        ["swollen painful udder quarter", "fever"],
        ["Contact a veterinarian."],
    )
    for disease in (fmd, mastitis):
        path = tmp_path / f"{disease.disease_id}.json"
        path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")

    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


def test_process_uses_diagnosis_pipeline_for_symptom_message(
    orchestrator: ChatOrchestrator,
) -> None:
    result = orchestrator.process(
        "My cow has high fever and is drooling.",
        context_size=0,
    )

    assert result.disease is not None
    assert result.confidence > 0.0
    assert any(block.message_type == MessageType.DISEASE_ANALYSIS for block in result.blocks)
    assert any(block.message_type == MessageType.FIRST_AID for block in result.blocks)
    assert not any(block.message_type == MessageType.SMS_ALERT for block in result.blocks)


def test_process_mastitis_symptoms(orchestrator: ChatOrchestrator) -> None:
    result = orchestrator.process(
        "Cow has swollen painful udder quarter and fever",
        context_size=0,
    )

    assert result.disease == "Mastitis"
    assert result.confidence == pytest.approx(1.0)
