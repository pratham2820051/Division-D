"""Load tabular dataset files (CSV today; JSON later)."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


class DatasetLoadError(Exception):
    """Raised when a dataset file cannot be read or parsed."""


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    """Read a CSV file into a list of row dictionaries."""
    if not path.is_file():
        raise DatasetLoadError(f"Dataset file not found: {path}")

    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise DatasetLoadError(f"Dataset file has no header row: {path}")
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def load_json_records(path: Path) -> list[dict[str, Any]]:
    """Read a JSON array or JSON-lines file into record dictionaries."""
    if not path.is_file():
        raise DatasetLoadError(f"Dataset file not found: {path}")

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []

    if text.startswith("["):
        payload = json.loads(text)
        if not isinstance(payload, list):
            raise DatasetLoadError(f"Expected JSON array in {path}")
        return [record for record in payload if isinstance(record, dict)]

    records: list[dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        record = json.loads(line)
        if isinstance(record, dict):
            records.append(record)
    return records


def split_multi_value(value: str, *, separator: str = "|") -> tuple[str, ...]:
    """Split pipe- or semicolon-delimited dataset cells."""
    if not value.strip():
        return ()
    if separator in value:
        parts = value.split(separator)
    else:
        parts = value.split(";")
    return tuple(part.strip() for part in parts if part.strip())
