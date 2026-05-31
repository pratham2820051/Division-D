# Diagnosis datasets

Runtime diagnosis is driven by CSV files in this directory. Legacy JSON examples remain in `examples/` for reference and isolated tests.

## Dataset files

| File | Purpose |
|------|---------|
| `animals.csv` | Species catalog, aliases, chat support flag |
| `diseases.csv` | Disease metadata and mention aliases |
| `symptoms.csv` | Canonical symptoms, multilingual aliases, triage tier |
| `disease_symptom_mapping.csv` | Weighted symptom–disease links for scoring |
| `followup_questions.csv` | Diagnostic yes/no questions (`_generic` = fever fallbacks) |
| `first_aid.csv` | Ordered first-aid steps per disease |
| `sms_templates.csv` | SMS alert templates with placeholders |

## Loading

`DiseaseRepository` (`features/rag/repositories/disease_repository.py`) loads these files at startup. `DiseaseDocumentService.load_all()` builds legacy `Disease` models from the repository by default.

Tests that pass a custom `documents_dir=tmp_path` continue to load JSON fixtures only.

## Migration

```bash
cd backend
python datasets/ingest.py
```

Exports legacy JSON in `examples/` into CSV rows (partial — curated files in the repo are the source of truth).

## Documentation

See [docs/dataset_driven_diagnosis_architecture.md](../../docs/dataset_driven_diagnosis_architecture.md).
