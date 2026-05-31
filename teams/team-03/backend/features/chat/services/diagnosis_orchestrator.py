"""Orchestrates retrieval, questioning, triage, and alert generation."""

from __future__ import annotations

from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.chat.utils.diagnosis_flow import (
    has_pending_followup,
    should_generate_sms_alert,
    should_show_final_diagnosis,
)
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.disease_retrieval_service import DiseaseRetrievalService
from features.sms_alerts.services.sms_alert_service import SmsAlertService
from features.triage.services.diagnostic_question_service import DiagnosticQuestionService
from features.triage.services.triage_service import TriageService


class DiagnosisOrchestrator:
    """Run the full deterministic diagnosis workflow for reported symptoms."""

    def __init__(
        self,
        retrieval_service: DiseaseRetrievalService | None = None,
        diagnostic_service: DiagnosticQuestionService | None = None,
        triage_service: TriageService | None = None,
        sms_alert_service: SmsAlertService | None = None,
        document_service: DiseaseDocumentService | None = None,
        *,
        top_k: int = 5,
    ) -> None:
        self._document_service = document_service or DiseaseDocumentService()
        self._retrieval_service = retrieval_service or DiseaseRetrievalService(
            document_service=self._document_service,
        )
        self._diagnostic_service = diagnostic_service or DiagnosticQuestionService()
        self._triage_service = triage_service or TriageService()
        self._sms_alert_service = sms_alert_service or SmsAlertService()
        self._top_k = top_k

    def diagnose(
        self,
        animal_type: str,
        symptoms: list[str],
        disease_mention: object | None = None,
        conversation_state: object | None = None,
    ) -> DiagnosisResponse:
        """Execute retrieval, questioning, triage, and alert generation."""
        from features.chat.services.conversation_state import ConversationState

        rejected: list[str] = []
        if isinstance(conversation_state, ConversationState):
            rejected = list(conversation_state.rejected_symptoms)

        candidate_diseases = self._retrieval_service.retrieve_candidates(
            symptoms,
            top_k=self._top_k,
            disease_mention=disease_mention,
            animal_type=animal_type,
            rejected_symptoms=rejected,
        )
        if isinstance(conversation_state, ConversationState):
            conversation_state.record_candidate_matches(candidate_diseases)

        diseases = self._document_service.load_all(animal_type=animal_type)
        followup_questions = self._diagnostic_service.generate_followup_questions(
            candidate_diseases,
            diseases,
            conversation_state=conversation_state,
        )
        triage_result = self._triage_service.classify(symptoms)

        diagnosis = DiagnosisResponse(
            candidate_diseases=candidate_diseases,
            followup_questions=followup_questions,
            triage_result=triage_result,
            sms_alert=None,
            requires_more_information=True,
        )
        diagnosis = diagnosis.model_copy(
            update={
                "requires_more_information": has_pending_followup(
                    diagnosis,
                    conversation_state,
                )
                or (
                    bool(candidate_diseases)
                    and not should_show_final_diagnosis(diagnosis, conversation_state)
                )
            }
        )

        if should_generate_sms_alert(diagnosis, conversation_state):
            pass  # SMS drafts are generated on demand via POST /chat/{id}/sms-draft

        return diagnosis
