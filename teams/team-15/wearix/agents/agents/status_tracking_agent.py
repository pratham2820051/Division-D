"""
Status Tracking Agent (Team D15).
Coordinates ticket state transitions, updates database records, and generates pipeline execution logs.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.database import update_status


class StatusTrackingAgent:
    """
    Agent responsible for tracking the resolution pipeline status and logging history.
    """
    
    @staticmethod
    def log_transition(ticket_id: int, from_status: str, to_status: str, logs: list[str]) -> list[str]:
        """Adds a log entry for a status transition."""
        msg = f"🔄 State Transition (ID #{ticket_id}): {from_status} ➔ {to_status}"
        print(msg)
        return logs + [msg]
    
    @staticmethod
    def update_database(ticket_id: int, status: str, **fields: Any) -> dict[str, Any]:
        """Saves the pipeline results to the Supabase database."""
        print(f"💾 Saving ticket ID #{ticket_id} to database with status: {status}...")
        return update_status(ticket_id, status, **fields)
