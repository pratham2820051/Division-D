"""Build typed assistant message blocks from orchestration results."""

from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.chat.schemas.messages import (
    AssistantBlock,
    DiagnosticQuestionPayload,
    DiseaseAnalysisPayload,
    DiseaseCandidate,
    FirstAidPayload,
    MessageType,
    SmsAlertPayload,
)
from features.chat.schemas.messages import Severity
from features.chat.utils.diagnosis_explanation import enrich_disease_candidate
from features.chat.utils.diagnosis_flow import (
    FINAL_INTRO_TEMPLATE,
    GATHERING_INTRO_TEXT,
    MORE_SYMPTOMS_TEXT,
    build_gathering_intro_text,
    low_reliability_message,
    select_next_followup,
    should_show_final_diagnosis,
    should_show_low_reliability_message,
)
from features.chat.utils.intake_flow import (
    build_generic_intake_blocks,
    build_symptom_intake_blocks,
    is_non_clinical_symptom_key,
)
from features.triage.schemas.diagnostic import FollowUpQuestion


def build_fmd_analysis(
    matched_symptoms: list[str],
    *,
    severity: Severity = Severity.URGENT,
) -> list[AssistantBlock]:
    """Mock high-confidence Foot-and-Mouth Disease analysis."""
    missing = [s for s in ["hoof lesions", "mouth blisters"] if s not in matched_symptoms]

    analysis = DiseaseAnalysisPayload(
        diseases=[
            DiseaseCandidate(
                name="Foot and Mouth Disease",
                confidence=88,
                matched_symptoms=matched_symptoms or ["fever", "drooling"],
                missing_symptoms=missing,
            ),
        ],
        severity=severity,
    )

    first_aid = FirstAidPayload(
        instructions=[
            "Isolate the animal from the herd immediately.",
            "Provide clean water and soft feed.",
            "Disinfect footwear and equipment used near the animal.",
            "Contact a veterinarian within 24 hours.",
        ],
        severity=severity,
    )

    sms = SmsAlertPayload(
        alert_text=(
            "URGENT: Suspected Foot and Mouth Disease. "
            "Animal showing fever and oral symptoms. "
            "Isolated. Requesting veterinary visit within 24 hours."
        ),
        whatsapp_text=(
            "🚨 PashuMitra Alert\n"
            "Suspected FMD — fever/drooling reported.\n"
            "Animal isolated. Please visit ASAP."
        ),
    )

    return [
        AssistantBlock(
            message_type=MessageType.TEXT,
            content="Preliminary assessment for your cattle.",
        ),
        AssistantBlock(
            message_type=MessageType.DISEASE_ANALYSIS,
            content="Disease analysis",
            payload=analysis.model_dump(),
        ),
        AssistantBlock(
            message_type=MessageType.FIRST_AID,
            content="First-aid instructions",
            payload=first_aid.model_dump(),
        ),
        AssistantBlock(
            message_type=MessageType.SMS_ALERT,
            content="Veterinary alert draft",
            payload=sms.model_dump(),
        ),
    ]


def build_diagnostic_question(
    question: str,
    *,
    context: str | None = None,
) -> list[AssistantBlock]:
    payload = DiagnosticQuestionPayload(question=question, context=context)

    return [
        AssistantBlock(
            message_type=MessageType.TEXT,
            content=GATHERING_INTRO_TEXT,
        ),
        AssistantBlock(
            message_type=MessageType.DIAGNOSTIC_QUESTION,
            content=question,
            payload=payload.model_dump(),
        ),
    ]


def build_low_confidence_follow_up(context_size: int) -> list[AssistantBlock]:
    question = "Any drooling, lameness, or mouth sores?"
    return build_diagnostic_question(question, context=f"{context_size} prior messages")


def build_generic_intake(context_size: int) -> list[AssistantBlock]:
    return build_generic_intake_blocks(context_size)


def build_symptom_intake(animal_type: str) -> list[AssistantBlock]:
    return build_symptom_intake_blocks(animal_type)


def build_contextual_intake(
    state: object,
    context_size: int,
) -> list[AssistantBlock]:
    """Ask only for information that is still missing (never re-ask known animal)."""
    from features.chat.services.conversation_state import ConversationState

    assert isinstance(state, ConversationState)

    if state.active_symptoms():
        return build_symptom_intake(state.animal_type or "animal")

    if state.animal_type:
        return build_symptom_intake(state.animal_type)

    return build_generic_intake(context_size)


def _map_severity(diagnosis: DiagnosisResponse) -> Severity:
    return Severity(diagnosis.triage_result.severity.value)


def _clinical_symptoms(state: object) -> list[str]:
    from features.chat.services.conversation_state import ConversationState

    if not isinstance(state, ConversationState):
        return []
    return [
        symptom
        for symptom in state.active_symptoms()
        if not is_non_clinical_symptom_key(symptom)
    ]


def _build_gathering_blocks(
    followup: FollowUpQuestion,
    *,
    diagnosis: DiagnosisResponse,
    conversation_state: object | None,
) -> list[AssistantBlock]:
    from features.chat.services.conversation_state import ConversationState

    if isinstance(conversation_state, ConversationState):
        conversation_state.set_active_question(followup.question, followup.symptom)

    intro = build_gathering_intro_text(diagnosis, conversation_state)
    payload = DiagnosticQuestionPayload(
        question=followup.question,
        context=followup.symptom,
        symptom_key=followup.symptom,
        question_key=followup.question,
    )
    return [
        AssistantBlock(message_type=MessageType.TEXT, content=intro),
        AssistantBlock(
            message_type=MessageType.DIAGNOSTIC_QUESTION,
            content=followup.question,
            payload=payload.model_dump(),
        ),
    ]


def _build_final_blocks(
    diagnosis: DiagnosisResponse,
    *,
    first_aid_steps: list[str],
    animal_type_label: str,
    conversation_state: object | None,
) -> list[AssistantBlock]:
    from features.chat.services.conversation_state import ConversationState

    severity = _map_severity(diagnosis)
    blocks: list[AssistantBlock] = [
        AssistantBlock(
            message_type=MessageType.TEXT,
            content=FINAL_INTRO_TEMPLATE.format(animal=animal_type_label),
        ),
    ]

    candidates = [enrich_disease_candidate(match) for match in diagnosis.candidate_diseases]
    analysis = DiseaseAnalysisPayload(diseases=candidates, severity=severity)
    blocks.append(
        AssistantBlock(
            message_type=MessageType.DISEASE_ANALYSIS,
            content="Disease analysis",
            payload=analysis.model_dump(),
        )
    )

    if first_aid_steps:
        first_aid = FirstAidPayload(instructions=first_aid_steps, severity=severity)
        blocks.append(
            AssistantBlock(
                message_type=MessageType.FIRST_AID,
                content="First-aid instructions",
                payload=first_aid.model_dump(),
            )
        )

    if isinstance(conversation_state, ConversationState):
        conversation_state.diagnosis_finalized = True
        conversation_state.clear_active_question()

    return blocks


def build_from_diagnosis(
    diagnosis: DiagnosisResponse,
    *,
    first_aid_steps: list[str],
    animal_type_label: str,
    conversation_state: object | None = None,
) -> list[AssistantBlock]:
    """Build assistant blocks from the diagnosis orchestrator output."""
    from features.chat.services.conversation_state import ConversationState

    state = conversation_state if isinstance(conversation_state, ConversationState) else None

    if isinstance(state, ConversationState) and state.diagnosis_finalized:
        return _build_final_blocks(
            diagnosis,
            first_aid_steps=first_aid_steps,
            animal_type_label=animal_type_label,
            conversation_state=state,
        )

    followup = select_next_followup(diagnosis, state)
    if followup is not None and not should_show_final_diagnosis(diagnosis, state):
        return _build_gathering_blocks(
            followup,
            diagnosis=diagnosis,
            conversation_state=state,
        )

    if should_show_low_reliability_message(diagnosis) and not should_show_final_diagnosis(
        diagnosis,
        state,
    ):
        if followup is not None:
            return _build_gathering_blocks(
                followup,
                diagnosis=diagnosis,
                conversation_state=state,
            )
        if isinstance(state, ConversationState) and not _clinical_symptoms(state):
            return build_symptom_intake(state.animal_type or "animal")
        return [
            AssistantBlock(
                message_type=MessageType.TEXT,
                content=low_reliability_message(),
            ),
        ]

    if should_show_final_diagnosis(diagnosis, state):
        return _build_final_blocks(
            diagnosis,
            first_aid_steps=first_aid_steps,
            animal_type_label=animal_type_label,
            conversation_state=state,
        )

    if diagnosis.candidate_diseases:
        return [
            AssistantBlock(message_type=MessageType.TEXT, content=MORE_SYMPTOMS_TEXT),
        ]

    severity = _map_severity(diagnosis)
    return [
        AssistantBlock(
            message_type=MessageType.TEXT,
            content=(
                f"No clear disease match yet. "
                f"Triage: {severity.value.replace('_', ' ')}."
            ),
        ),
    ]


def _build_followup_question_blocks(followup: FollowUpQuestion) -> list[AssistantBlock]:
    payload = DiagnosticQuestionPayload(
        question=followup.question,
        context=followup.symptom,
    )
    return [
        AssistantBlock(
            message_type=MessageType.DIAGNOSTIC_QUESTION,
            content=followup.question,
            payload=payload.model_dump(),
        ),
    ]
