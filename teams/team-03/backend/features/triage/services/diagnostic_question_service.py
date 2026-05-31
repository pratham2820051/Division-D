"""Adaptive diagnostic questioning when disease confidence scores are ambiguous."""

from __future__ import annotations

from collections import defaultdict

from features.confidence_scoring.utils.symptom_normalizer import (
    expand_normalized_symptoms,
    normalize_symptom,
)
from features.rag.repositories.disease_repository import DiseaseRepository, get_default_repository
from features.rag.schemas.disease import Disease, DiseaseMatch
from features.triage.services.information_gain import (
    information_gain_for_symptom,
    resolve_symptom_id,
)
from features.triage.schemas.diagnostic import FollowUpQuestion

AMBIGUITY_THRESHOLD = 0.15
MAX_FOLLOWUP_QUESTIONS = 1
MAX_CONVERSATION_QUESTIONS = 6
LOW_CONFIDENCE_THRESHOLD = 0.70
EARLY_FINALIZATION_THRESHOLD = 0.85


class DiagnosticQuestionService:
    """Generate follow-up questions that distinguish between similarly scored diseases."""

    def __init__(
        self,
        *,
        ambiguity_threshold: float = AMBIGUITY_THRESHOLD,
        max_questions: int = MAX_FOLLOWUP_QUESTIONS,
        repository: DiseaseRepository | None = None,
    ) -> None:
        self._ambiguity_threshold = ambiguity_threshold
        self._max_questions = max_questions
        self._repository = repository or get_default_repository()

    def generate_followup_questions(
        self,
        matches: list[DiseaseMatch],
        diseases: list[Disease],
        conversation_state: object | None = None,
    ) -> list[FollowUpQuestion]:
        """
        Return up to ``max_questions`` follow-ups when top diagnoses are ambiguous
        or when a leading candidate still needs disease-specific confirmation.
        """
        from features.chat.services.conversation_state import ConversationState
        from features.chat.utils.diagnosis_flow import has_sufficient_evidence
        from features.confidence_scoring.utils.symptom_normalizer import (
            expand_normalized_symptoms,
        )

        state = conversation_state if isinstance(conversation_state, ConversationState) else None
        if isinstance(state, ConversationState) and state.diagnosis_finalized:
            return []

        if isinstance(state, ConversationState) and len(state.asked_questions) >= MAX_CONVERSATION_QUESTIONS:
            return []

        sorted_matches = self._sort_matches(matches)
        if not sorted_matches:
            return []

        if has_sufficient_evidence(matches=sorted_matches):
            return []

        if sorted_matches[0].confidence_score >= EARLY_FINALIZATION_THRESHOLD:
            return []

        disease_by_id = {disease.disease_id: disease for disease in diseases}
        rejected: set[str] = set()
        asked: set[str] = set()
        answered: set[str] = set()
        if state is not None:
            rejected = expand_normalized_symptoms(state.rejected_symptoms)
            asked = set(state.asked_symptoms)
            answered = set(state.answered_symptoms)

        top_diseases = self._candidate_diseases_for_questions(
            sorted_matches,
            disease_by_id,
        )
        top_diseases = self._order_diseases_for_questions(top_diseases, sorted_matches)
        if not top_diseases:
            return []

        reported = self._reported_symptoms(sorted_matches, state)
        questions = self._collect_template_questions(
            top_diseases,
            reported=reported,
            rejected=rejected,
            asked=asked,
            answered=answered,
            candidate_matches=sorted_matches,
        )

        if not questions:
            if self._symptom_profiles_identical(top_diseases):
                return []
            questions = self._collect_generic_fallback_questions(
                top_diseases,
                reported=reported,
                rejected=rejected,
                asked=asked,
                answered=answered,
            )

        if not questions:
            questions = self._collect_fever_evidence_questions(
                reported=reported,
                rejected=rejected,
                asked=asked,
                answered=answered,
                disease_candidates=[
                    match.disease_name for match in sorted_matches[:3]
                ],
            )

        return self._filter_questions(questions, state)[: self._max_questions]

    def _collect_fever_evidence_questions(
        self,
        *,
        reported: set[str],
        rejected: set[str],
        asked: set[str],
        answered: set[str],
        disease_candidates: list[str],
    ) -> list[FollowUpQuestion]:
        """Practical follow-ups when fever is known but disease templates did not apply."""
        fever_keys = expand_normalized_symptoms(["fever", "high fever"])
        if not (fever_keys & reported):
            return []

        candidates = disease_candidates or ["Livestock assessment"]
        questions: list[FollowUpQuestion] = []
        for symptom_key, question_text in self._repository.get_generic_followup_questions():
            if len(questions) >= self._max_questions:
                break
            if not symptom_key:
                continue
            label = self._symptom_label_for_key(symptom_key)
            key_group = expand_normalized_symptoms([label])
            if (
                key_group & reported
                or key_group & rejected
                or key_group & asked
                or key_group & answered
            ):
                continue
            questions.append(
                FollowUpQuestion(
                    question=question_text,
                    symptom=label,
                    disease_candidates=candidates,
                )
            )
        return questions

    def _candidate_diseases_for_questions(
        self,
        sorted_matches: list[DiseaseMatch],
        disease_by_id: dict[str, Disease],
    ) -> list[Disease]:
        """Return up to three candidate diseases to source follow-up questions from."""
        if self.is_ambiguous(sorted_matches):
            ambiguous_matches = self._ambiguous_match_group(sorted_matches)
            diseases = [
                disease_by_id[match.disease_id]
                for match in ambiguous_matches
                if match.disease_id in disease_by_id
            ]
            return diseases

        top_match = sorted_matches[0]
        top_disease = disease_by_id.get(top_match.disease_id)
        return [top_disease] if top_disease is not None else []

    def _order_diseases_for_questions(
        self,
        diseases: list[Disease],
        sorted_matches: list[DiseaseMatch],
    ) -> list[Disease]:
        """Prefer higher-confidence diseases; stable tie-break by disease_id."""
        rank = {match.disease_id: index for index, match in enumerate(sorted_matches)}
        return sorted(
            diseases,
            key=lambda disease: (rank.get(disease.disease_id, 999), disease.disease_id),
        )

    def _collect_template_questions(
        self,
        diseases: list[Disease],
        *,
        reported: set[str],
        rejected: set[str],
        asked: set[str],
        answered: set[str],
        candidate_matches: list[DiseaseMatch] | None = None,
    ) -> list[FollowUpQuestion]:
        """Build farmer-friendly questions ranked by information gain."""
        candidate_pool: list[tuple[float, FollowUpQuestion]] = []

        for disease in diseases:
            disease_symptom_keys = expand_normalized_symptoms(disease.symptoms)

            for symptom_key, question_text in self._repository.get_followup_questions(
                disease.disease_id,
            ):
                if not symptom_key:
                    continue
                label = self._symptom_label_for_key(symptom_key)
                key_group = expand_normalized_symptoms([label])
                if not (key_group & disease_symptom_keys):
                    continue
                normalized = normalize_symptom(label)
                if (
                    normalized in reported
                    or normalized in rejected
                    or normalized in asked
                    or normalized in answered
                ):
                    continue
                if (
                    key_group & reported
                    or key_group & rejected
                    or key_group & asked
                    or key_group & answered
                ):
                    continue

                symptom_id = resolve_symptom_id(self._repository, symptom_key) or symptom_key
                gain = 0.0
                if candidate_matches:
                    gain = information_gain_for_symptom(
                        symptom_id=symptom_id,
                        candidate_matches=candidate_matches,
                        repository=self._repository,
                    )
                candidate_pool.append(
                    (
                        gain,
                        FollowUpQuestion(
                            question=question_text,
                            symptom=label,
                            disease_candidates=[disease.disease_name],
                        ),
                    )
                )

        candidate_pool.sort(key=lambda item: (-item[0], item[1].symptom or ""))
        seen: set[str] = set()
        questions: list[FollowUpQuestion] = []
        for _, question in candidate_pool:
            if len(questions) >= self._max_questions:
                break
            key = normalize_symptom(question.symptom or "")
            if key in seen:
                continue
            seen.add(key)
            questions.append(question)

        return questions

    @staticmethod
    def _symptom_profiles_identical(diseases: list[Disease]) -> bool:
        if len(diseases) < 2:
            return False
        baseline = {
            normalize_symptom(symptom) for symptom in diseases[0].symptoms
        }
        for disease in diseases[1:]:
            profile = {normalize_symptom(symptom) for symptom in disease.symptoms}
            if profile != baseline:
                return False
        return True

    def _collect_generic_fallback_questions(
        self,
        diseases: list[Disease],
        *,
        reported: set[str],
        rejected: set[str],
        asked: set[str],
        answered: set[str],
    ) -> list[FollowUpQuestion]:
        """Last resort when no curated template exists for a disease."""
        eligible = [
            disease
            for disease in diseases
            if not self._repository.get_followup_questions(disease.disease_id)
        ]
        if not eligible:
            return []

        max_symptoms = max(
            len(
                [
                    symptom
                    for symptom in disease.symptoms
                    if not (expand_normalized_symptoms([symptom]) & reported)
                ]
            )
            for disease in eligible
        )
        questions: list[FollowUpQuestion] = []
        seen: set[str] = set()

        for symptom_index in range(max_symptoms):
            if len(questions) >= self._max_questions:
                break
            for disease in eligible:
                symptoms = [
                    symptom
                    for symptom in disease.symptoms
                    if not (expand_normalized_symptoms([symptom]) & reported)
                ]
                if symptom_index >= len(symptoms):
                    continue
                symptom = symptoms[symptom_index]
                symptom_group = expand_normalized_symptoms([symptom])
                if (
                    symptom_group & reported
                    or symptom_group & rejected
                    or symptom_group & asked
                    or symptom_group & answered
                ):
                    continue
                normalized = normalize_symptom(symptom)
                if normalized in seen:
                    continue
                question_text = self._build_question(symptom, [disease.disease_id])
                questions.append(
                    FollowUpQuestion(
                        question=question_text,
                        symptom=symptom,
                        disease_candidates=[disease.disease_name],
                    )
                )
                seen.add(normalized)
                if len(questions) >= self._max_questions:
                    break

        return questions

    def _ambiguous_questions(
        self,
        sorted_matches: list[DiseaseMatch],
        disease_by_id: dict[str, Disease],
        diseases: list[Disease],
        *,
        state: object | None = None,
        rejected: set[str] | None = None,
        asked: set[str] | None = None,
    ) -> list[FollowUpQuestion]:
        ambiguous_matches = self._ambiguous_match_group(sorted_matches)
        candidate_diseases = [
            disease_by_id[match.disease_id]
            for match in ambiguous_matches
            if match.disease_id in disease_by_id
        ]
        if len(candidate_diseases) < 2:
            return []

        reported_symptoms = self._reported_symptoms(ambiguous_matches, state)
        distinguishing = self._find_distinguishing_symptoms(candidate_diseases)
        rejected = rejected or set()
        asked = asked or set()
        unanswered = [
            entry
            for entry in distinguishing
            if entry["normalized"] not in reported_symptoms
            and entry["normalized"] not in rejected
            and entry["normalized"] not in asked
        ]
        if not unanswered:
            return []

        selected = unanswered[: self._max_questions]
        return [
            FollowUpQuestion(
                question=self._build_question(
                    entry["label"],
                    disease_ids=[
                        disease.disease_id
                        for disease in candidate_diseases
                        if disease.disease_name in entry["disease_names"]
                    ],
                ),
                symptom=entry["label"],
                disease_candidates=entry["disease_names"],
            )
            for entry in selected
        ]

    @staticmethod
    def _filter_questions(
        questions: list[FollowUpQuestion],
        state: object | None,
    ) -> list[FollowUpQuestion]:
        from features.chat.services.conversation_state import ConversationState

        if not isinstance(state, ConversationState):
            return questions

        filtered: list[FollowUpQuestion] = []
        for question in questions:
            if state.should_skip_question(question.question, question.symptom):
                continue
            filtered.append(question)
        return filtered

    def _disease_specific_followups(
        self,
        disease: Disease,
        reported_symptoms: set[str],
        *,
        rejected: set[str] | None = None,
        asked: set[str] | None = None,
    ) -> list[FollowUpQuestion]:
        rejected = rejected or set()
        asked = asked or set()
        disease_symptom_keys = {
            normalize_symptom(symptom) for symptom in disease.symptoms
        }
        templates = self._repository.get_followup_questions(disease.disease_id)
        questions: list[FollowUpQuestion] = []

        for symptom_key, question_text in templates:
            if not symptom_key:
                continue
            label = self._symptom_label_for_key(symptom_key)
            normalized = normalize_symptom(label)
            if normalized not in disease_symptom_keys and not (
                expand_normalized_symptoms([label]) & disease_symptom_keys
            ):
                continue
            if normalized in reported_symptoms or normalized in rejected or normalized in asked:
                continue
            questions.append(
                FollowUpQuestion(
                    question=question_text,
                    symptom=symptom_key,
                    disease_candidates=[disease.disease_name],
                )
            )

        if questions:
            return questions

        for symptom in disease.critical_symptoms or disease.symptoms[:2]:
            normalized = normalize_symptom(symptom)
            if normalized in reported_symptoms or normalized in rejected or normalized in asked:
                continue
            questions.append(
                FollowUpQuestion(
                    question=self._build_question(symptom, [disease.disease_id]),
                    symptom=symptom,
                    disease_candidates=[disease.disease_name],
                )
            )
        return questions

    def is_ambiguous(self, matches: list[DiseaseMatch]) -> bool:
        """True when the top two scored diseases are within the ambiguity threshold."""
        sorted_matches = self._sort_matches(matches)
        if len(sorted_matches) < 2:
            return False
        return (
            sorted_matches[0].confidence_score - sorted_matches[1].confidence_score
            < self._ambiguity_threshold
        )

    @staticmethod
    def _sort_matches(matches: list[DiseaseMatch]) -> list[DiseaseMatch]:
        return sorted(
            matches,
            key=lambda match: (-match.confidence_score, match.disease_name),
        )

    def _ambiguous_match_group(self, sorted_matches: list[DiseaseMatch]) -> list[DiseaseMatch]:
        if not sorted_matches:
            return []
        top_score = sorted_matches[0].confidence_score
        return [
            match
            for match in sorted_matches
            if top_score - match.confidence_score < self._ambiguity_threshold
        ]

    @staticmethod
    def _reported_symptoms(
        matches: list[DiseaseMatch],
        state: object | None = None,
    ) -> set[str]:
        from features.chat.services.conversation_state import ConversationState
        from features.confidence_scoring.utils.symptom_normalizer import (
            expand_normalized_symptoms,
        )

        reported_list: list[str] = []
        for match in matches:
            reported_list.extend(match.matched_symptoms)
        if isinstance(state, ConversationState):
            reported_list.extend(state.active_symptoms())
        return expand_normalized_symptoms(reported_list)

    @staticmethod
    def _find_distinguishing_symptoms(diseases: list[Disease]) -> list[dict[str, object]]:
        """
        Return distinguishing symptoms sorted by discriminating power.

        Each entry contains: normalized, label, disease_names, disease_count.
        """
        symptom_to_diseases: dict[str, dict[str, str]] = defaultdict(dict)

        for disease in diseases:
            seen_for_disease: set[str] = set()
            for symptom in disease.symptoms:
                normalized = normalize_symptom(symptom)
                if not normalized or normalized in seen_for_disease:
                    continue
                seen_for_disease.add(normalized)
                symptom_to_diseases[normalized][disease.disease_id] = disease.disease_name

        total_diseases = len(diseases)
        distinguishing: list[dict[str, object]] = []

        for normalized in sorted(symptom_to_diseases):
            disease_names_map = symptom_to_diseases[normalized]
            disease_count = len(disease_names_map)
            if disease_count == 0 or disease_count == total_diseases:
                continue

            label = DiagnosticQuestionService._canonical_symptom_label(diseases, normalized)
            distinguishing.append(
                {
                    "normalized": normalized,
                    "label": label,
                    "disease_names": sorted(disease_names_map.values()),
                    "disease_count": disease_count,
                }
            )

        distinguishing.sort(
            key=lambda entry: (
                entry["disease_count"],
                entry["normalized"],
            )
        )
        return distinguishing

    @staticmethod
    def _canonical_symptom_label(diseases: list[Disease], normalized: str) -> str:
        for disease in sorted(diseases, key=lambda item: item.disease_id):
            for symptom in disease.symptoms:
                if normalize_symptom(symptom) == normalized:
                    return symptom.strip()
        return normalized

    def _build_question(self, symptom_label: str, disease_ids: list[str] | None = None) -> str:
        label_group = expand_normalized_symptoms([symptom_label])
        if disease_ids:
            for disease_id in disease_ids:
                for symptom_key, question in self._repository.get_followup_questions(disease_id):
                    if not symptom_key:
                        continue
                    if expand_normalized_symptoms(
                        [self._symptom_label_for_key(symptom_key)]
                    ) & label_group:
                        return question
        return f"Does the animal have {symptom_label}?"

    def _symptom_label_for_key(self, symptom_key: str) -> str:
        record = self._repository.get_symptom(symptom_key)
        if record is not None:
            return record.canonical_name
        return symptom_key.replace("_", " ")
