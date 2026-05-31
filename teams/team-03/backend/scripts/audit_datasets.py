"""Audit diagnosis CSV datasets for coverage and alias quality."""

from __future__ import annotations

import json
from pathlib import Path

from features.rag.repositories.disease_repository import DiseaseRepository

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATASETS_DIR = BACKEND_ROOT / "datasets"


def audit_datasets(datasets_dir: Path = DATASETS_DIR) -> dict[str, object]:
    repository = DiseaseRepository(datasets_dir=datasets_dir)
    repository.load()

    diseases = repository.get_disease_records()
    symptoms = repository.get_symptoms()
    findings: dict[str, object] = {
        "disease_count": len(diseases),
        "symptom_count": len(symptoms),
        "missing_followup_questions": [],
        "weak_mappings": [],
        "symptoms_without_aliases": [],
        "duplicate_canonical_names": [],
        "diseases_low_coverage": [],
    }

    canonical_seen: dict[str, str] = {}
    for symptom in symptoms:
        if len(symptom.aliases) <= 1:
            findings["symptoms_without_aliases"].append(symptom.symptom_id)
        key = symptom.canonical_name.lower()
        if key in canonical_seen:
            findings["duplicate_canonical_names"].append(
                (canonical_seen[key], symptom.symptom_id, symptom.canonical_name)
            )
        canonical_seen[key] = symptom.symptom_id

    for disease in diseases:
        weights = repository.get_symptom_weights(disease.disease_id)
        if not repository.get_followup_questions(disease.disease_id):
            findings["missing_followup_questions"].append(disease.disease_id)
        if len(weights) < 4:
            findings["diseases_low_coverage"].append(disease.disease_id)
        for symptom_id, weight in weights.items():
            if weight < 0.5:
                findings["weak_mappings"].append(
                    {"disease_id": disease.disease_id, "symptom_id": symptom_id, "weight": weight}
                )

    return findings


def main() -> None:
    report = audit_datasets()
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
