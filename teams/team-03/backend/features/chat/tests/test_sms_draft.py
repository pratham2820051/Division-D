"""Tests for on-demand SMS draft generation."""

from __future__ import annotations

import importlib
import json
from pathlib import Path

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.chat_service import ChatService
from features.chat.services.orchestrator import ChatOrchestrator
from features.memory.services.memory_service import MemoryService
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
def diagnosed_chat(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[ChatService, str]:
    fmd = _disease(
        "fmd",
        "Foot and Mouth Disease",
        ["high fever", "drooling"],
        ["Isolate the animal immediately."],
    )
    path = tmp_path / "fmd.json"
    path.write_text(json.dumps(fmd.model_dump(mode="json")), encoding="utf-8")

    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    orchestrator = ChatOrchestrator(document_service=document_service)
    chat_service_mod = importlib.import_module("features.chat.services.chat_service")
    monkeypatch.setattr(chat_service_mod, "chat_orchestrator", orchestrator)

    memory = MemoryService()
    service = ChatService(memory=memory)
    chat = service.create_chat(title="SMS test")
    service.send_message(
        chat.id,
        "My cow has high fever and is drooling.",
        language="en",
    )
    return service, chat.id


def test_send_message_does_not_auto_emit_sms(diagnosed_chat: tuple[ChatService, str]) -> None:
    service, chat_id = diagnosed_chat
    chat = service.get_chat(chat_id)
    sms_count = sum(1 for m in chat.messages if m.message_type == MessageType.SMS_ALERT.value)
    assert sms_count == 0
    assert any(m.message_type == MessageType.DISEASE_ANALYSIS.value for m in chat.messages)


def test_generate_sms_draft_after_diagnosis(diagnosed_chat: tuple[ChatService, str]) -> None:
    service, chat_id = diagnosed_chat
    result = service.generate_sms_draft(chat_id, language="en")

    assert result["chat_id"] == chat_id
    msg = result["assistant_message"]
    assert msg.message_type == MessageType.SMS_ALERT.value
    assert msg.payload
    assert msg.payload.get("alert_text")
    assert msg.payload.get("whatsapp_text")
    assert "\\n" not in str(msg.payload.get("alert_text", ""))

    chat = service.get_chat(chat_id)
    assert sum(1 for m in chat.messages if m.message_type == MessageType.SMS_ALERT.value) == 1
