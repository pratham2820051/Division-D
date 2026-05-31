"""Dataset-driven disease knowledge repository (CSV/JSON)."""

from __future__ import annotations

from pathlib import Path

from features.rag.repositories.loaders import DatasetLoadError, load_csv_rows, split_multi_value
from features.rag.repositories.models import (
    AnimalRecord,
    DiseaseRecord,
    FollowUpQuestionRecord,
    SymptomRecord,
)
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATASETS_DIR = _BACKEND_ROOT / "datasets"

_SEVERITY_TO_LEVEL: dict[str, DiseaseSeverityLevel] = {
    "low": DiseaseSeverityLevel.LOW,
    "medium": DiseaseSeverityLevel.MEDIUM,
    "high": DiseaseSeverityLevel.HIGH,
    "critical": DiseaseSeverityLevel.CRITICAL,
    "urgent": DiseaseSeverityLevel.HIGH,
}

_MENTION_BOOST_DISEASE_IDS = frozenset({"anthrax", "mastitis", "lumpy-skin-disease"})

_default_repository: "DiseaseRepository | None" = None


def _normalize_text(value: str) -> str:
    return value.strip().lower()


class DiseaseRepository:
    """Load and query diagnosis datasets without code changes."""

    def __init__(self, datasets_dir: Path | str | None = None) -> None:
        self._datasets_dir = Path(datasets_dir) if datasets_dir else DEFAULT_DATASETS_DIR
        self._loaded = False
        self._animals: dict[str, AnimalRecord] = {}
        self._symptoms: dict[str, SymptomRecord] = {}
        self._diseases: dict[str, DiseaseRecord] = {}
        self._symptom_weights: dict[str, dict[str, float]] = {}
        self._followup_questions: dict[str, list[FollowUpQuestionRecord]] = {}
        self._first_aid: dict[str, list[str]] = {}
        self._sms_templates: dict[str, str] = {}
        self._alias_to_animal_id: dict[str, str] = {}
        self._alias_to_symptom_id: dict[str, str] = {}
        self._equivalence_groups: tuple[frozenset[str], ...] = ()
        self._symptom_families: dict[str, str] = {}
        self._critical_triage_order: list[str] = []
        self._urgent_triage_order: list[str] = []

    @property
    def datasets_dir(self) -> Path:
        return self._datasets_dir

    def is_loaded(self) -> bool:
        return self._loaded

    def ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()

    def load(self) -> None:
        """Load all CSV datasets from the configured directory."""
        self._animals.clear()
        self._symptoms.clear()
        self._diseases.clear()
        self._symptom_weights.clear()
        self._followup_questions.clear()
        self._first_aid.clear()
        self._sms_templates.clear()
        self._alias_to_animal_id.clear()
        self._alias_to_symptom_id.clear()
        self._critical_triage_order.clear()
        self._urgent_triage_order.clear()

        self._load_animals()
        self._load_symptoms()
        self._load_diseases()
        self._load_symptom_mappings()
        self._load_followup_questions()
        self._load_first_aid()
        self._load_sms_templates()
        self._build_equivalence_groups()
        self._loaded = True

    def reload(self) -> None:
        self._loaded = False
        self.load()

    # --- Animal queries ---

    def get_animals(self) -> list[AnimalRecord]:
        self.ensure_loaded()
        return sorted(self._animals.values(), key=lambda item: item.animal_id)

    def get_animal(self, animal_id: str) -> AnimalRecord | None:
        self.ensure_loaded()
        return self._animals.get(animal_id.strip().lower())

    def resolve_animal_id(self, text: str) -> str | None:
        """Map farmer text to a canonical animal_id using dataset aliases."""
        self.ensure_loaded()
        normalized = _normalize_text(text)
        if not normalized:
            return None
        if normalized in self._animals:
            return normalized
        return self._alias_to_animal_id.get(normalized)

    def is_animal_supported_for_diagnosis(self, animal_id: str) -> bool:
        record = self.get_animal(animal_id)
        return record.supported if record is not None else False

    # --- Symptom queries ---

    def get_symptoms(self) -> list[SymptomRecord]:
        self.ensure_loaded()
        return sorted(self._symptoms.values(), key=lambda item: item.symptom_id)

    def get_symptom(self, symptom_id: str) -> SymptomRecord | None:
        if not self._loaded:
            return self._symptoms.get(symptom_id.strip().lower())
        self.ensure_loaded()
        return self._symptoms.get(symptom_id.strip().lower())

    def resolve_symptom_id(self, text: str) -> str | None:
        """Map farmer text to a canonical symptom_id using dataset aliases."""
        self.ensure_loaded()
        normalized = _normalize_text(text)
        if not normalized:
            return None
        if normalized in self._symptoms:
            return normalized
        return self._alias_to_symptom_id.get(normalized)

    def get_symptom_family(self, symptom_id: str) -> str | None:
        self.ensure_loaded()
        return self._symptom_families.get(symptom_id.strip().lower())

    def symptom_ids_in_family(self, family: str) -> frozenset[str]:
        self.ensure_loaded()
        return frozenset(
            symptom_id
            for symptom_id, symptom_family in self._symptom_families.items()
            if symptom_family == family
        )

    def user_symptom_ids(self, user_symptoms: list[str]) -> set[str]:
        """Resolve reported symptoms to canonical symptom IDs."""
        self.ensure_loaded()
        resolved: set[str] = set()
        for symptom in user_symptoms:
            symptom_id = self.resolve_symptom_id(symptom)
            if symptom_id:
                resolved.add(symptom_id)
        return resolved

    def symptom_matches_report(
        self,
        user_symptoms: list[str],
        symptom_id: str,
        *,
        user_expanded: set[str] | None = None,
    ) -> bool:
        """True when farmer-reported symptoms align with a mapped symptom ID."""
        from features.confidence_scoring.utils.symptom_normalizer import (
            expand_normalized_symptoms,
        )

        expanded = user_expanded if user_expanded is not None else expand_normalized_symptoms(
            user_symptoms
        )
        for group in self.get_equivalence_groups():
            if expanded & group:
                expanded.update(group)
        forms = self.expand_symptom_forms(symptom_id)
        if expanded & forms:
            return True

        user_ids = self.user_symptom_ids(user_symptoms)
        if symptom_id in user_ids:
            return True

        family = self.get_symptom_family(symptom_id)
        if family and user_ids & self.symptom_ids_in_family(family):
            return True
        return False

    def expand_symptom_forms(self, symptom_id: str) -> set[str]:
        """Return normalized alias forms for a symptom_id."""
        record = self.get_symptom(symptom_id)
        if record is None:
            return set()
        forms = {_normalize_text(record.canonical_name), symptom_id.lower()}
        forms.update(_normalize_text(alias) for alias in record.aliases if alias.strip())
        return {form for form in forms if form}

    def get_equivalence_groups(self) -> tuple[frozenset[str], ...]:
        self.ensure_loaded()
        return self._equivalence_groups

    def get_triage_symptoms(self, tier: str) -> tuple[str, ...]:
        """Return canonical symptom names for a triage tier (critical/urgent)."""
        self.ensure_loaded()
        if tier.lower() == "critical":
            return tuple(self._critical_triage_order)
        if tier.lower() == "urgent":
            return tuple(self._urgent_triage_order)
        return ()

    # --- Disease queries ---

    def get_disease_records(self, animal_type: str | None = None) -> list[DiseaseRecord]:
        self.ensure_loaded()
        records = list(self._diseases.values())
        if animal_type:
            normalized = animal_type.strip().lower()
            records = [record for record in records if normalized in record.animal_types]
        return sorted(records, key=lambda item: item.disease_id)

    def get_disease_record(self, disease_id: str) -> DiseaseRecord | None:
        self.ensure_loaded()
        return self._diseases.get(disease_id.strip().lower())

    def get_symptom_weights(self, disease_id: str) -> dict[str, float]:
        self.ensure_loaded()
        return dict(self._symptom_weights.get(disease_id.strip().lower(), {}))

    def get_followup_questions(self, disease_id: str) -> list[tuple[str | None, str]]:
        """Return (symptom_checked, question) pairs for a disease or _generic."""
        self.ensure_loaded()
        records = self._followup_questions.get(disease_id.strip().lower(), [])
        return [(record.symptom_checked, record.question) for record in records]

    def get_generic_followup_questions(self) -> list[tuple[str | None, str]]:
        return self.get_followup_questions("_generic")

    def get_first_aid_steps(self, disease_id: str) -> list[str]:
        self.ensure_loaded()
        return list(self._first_aid.get(disease_id.strip().lower(), []))

    def get_sms_template(self, disease_id: str) -> str | None:
        self.ensure_loaded()
        return self._sms_templates.get(disease_id.strip().lower())

    def get_disease_aliases(self, disease_id: str) -> tuple[str, ...]:
        record = self.get_disease_record(disease_id)
        if record is None:
            return ()
        aliases = list(record.aliases)
        aliases.append(record.disease_name)
        aliases.append(record.disease_id.replace("-", " "))
        return tuple(dict.fromkeys(alias.lower() for alias in aliases if alias.strip()))

    def mention_boost_for_disease(self, disease_id: str) -> float:
        return 0.30 if disease_id in _MENTION_BOOST_DISEASE_IDS else 0.20

    # --- Backward-compatible Disease models ---

    def to_disease_models(self, animal_type: str | None = None) -> list[Disease]:
        """Build validated ``Disease`` objects for existing services and APIs."""
        self.ensure_loaded()
        models: list[Disease] = []
        for record in self.get_disease_records(animal_type):
            models.append(self.build_disease_model(record))
        return models

    def build_disease_model(self, record: DiseaseRecord) -> Disease:
        weights = self.get_symptom_weights(record.disease_id)
        symptoms: list[str] = []
        critical_symptoms: list[str] = []

        for symptom_id in sorted(weights, key=lambda sid: (-weights[sid], sid)):
            symptom = self.get_symptom(symptom_id)
            if symptom is None:
                continue
            symptoms.append(symptom.canonical_name)
            if weights[symptom_id] >= 1.0:
                critical_symptoms.append(symptom.canonical_name)

        primary_animal = record.animal_types[0] if record.animal_types else AnimalType.CATTLE.value
        try:
            animal_enum = AnimalType(primary_animal)
        except ValueError:
            animal_enum = AnimalType.CATTLE

        severity = _SEVERITY_TO_LEVEL.get(record.severity.lower(), DiseaseSeverityLevel.MEDIUM)

        return Disease(
            disease_id=record.disease_id,
            disease_name=record.disease_name,
            animal_type=animal_enum,
            description=record.description,
            symptoms=symptoms,
            critical_symptoms=critical_symptoms,
            first_aid=self.get_first_aid_steps(record.disease_id),
            severity_level=severity,
        )

    # --- Internal loaders ---

    def _load_animals(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "animals.csv")
        for row in rows:
            animal_id = row["animal_id"].lower()
            aliases = split_multi_value(row.get("aliases", ""), separator=";")
            supported = row.get("supported", "true").strip().lower() in {"true", "1", "yes"}
            record = AnimalRecord(
                animal_id=animal_id,
                animal_name=row["animal_name"],
                aliases=aliases,
                supported=supported,
            )
            self._animals[animal_id] = record
            self._register_animal_alias(animal_id, animal_id)
            self._register_animal_alias(animal_id, record.animal_name)
            for alias in aliases:
                self._register_animal_alias(animal_id, alias)

    def _load_symptoms(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "symptoms.csv")
        for row in rows:
            symptom_id = row["symptom_id"].lower()
            aliases = split_multi_value(row.get("aliases", ""), separator=";")
            record = SymptomRecord(
                symptom_id=symptom_id,
                canonical_name=row["canonical_name"],
                aliases=aliases,
                triage_tier=row.get("triage_tier") or None,
                symptom_family=row.get("symptom_family") or None,
            )
            self._symptoms[symptom_id] = record
            if record.symptom_family:
                self._symptom_families[symptom_id] = record.symptom_family
            if (record.triage_tier or "").lower() == "critical":
                self._critical_triage_order.append(record.canonical_name)
            elif (record.triage_tier or "").lower() == "urgent":
                self._urgent_triage_order.append(record.canonical_name)
            self._register_symptom_alias(symptom_id, symptom_id)
            self._register_symptom_alias(symptom_id, record.canonical_name)
            for alias in aliases:
                self._register_symptom_alias(symptom_id, alias)

    def _load_diseases(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "diseases.csv")
        for row in rows:
            disease_id = row["disease_id"].lower()
            aliases = split_multi_value(row.get("aliases", ""), separator=";")
            animal_types = split_multi_value(row.get("animal_types", ""), separator="|")
            vet_required = row.get("vet_required", "true").strip().lower() in {"true", "1", "yes"}
            record = DiseaseRecord(
                disease_id=disease_id,
                disease_name=row["disease_name"],
                animal_types=animal_types,
                severity=row["severity"],
                description=row["description"],
                vet_required=vet_required,
                aliases=aliases,
            )
            self._diseases[disease_id] = record

    def _load_symptom_mappings(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "disease_symptom_mapping.csv")
        for row in rows:
            disease_id = row["disease_id"].lower()
            symptom_id = row["symptom_id"].lower()
            weight = float(row["weight"])
            self._symptom_weights.setdefault(disease_id, {})[symptom_id] = weight

    def _load_followup_questions(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "followup_questions.csv")
        for row in rows:
            disease_id = row["disease_id"].lower()
            symptom_checked = row.get("symptom_checked") or None
            record = FollowUpQuestionRecord(
                disease_id=disease_id,
                question=row["question"],
                symptom_checked=symptom_checked,
            )
            self._followup_questions.setdefault(disease_id, []).append(record)

    def _load_first_aid(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "first_aid.csv")
        ordered: dict[str, list[tuple[int, str]]] = {}
        for row in rows:
            disease_id = row["disease_id"].lower()
            step_order = int(row["step_order"])
            ordered.setdefault(disease_id, []).append((step_order, row["instruction"]))
        for disease_id, steps in ordered.items():
            self._first_aid[disease_id] = [
                instruction for _, instruction in sorted(steps, key=lambda item: item[0])
            ]

    def _load_sms_templates(self) -> None:
        rows = load_csv_rows(self._datasets_dir / "sms_templates.csv")
        for row in rows:
            self._sms_templates[row["disease_id"].lower()] = row["template"]

    def _register_animal_alias(self, animal_id: str, alias: str) -> None:
        normalized = _normalize_text(alias)
        if normalized:
            self._alias_to_animal_id[normalized] = animal_id

    def _register_symptom_alias(self, symptom_id: str, alias: str) -> None:
        normalized = _normalize_text(alias)
        if normalized:
            self._alias_to_symptom_id[normalized] = symptom_id

    def _build_equivalence_groups(self) -> None:
        groups: list[frozenset[str]] = []
        family_forms: dict[str, set[str]] = {}

        for record in self._symptoms.values():
            forms = {_normalize_text(record.canonical_name), record.symptom_id.lower()}
            forms.update(_normalize_text(alias) for alias in record.aliases if alias.strip())
            forms = {form for form in forms if form}
            if len(forms) > 1:
                groups.append(frozenset(forms))
            if record.symptom_family:
                family_forms.setdefault(record.symptom_family, set()).update(forms)

        for forms in family_forms.values():
            if len(forms) > 1:
                groups.append(frozenset(forms))

        self._equivalence_groups = tuple(groups)


def get_default_repository() -> DiseaseRepository:
    """Return the process-wide default repository (lazy-loaded)."""
    global _default_repository
    if _default_repository is None:
        _default_repository = DiseaseRepository()
        try:
            _default_repository.load()
        except DatasetLoadError:
            pass
    return _default_repository


def reset_default_repository() -> None:
    """Clear the cached default repository (for tests)."""
    global _default_repository
    _default_repository = None
