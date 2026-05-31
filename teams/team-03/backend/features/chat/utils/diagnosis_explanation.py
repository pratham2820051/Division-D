"""Human-readable diagnosis explanations and disease differentiation."""

from __future__ import annotations

from features.chat.schemas.messages import DiseaseCandidate
from features.confidence_scoring.utils.confidence_explanation import build_confidence_reason
from features.rag.schemas.disease import DiseaseMatch

LOW_RELIABILITY_THRESHOLD = 0.40
EARLY_FINALIZATION_THRESHOLD = 0.85
HIGH_VALUE_SYMPTOM_WEIGHT = 0.85

LOW_RELIABILITY_MESSAGE = (
    "I need more information to make a reliable assessment. "
    "Please describe what you see and answer any follow-up questions."
)


def build_differentiation_summary(matches: list[DiseaseMatch], *, limit: int = 3) -> str:
    """Explain why multiple diseases remain in consideration."""
    if len(matches) < 2:
        return ""

    lines: list[str] = ["Possible diseases:"]
    for index, match in enumerate(matches[:limit], start=1):
        pct = round(match.confidence_score * 100)
        lines.append(f"{index}. {match.disease_name} ({pct}%)")

    lines.append("")
    lines.append("Reason:")
    top = matches[0]
    if top.matched_symptoms:
        lines.append(f"{top.disease_name}:")
        lines.append(f"  + {', '.join(top.matched_symptoms[:4])}")
        if top.missing_symptoms:
            for missing in top.missing_symptoms[:3]:
                lines.append(f"  - no {missing}")

    if len(matches) > 1:
        runner = matches[1]
        lines.append(f"{runner.disease_name}:")
        if runner.matched_symptoms:
            lines.append(f"  + {', '.join(runner.matched_symptoms[:3])}")
        else:
            lines.append("  + limited matching signs so far")
        distinguishing = [
            symptom
            for symptom in runner.missing_symptoms[:2]
            if symptom not in top.matched_symptoms
        ]
        for missing in distinguishing:
            lines.append(f"  - no {missing}")

    return "\n".join(lines)


def enrich_disease_candidate(match: DiseaseMatch) -> DiseaseCandidate:
    reason = getattr(match, "confidence_reason", None) or build_confidence_reason(match)
    contradicted = list(getattr(match, "contradicted_symptoms", []) or [])
    return DiseaseCandidate(
        name=match.disease_name,
        confidence=round(match.confidence_score * 100),
        matched_symptoms=list(match.matched_symptoms),
        missing_symptoms=list(match.missing_symptoms),
        contradicted_symptoms=contradicted,
        confidence_reason=reason,
    )


def is_reliable_confidence(confidence: float) -> bool:
    return confidence >= LOW_RELIABILITY_THRESHOLD


def should_finalize_early(
    confidence: float,
    *,
    has_high_value_pending: bool,
) -> bool:
    return confidence >= EARLY_FINALIZATION_THRESHOLD and not has_high_value_pending
