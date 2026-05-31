"""
Member 3 — Supabase database layer.

CRUD functions for the tickets table. Uses SUPABASE_URL + SUPABASE_KEY from .env
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

_TABLE = "tickets"
_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_KEY", "").strip()
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY must be set in .env. "
            "See SUPABASE_SETUP.md for how to get them."
        )
    _client = create_client(url, key)
    return _client


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def insert_ticket(
    text: str,
    *,
    intent: str | None = None,
    tier: str | None = None,
    department: str | None = None,
    confidence: float | None = None,
    status: str = "PENDING",
) -> dict[str, Any]:
    """Insert a new ticket. Returns the created row (including id)."""
    row = {
        "text": text,
        "intent": intent,
        "tier": tier,
        "department": department,
        "confidence": confidence,
        "status": status,
    }
    result = get_client().table(_TABLE).insert(row).execute()
    if not result.data:
        raise RuntimeError("insert_ticket failed — no data returned from Supabase.")
    return result.data[0]


def update_status(ticket_id: int, status: str, **fields: Any) -> dict[str, Any]:
    """
    Update ticket status and optional fields.

    Examples:
        update_status(1, "RESOLVED", response="Dear customer...")
        update_status(2, "ESCALATED", sentiment="frustrated", priority="high", ...)
    """
    payload: dict[str, Any] = {"status": status, "updated_at": _now_iso()}
    allowed = {
        "intent",
        "tier",
        "department",
        "confidence",
        "response",
        "sentiment",
        "priority",
        "sla",
        "issue_summary",
        "recommended_actions",
    }
    for key, value in fields.items():
        if key in allowed:
            payload[key] = value

    result = (
        get_client()
        .table(_TABLE)
        .update(payload)
        .eq("id", ticket_id)
        .execute()
    )
    if not result.data:
        raise RuntimeError(f"update_status failed for ticket id={ticket_id}.")
    return result.data[0]


def get_all_tickets() -> list[dict[str, Any]]:
    """Return all tickets, newest first."""
    result = (
        get_client()
        .table(_TABLE)
        .select("*")
        .order("id", desc=True)
        .execute()
    )
    return result.data or []


def get_ticket_by_id(ticket_id: int) -> dict[str, Any] | None:
    """Return one ticket or None if not found."""
    result = (
        get_client().table(_TABLE).select("*").eq("id", ticket_id).execute()
    )
    if not result.data:
        return None
    return result.data[0]


def update_from_agent_result(ticket_id: int, agent_result: dict[str, Any]) -> dict[str, Any]:
    """Apply output from agents.router.run_agent() to a ticket row."""
    status = agent_result.get("status", "PENDING")
    fields: dict[str, Any] = {
        "intent": agent_result.get("intent"),
        "tier": agent_result.get("tier"),
    }

    if status == "RESOLVED":
        fields["response"] = agent_result.get("response")
    elif status == "ESCALATED":
        brief = agent_result.get("brief") or {}
        fields.update(
            {
                "department": brief.get("department"),
                "sentiment": brief.get("sentiment"),
                "priority": brief.get("priority"),
                "sla": brief.get("sla"),
                "issue_summary": brief.get("issue_summary"),
                "recommended_actions": brief.get("recommended_actions"),
            }
        )

    return update_status(ticket_id, status, **fields)
