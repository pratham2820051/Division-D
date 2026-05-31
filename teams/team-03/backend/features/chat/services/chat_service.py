"""Chat management service — orchestrates memory + triage pipeline."""

import logging

from features.chat.schemas.messages import MessageType
from features.chat.schemas.request import VoiceInputMetadata
from features.chat.services.orchestrator import chat_orchestrator
from features.chat.utils.conversation_language import resolve_conversation_language
from features.chat.utils.localization import localize_blocks
from features.memory.models.chat import MessageRole
from features.memory.services.memory_service import MemoryService, memory_service

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, memory: MemoryService | None = None) -> None:
        self._memory = memory or memory_service

    def create_chat(self, title: str = "New chat"):
        return self._memory.create_chat(title=title)

    def list_chats(self):
        return self._memory.list_chats()

    def get_chat(self, chat_id: str):
        return self._memory.get_chat(chat_id)

    def delete_chat(self, chat_id: str) -> None:
        self._memory.delete_chat(chat_id)

    def rename_chat(self, chat_id: str, title: str):
        return self._memory.rename_chat(chat_id, title)

    def send_message(
        self,
        chat_id: str,
        message: str,
        language: str = "en",
        *,
        voice_metadata: VoiceInputMetadata | None = None,
    ) -> dict:
        user_type = (
            MessageType.VOICE.value
            if message.startswith("[voice]")
            else MessageType.TEXT.value
        )

        user_content = (
            message.removeprefix("[voice]").strip()
            if user_type == MessageType.VOICE.value
            else message
        )

        user_msg = self._memory.add_message(
            chat_id,
            MessageRole.USER,
            user_content,
            auto_title=True,
            message_type=user_type,
        )

        context = self._memory.get_recent_context(chat_id)

        detected_language = (
            voice_metadata.detected_language if voice_metadata else None
        )
        conversation_language = resolve_conversation_language(
            language,
            detected_language,
            message_text=user_content,
        )
        from features.chat.utils.message_language import infer_language_from_message

        inferred = infer_language_from_message(user_content)
        logger.info(
            "Chat language resolved user=%s stt_detected=%s text_inferred=%s active=%s chat_id=%s",
            language,
            detected_language,
            inferred,
            conversation_language,
            chat_id,
        )

        orchestration = chat_orchestrator.process(
            user_content,
            len(context),
            conversation_language,
            recent_messages=context,
            voice_metadata=voice_metadata,
        )

        blocks = localize_blocks(orchestration.blocks, conversation_language)

        reply = orchestration.reply
        for block in blocks:
            if block.message_type == MessageType.TEXT:
                reply = block.content
                break

        assistant_messages = []
        for block in blocks:
            assistant_msg = self._memory.add_message(
                chat_id,
                MessageRole.ASSISTANT,
                block.content,
                auto_title=False,
                message_type=block.message_type.value,
                payload=block.payload,
            )
            assistant_messages.append(assistant_msg)

        primary = assistant_messages[0] if assistant_messages else user_msg

        return {
            "chat_id": chat_id,
            "user_message": user_msg,
            "assistant_message": primary,
            "assistant_messages": assistant_messages,
            "blocks": blocks,
            "language": conversation_language,
            "reply": reply,
            "severity": orchestration.severity,
            "confidence": orchestration.confidence,
            "disease": orchestration.disease,
            "first_aid": orchestration.first_aid,
            "follow_up_question": orchestration.follow_up_question,
        }

    def generate_sms_draft(self, chat_id: str, language: str = "en") -> dict:
        from config.settings import settings
        from features.chat.schemas.messages import AssistantBlock, MessageType, SmsAlertPayload
        from features.chat.services.conversation_state import ConversationState
        from features.chat.services.symptom_extraction_service import SymptomExtractionService
        from features.chat.utils.conversation_language import resolve_conversation_language
        from features.rag.schemas.disease import DiseaseMatch
        from features.rag.schemas.enums import TriageSeverity
        from features.rag.schemas.responses import TriageResult
        from features.sms_alerts.services.sms_alert_service import SmsAlertService

        def _normalize_vet_phone(raw: str) -> str | None:
            digits = "".join(ch for ch in raw if ch.isdigit())
            return digits or None

        chat = self._memory.get_chat(chat_id)
        context = chat.messages
        conversation_language = resolve_conversation_language(language)

        extractor = SymptomExtractionService()
        state = ConversationState.from_messages(context, extractor, language=conversation_language)

        disease_payload = None
        for message in reversed(context):
            if message.message_type == MessageType.DISEASE_ANALYSIS.value and message.payload:
                disease_payload = message.payload
                break

        if not disease_payload:
            raise ValueError("No disease analysis found — complete diagnosis first.")

        diseases = disease_payload.get("diseases") or []
        if not diseases:
            raise ValueError("No disease candidates in the latest analysis.")

        top = diseases[0]
        severity_raw = str(disease_payload.get("severity") or "self_treatable").lower()
        try:
            severity = TriageSeverity(severity_raw)
        except ValueError:
            severity = TriageSeverity.SELF_TREATABLE

        confidence_pct = int(top.get("confidence") or 0)
        disease_match = DiseaseMatch(
            disease_id=str(top.get("disease_id") or top.get("name", "unknown")).lower().replace(" ", "-"),
            disease_name=str(top.get("name") or "Unknown disease"),
            confidence_score=confidence_pct / 100.0,
            matched_symptoms=list(top.get("matched_symptoms") or []),
            missing_symptoms=list(top.get("missing_symptoms") or []),
        )

        animal_type = state.animal_type or "cattle"
        symptoms = state.active_symptoms() or disease_match.matched_symptoms

        alert = SmsAlertService().generate_alert(
            animal_type=animal_type,
            disease_match=disease_match,
            triage_result=TriageResult(severity=severity, reason="SMS draft from diagnosis"),
            symptoms=symptoms,
        )

        vet_phone = _normalize_vet_phone(settings.vet_whatsapp_phone)

        block = AssistantBlock(
            message_type=MessageType.SMS_ALERT,
            content="Veterinary alert draft",
            payload=SmsAlertPayload(
                alert_text=alert.message,
                whatsapp_text=alert.whatsapp_message,
                recipient_phone=vet_phone,
            ).model_dump(),
        )
        localized_blocks = localize_blocks([block], conversation_language)
        localized = localized_blocks[0]

        assistant_msg = self._memory.add_message(
            chat_id,
            MessageRole.ASSISTANT,
            localized.content,
            auto_title=False,
            message_type=MessageType.SMS_ALERT.value,
            payload=localized.payload,
        )

        logger.info(
            "SMS draft generated chat_id=%s disease=%s confidence=%s severity=%s language=%s",
            chat_id,
            disease_match.disease_name,
            confidence_pct,
            severity.value,
            conversation_language,
        )

        return {
            "chat_id": chat_id,
            "assistant_message": assistant_msg,
            "language": conversation_language,
        }


chat_service = ChatService()