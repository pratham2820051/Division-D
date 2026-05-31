"""One-shot script: raw datasets → processed CSV rows or JSON documents."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
EXAMPLES_DIR = BACKEND_ROOT / "datasets" / "examples"
OUTPUT_DIR = BACKEND_ROOT / "datasets"


def _slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
    )


def export_json_examples_to_csv(output_dir: Path = OUTPUT_DIR) -> None:
    """Migrate legacy JSON disease documents into tabular datasets."""
    diseases_path = output_dir / "diseases.csv"
    mappings_path = output_dir / "disease_symptom_mapping.csv"
    first_aid_path = output_dir / "first_aid.csv"
    followups_path = output_dir / "followup_questions.csv"

    disease_rows: list[dict[str, str]] = []
    mapping_rows: list[dict[str, str]] = []
    first_aid_rows: list[dict[str, str]] = []
    followup_rows: list[dict[str, str]] = []

    for json_path in sorted(EXAMPLES_DIR.glob("*.json")):
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        disease_id = payload["disease_id"]
        disease_rows.append(
            {
                "disease_id": disease_id,
                "disease_name": payload["disease_name"],
                "animal_types": payload.get("animal_type", "cattle"),
                "severity": payload.get("severity_level", "medium"),
                "description": payload["description"],
                "vet_required": "true",
                "aliases": disease_id.replace("-", " "),
            }
        )

        critical = set(payload.get("critical_symptoms", []))
        for symptom in payload.get("symptoms", []):
            symptom_id = _slug(symptom)
            weight = "1.0" if symptom in critical else "0.7"
            mapping_rows.append(
                {
                    "disease_id": disease_id,
                    "symptom_id": symptom_id,
                    "weight": weight,
                }
            )

        for index, step in enumerate(payload.get("first_aid", []), start=1):
            first_aid_rows.append(
                {
                    "disease_id": disease_id,
                    "step_order": str(index),
                    "instruction": step,
                }
            )

    _write_csv(
        diseases_path,
        [
            "disease_id",
            "disease_name",
            "animal_types",
            "severity",
            "description",
            "vet_required",
            "aliases",
        ],
        disease_rows,
    )
    _write_csv(
        mappings_path,
        ["disease_id", "symptom_id", "weight"],
        mapping_rows,
    )
    _write_csv(
        first_aid_path,
        ["disease_id", "step_order", "instruction"],
        first_aid_rows,
    )
    _write_csv(
        followups_path,
        ["disease_id", "question", "symptom_checked"],
        followup_rows,
    )


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate JSON disease docs to CSV datasets.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=OUTPUT_DIR,
        help="Directory for generated CSV files",
    )
    args = parser.parse_args()
    export_json_examples_to_csv(args.output_dir)
    print(f"Exported datasets to {args.output_dir}")


if __name__ == "__main__":
    main()
