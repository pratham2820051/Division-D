"""
Generate agents/sample_outputs.json from all hardcoded mock inputs.

Run from project root:
    python -m agents.generate_demo_outputs
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from agents.escalator import MOCK_TIER2_INPUTS, generate_escalation_brief
from agents.resolver import MOCK_TIER1_INPUTS, draft_customer_reply
from agents.router import run_agent

OUTPUT_PATH = Path(__file__).resolve().parent / "sample_outputs.json"


def main() -> None:
    records: list[dict] = []

    for mock in MOCK_TIER1_INPUTS:
        records.append(
            {
                "tier": "Tier-1",
                "input": mock,
                "output": run_agent("Tier-1", mock["intent"], mock["text"]),
            }
        )

    for mock in MOCK_TIER2_INPUTS:
        records.append(
            {
                "tier": "Tier-2",
                "input": mock,
                "output": run_agent("Tier-2", mock["intent"], mock["text"]),
            }
        )

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": __import__("os").getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "records": records,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
