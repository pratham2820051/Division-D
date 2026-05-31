"""Conversation memory and diagnostic context for multi-turn triage."""

from __future__ import annotations

from dataclasses import dataclass, field

from features.chat.schemas.messages import MessageType
from features.chat.services.disease_mention_recognizer import DiseaseMention
from features.chat.services.symptom_extraction_service import (
    SymptomExtractionService,
    detect_animal_only_message,
    detect_animal_type_in_text,
)
from features.chat.utils.domain_classifier import is_guardrail_response
from features.chat.utils.text_preprocessor import preprocess_farmer_message
from features.chat.utils.intake_flow import is_non_clinical_symptom_key
from features.confidence_scoring.utils.symptom_normalizer import (
    expand_normalized_symptoms,
    normalize_symptom,
)
from features.memory.models.chat import Message, MessageRole
from features.rag.schemas.enums import AnimalType

_YES_ANSWERS = frozenset({"yes", "y", "yeah", "yep", "ha", "ಹೌದು", "ಹೌದ"})
_NO_ANSWERS = frozenset({"no", "n", "nope", "nah", "ಇಲ್ಲ"})


def _question_tracking_key(payload: dict | None, question: str = "") -> str:
    if payload:
        for key in ("question_key", "question"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip().lower()
    return question.strip().lower()


def _symptom_tracking_key(payload: dict | None, context: str | None = None) -> str | None:
    if payload:
        for key in ("symptom_key", "context"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return context


@dataclass
class ConversationState:
    """Accumulated triage context across a chat session."""

    animal_type: str | None = None
    animal_age: str | None = None
    animal_sex: str | None = None
    extracted_symptoms: list[str] = field(default_factory=list)
    confirmed_symptoms: list[str] = field(default_factory=list)
    rejected_symptoms: list[str] = field(default_factory=list)
    asked_questions: set[str] = field(default_factory=set)
    answered_questions: set[str] = field(default_factory=set)
    asked_symptoms: set[str] = field(default_factory=set)
    answered_symptoms: set[str] = field(default_factory=set)
    active_question: str | None = None
    active_symptom: str | None = None
    language: str = "en"
    top_candidate_diseases: list[str] = field(default_factory=list)
    candidate_disease_ids: list[str] = field(default_factory=list)
    disease_mention: DiseaseMention | None = None
    diagnosis_finalized: bool = False
    last_voice_transcription_confidence: float | None = None
    last_voice_language_confidence: float | None = None
    last_voice_requested_language: str | None = None
    last_voice_detected_language: str | None = None
    last_voice_fallback_used: bool = False

    def active_symptoms(self) -> list[str]:
        """Symptoms used for diagnosis (extracted + confirmed, minus rejected)."""
        rejected = expand_normalized_symptoms(self.rejected_symptoms)
        merged: list[str] = []
        seen: set[str] = set()

        for symptom in self.extracted_symptoms + self.confirmed_symptoms:
            if is_non_clinical_symptom_key(symptom):
                continue
            normalized_group = expand_normalized_symptoms([symptom])
            if normalized_group & rejected:
                continue
            key = normalize_symptom(symptom)
            if key in seen:
                continue
            seen.add(key)
            merged.append(symptom)

        return merged

    def reported_symptom_keys(self) -> set[str]:
        return expand_normalized_symptoms(self.active_symptoms())

    def record_candidate_matches(self, matches: list) -> None:
        """Persist latest ranked disease candidates for differentiation/explanations."""
        self.top_candidate_diseases = [match.disease_name for match in matches[:5]]
        self.candidate_disease_ids = [match.disease_id for match in matches[:5]]

    def record_animal_metadata(self, *, age: str | None = None, sex: str | None = None) -> None:
        if age and age.strip():
            self.animal_age = age.strip()
        if sex and sex.strip():
            self.animal_sex = sex.strip()

    def record_symptom(self, symptom: str) -> None:
        key = normalize_symptom(symptom)
        if not key:
            return
        for existing in self.extracted_symptoms + self.confirmed_symptoms:
            if normalize_symptom(existing) == key:
                return
        self.extracted_symptoms.append(symptom)

    def confirm_symptom(self, symptom: str) -> None:
        key = normalize_symptom(symptom)
        if not key:
            return
        self.rejected_symptoms = [
            s for s in self.rejected_symptoms if normalize_symptom(s) != key
        ]
        if not any(normalize_symptom(s) == key for s in self.confirmed_symptoms):
            self.confirmed_symptoms.append(symptom)

    def reject_symptom(self, symptom: str) -> None:
        key = normalize_symptom(symptom)
        if not key:
            return
        self.confirmed_symptoms = [
            s for s in self.confirmed_symptoms if normalize_symptom(s) != key
        ]
        if not any(normalize_symptom(s) == key for s in self.rejected_symptoms):
            self.rejected_symptoms.append(symptom)

    def clear_active_question(self) -> None:
        self.active_question = None
        self.active_symptom = None

    def record_voice_metadata(
        self,
        *,
        transcription_confidence: float,
        language_confidence: float,
        requested_language: str | None = None,
        detected_language: str | None = None,
        fallback_used: bool = False,
    ) -> None:
        self.last_voice_transcription_confidence = transcription_confidence
        self.last_voice_language_confidence = language_confidence
        self.last_voice_requested_language = requested_language
        self.last_voice_detected_language = detected_language
        self.last_voice_fallback_used = fallback_used

    def set_active_question(self, question: str, symptom: str | None) -> None:
        self.active_question = question
        self.active_symptom = symptom
        if question:
            self.asked_questions.add(question.strip().lower())
        if symptom:
            normalized = normalize_symptom(symptom)
            self.asked_symptoms.add(normalized)
            self.asked_symptoms.update(expand_normalized_symptoms([symptom]))

    def record_diagnostic_answer(
        self,
        question: str,
        symptom: str | None,
        *,
        confirmed: bool,
    ) -> None:
        """Persist YES/NO outcome and exclude this symptom/question from future turns."""
        question_key = question.strip().lower()
        if question_key:
            self.asked_questions.add(question_key)
            self.answered_questions.add(question_key)

        if symptom and symptom.strip() and not is_non_clinical_symptom_key(symptom):
            if confirmed:
                self.confirm_symptom(symptom)
            else:
                self.reject_symptom(symptom)
            for key in expand_normalized_symptoms([symptom]):
                self.asked_symptoms.add(key)
                self.answered_symptoms.add(key)

        self.clear_active_question()

    def should_skip_question(self, question: str, symptom: str | None) -> bool:
        question_key = question.strip().lower()
        if question_key in self.answered_questions:
            return True

        if symptom:
            symptom_keys = expand_normalized_symptoms([symptom])
            if symptom_keys & self.answered_symptoms:
                return True
            if symptom_keys & self.reported_symptom_keys():
                return True
            if symptom_keys & expand_normalized_symptoms(self.rejected_symptoms):
                return True

        return False

    @classmethod
    def from_messages(
        cls,
        messages: list[Message],
        extractor: SymptomExtractionService,
        *,
        language: str = "en",
        exclude_last_user_turn: bool = False,
    ) -> ConversationState:
        """Rebuild state from stored chat history."""
        state = cls(language=language)
        slice_end = len(messages)
        if (
            exclude_last_user_turn
            and messages
            and messages[-1].role == MessageRole.USER
        ):
            slice_end -= 1

        pending_symptom: str | None = None
        pending_question: str | None = None
        pending_question_key: str | None = None

        for message in messages[:slice_end]:
            if message.role == MessageRole.ASSISTANT:
                if is_guardrail_response(message.content):
                    state = cls(language=language)
                    pending_symptom = None
                    pending_question = None
                    pending_question_key = None
                    continue
                cls._absorb_assistant_message(state, message)
                if (
                    message.message_type == MessageType.DIAGNOSTIC_QUESTION.value
                    and message.payload
                ):
                    pending_question = message.payload.get("question")
                    pending_question_key = _question_tracking_key(
                        message.payload,
                        str(pending_question or ""),
                    )
                    pending_symptom = _symptom_tracking_key(
                        message.payload,
                        message.payload.get("context"),
                    )
                continue

            if message.role != MessageRole.USER:
                continue

            content = message.content.strip()
            lower = content.lower()

            if pending_question and lower in _YES_ANSWERS | _NO_ANSWERS:
                state.record_diagnostic_answer(
                    pending_question_key or pending_question or "",
                    pending_symptom,
                    confirmed=lower in _YES_ANSWERS,
                )
                pending_symptom = None
                pending_question = None
                pending_question_key = None
                continue

            cls._absorb_user_message(state, content, extractor)

        if pending_question:
            state.set_active_question(
                pending_question_key or pending_question or "",
                pending_symptom,
            )

        return state

    @staticmethod
    def _absorb_user_message(
        state: ConversationState,
        content: str,
        extractor: SymptomExtractionService,
    ) -> None:
        preprocessed = preprocess_farmer_message(content)
        animal_only = detect_animal_only_message(content)
        extracted = extractor.extract(content)
        detected_animal = detect_animal_type_in_text(preprocessed)

        if animal_only is not None:
            state.animal_type = animal_only.value
        elif detected_animal is not None:
            state.animal_type = detected_animal.value

        mention = extractor.recognize_disease_mention(content)
        if mention is not None:
            state.disease_mention = mention

        for symptom in extracted.symptoms:
            state.record_symptom(symptom)

        ConversationState._extract_animal_metadata(state, preprocessed)

    @staticmethod
    def _extract_animal_metadata(state: ConversationState, text: str) -> None:
        lowered = text.lower()
        age_markers = (
            " year",
            " years",
            " month",
            " months",
            " old",
            " ವಯಸ್ಸ",
            " महीने",
            " साल",
        )
        if any(marker in lowered for marker in age_markers):
            for token in text.replace(",", " ").split():
                if any(char.isdigit() for char in token):
                    state.record_animal_metadata(age=token.strip(".,;"))
                    break

        sex_map = {
            "male": "male",
            "female": "female",
            "bull": "male",
            "cow": "female",
            "heifer": "female",
            "ram": "male",
            "ewe": "female",
            "ಹುಡುಗ": "male",
            "ಹೆಣ್ಣು": "female",
            "नर": "male",
            "मादा": "female",
        }
        for keyword, sex in sex_map.items():
            if keyword in lowered:
                state.record_animal_metadata(sex=sex)
                break

    @staticmethod
    def _absorb_assistant_message(state: ConversationState, message: Message) -> None:
        if message.message_type == MessageType.DIAGNOSTIC_QUESTION.value and message.payload:
            question = message.payload.get("question", "")
            question_key = _question_tracking_key(message.payload, str(question))
            symptom = _symptom_tracking_key(message.payload, message.payload.get("context"))
            if question_key:
                state.asked_questions.add(question_key)
            if symptom:
                state.asked_symptoms.update(expand_normalized_symptoms([symptom]))

        if message.message_type == MessageType.DISEASE_ANALYSIS.value and message.payload:
            diseases = message.payload.get("diseases") or []
            state.top_candidate_diseases = [
                d.get("name", "") for d in diseases if d.get("name")
            ]
            top = diseases[0] if diseases else None
            if top and int(top.get("confidence", 0)) >= 70:
                state.diagnosis_finalized = True
