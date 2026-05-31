"""Central chat orchestration — symptom extraction and diagnosis pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field

from features.chat.schemas.messages import AssistantBlock, MessageType, Severity
from features.chat.schemas.request import VoiceInputMetadata
from features.chat.services.conversation_state import ConversationState
from features.chat.services.diagnosis_orchestrator import DiagnosisOrchestrator
from features.chat.services.symptom_extraction_service import SymptomExtractionService
from features.chat.utils.message_builder import (
    build_contextual_intake,
    build_from_diagnosis,
)
from features.chat.utils.domain_classifier import (
    DOMAIN_GUARDRAIL_TEXT,
    MessageDomain,
    classify_message_domain,
)
from features.chat.utils.diagnosis_flow import (
    VOICE_LANGUAGE_MISMATCH_TEMPLATE,
    VOICE_UNCLEAR_TEXT,
    evaluate_voice_input,
    log_diagnosis_decision,
    should_show_final_diagnosis,
)
from features.chat.utils.intake_flow import (
    INTAKE_NO_PROMPT,
    INTAKE_YES_PROMPT,
    is_intake_diagnostic_question,
)
from features.chat.utils.supported_animals import (
    UNSUPPORTED_ANIMAL_MESSAGE,
    is_unsupported_animal_type,
)
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.first_aid_service import FirstAidService

_YES_ANSWERS = frozenset({"yes", "y", "yeah", "yep", "ha", "ಹೌದು", "ಹೌದ"})
_NO_ANSWERS = frozenset({"no", "n", "nope", "nah", "ಇಲ್ಲ"})


@dataclass
class OrchestrationResult:
    blocks: list[AssistantBlock] = field(default_factory=list)
    severity: Severity | None = None
    confidence: float = 0.0
    disease: str | None = None
    first_aid: str | None = None
    follow_up_question: str | None = None

    @property
    def reply(self) -> str:
        for block in self.blocks:
            if block.message_type == MessageType.TEXT:
                return block.content
        return self.blocks[0].content if self.blocks else ""


class ChatOrchestrator:
    """Routes farmer messages through symptom extraction and diagnosis services."""

    def __init__(
        self,
        symptom_extractor: SymptomExtractionService | None = None,
        diagnosis_orchestrator: DiagnosisOrchestrator | None = None,
        first_aid_service: FirstAidService | None = None,
        document_service: DiseaseDocumentService | None = None,
    ) -> None:
        self._document_service = document_service or DiseaseDocumentService()
        self._symptom_extractor = symptom_extractor or SymptomExtractionService()
        self._diagnosis_orchestrator = diagnosis_orchestrator or DiagnosisOrchestrator(
            document_service=self._document_service,
        )
        self._first_aid_service = first_aid_service or FirstAidService()

    def process(
        self,
        user_message: str,
        context_size: int,
        language: str = "en",
        *,
        recent_messages: list[Message] | None = None,
        voice_metadata: VoiceInputMetadata | None = None,
    ) -> OrchestrationResult:
        recent_messages = recent_messages or []
        state = ConversationState.from_messages(
            recent_messages,
            self._symptom_extractor,
            language=language,
            exclude_last_user_turn=True,
        )

        if voice_metadata is not None:
            state.record_voice_metadata(
                transcription_confidence=voice_metadata.transcription_confidence,
                language_confidence=voice_metadata.language_confidence,
                requested_language=voice_metadata.requested_language,
                detected_language=voice_metadata.detected_language,
                fallback_used=voice_metadata.fallback_used,
            )
            voice_issue = evaluate_voice_input(
                transcription_confidence=voice_metadata.transcription_confidence,
                language_confidence=voice_metadata.language_confidence,
                requested_language=voice_metadata.requested_language,
                detected_language=voice_metadata.detected_language,
                fallback_used=voice_metadata.fallback_used,
                selected_language=language,
            )
            if voice_issue == "unclear":
                return self._text_only_result(VOICE_UNCLEAR_TEXT)
            if voice_issue == "language_mismatch":
                detected = voice_metadata.detected_language or "another language"
                selected = language.split("-")[0]
                return self._text_only_result(
                    VOICE_LANGUAGE_MISMATCH_TEMPLATE.format(
                        detected=detected,
                        selected=selected,
                    )
                )

        lower = user_message.lower().strip()
        if lower in _YES_ANSWERS | _NO_ANSWERS and (
            state.active_symptom or state.active_question
        ):
            if is_intake_diagnostic_question(
                active_symptom=state.active_symptom,
                active_question=state.active_question,
            ):
                return self._handle_intake_yes_no(
                    answered_yes=lower in _YES_ANSWERS,
                    state=state,
                )
            return self._handle_yes_no_answer(
                answered_yes=lower in _YES_ANSWERS,
                state=state,
            )

        domain = classify_message_domain(user_message, extractor=self._symptom_extractor)
        if domain is MessageDomain.OUT_OF_SCOPE:
            return self._text_only_result(DOMAIN_GUARDRAIL_TEXT)

        self._apply_current_user_turn(state, user_message)

        unsupported = self._unsupported_animal_result(state)
        if unsupported is not None:
            return unsupported

        symptoms = state.active_symptoms()
        unsupported = self._unsupported_animal_result(state)
        if unsupported is not None:
            return unsupported

        if not symptoms and state.disease_mention is None:
            blocks = build_contextual_intake(state, context_size)
            return OrchestrationResult(
                blocks=blocks,
                severity=Severity.SELF_TREATABLE,
                confidence=0.0,
                follow_up_question=blocks[-1].content if blocks else None,
            )

        animal_type = state.animal_type or "cattle"
        return self._run_diagnosis(
            state=state,
            animal_type=animal_type,
            symptoms=symptoms,
        )

    def _apply_current_user_turn(
        self,
        state: ConversationState,
        user_message: str,
    ) -> None:
        ConversationState._absorb_user_message(state, user_message, self._symptom_extractor)

    @staticmethod
    def _unsupported_animal_result(state: ConversationState) -> OrchestrationResult | None:
        if not is_unsupported_animal_type(state.animal_type):
            return None
        return ChatOrchestrator._text_only_result(UNSUPPORTED_ANIMAL_MESSAGE)

    def _run_diagnosis(
        self,
        *,
        state: ConversationState,
        animal_type: str,
        symptoms: list[str],
        stage: str = "after_diagnosis",
    ) -> OrchestrationResult:
        diagnosis = self._diagnosis_orchestrator.diagnose(
            animal_type,
            symptoms,
            disease_mention=state.disease_mention,
            conversation_state=state,
        )
        log_diagnosis_decision(
            stage=stage,
            symptoms=symptoms,
            diagnosis=diagnosis,
            conversation_state=state,
        )
        first_aid_steps: list[str] = []

        if diagnosis.candidate_diseases and should_show_final_diagnosis(diagnosis, state):
            diseases = self._document_service.load_all()
            recommendation = self._first_aid_service.get_first_aid(
                diagnosis.candidate_diseases[0],
                diseases,
            )
            first_aid_steps = list(recommendation.first_aid)
            state.top_candidate_diseases = [
                match.disease_name for match in diagnosis.candidate_diseases
            ]

        blocks = build_from_diagnosis(
            diagnosis,
            first_aid_steps=first_aid_steps,
            animal_type_label=animal_type,
            conversation_state=state,
        )

        top_match = diagnosis.candidate_diseases[0] if diagnosis.candidate_diseases else None
        follow_up = None
        for block in blocks:
            if block.message_type == MessageType.DIAGNOSTIC_QUESTION and block.payload:
                follow_up = block.payload.get("question")
                break

        return OrchestrationResult(
            blocks=blocks,
            severity=Severity(diagnosis.triage_result.severity.value),
            confidence=top_match.confidence_score if top_match else 0.0,
            disease=top_match.disease_name if top_match else None,
            first_aid="\n".join(first_aid_steps) if first_aid_steps else None,
            follow_up_question=follow_up,
        )

    def _handle_intake_yes_no(
        self,
        *,
        answered_yes: bool,
        state: ConversationState,
    ) -> OrchestrationResult:
        """Open-ended intake was wrongly answered with yes/no — ask for free text."""
        question = state.active_question or ""
        state.record_diagnostic_answer(question, state.active_symptom, confirmed=answered_yes)
        prompt = INTAKE_YES_PROMPT if answered_yes else INTAKE_NO_PROMPT
        return self._text_only_result(prompt)

    def _handle_yes_no_answer(
        self,
        *,
        answered_yes: bool,
        state: ConversationState,
    ) -> OrchestrationResult:
        question = state.active_question or ""
        symptom = state.active_symptom
        state.record_diagnostic_answer(
            question,
            symptom,
            confirmed=answered_yes,
        )

        symptoms = state.active_symptoms()
        unsupported = self._unsupported_animal_result(state)
        if unsupported is not None:
            return unsupported

        animal_type = state.animal_type or "cattle"
        return self._run_diagnosis(
            state=state,
            animal_type=animal_type,
            symptoms=symptoms,
            stage="after_yes_no",
        )

    @staticmethod
    def _text_only_result(text: str) -> OrchestrationResult:
        return OrchestrationResult(
            blocks=[AssistantBlock(message_type=MessageType.TEXT, content=text)],
            severity=Severity.SELF_TREATABLE,
            confidence=0.0,
            follow_up_question=None,
        )


chat_orchestrator = ChatOrchestrator()
