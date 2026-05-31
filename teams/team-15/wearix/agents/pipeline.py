"""
Member 3 — Pipeline: classify → Groq agent → Supabase.

Usage:
    python pipeline.py              # process all sample tickets
    python pipeline.py --id 3       # process one ticket by id
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

load_dotenv()

from agents.router import run_agent
from agents.intake_agent import parse_intake
from agents.status_tracking_agent import StatusTrackingAgent
from db.database import (
    get_all_tickets,
    get_ticket_by_id,
    insert_ticket,
    update_status,
)

SAMPLE_PATH = ROOT / "data" / "sample_tickets.json"


def classify(text: str) -> dict:
    """
    Member 1 hook. Uses ml.classifier if available, else a simple stub.
    """
    try:
        from ml.classifier import classify as ml_classify

        return ml_classify(text)
    except ImportError:
        return _stub_classify(text)


def _stub_classify(text: str) -> dict:
    """Fallback until Member 1's model is wired in."""
    lower = text.lower()
    tier2_keywords = [
        "damaged",
        "twice",
        "charged",
        "supervisor",
        "dispute",
        "crash",
        "fraud",
        "unauthorized",
        "lawyer",
        "complaint",
        "without permission",
    ]
    tier = "Tier-2" if any(k in lower for k in tier2_keywords) else "Tier-1"

    intent = "contact_customer_service"
    department = "Customer Relations"
    if "cancel" in lower:
        intent, department = "cancel_order", "Logistics"
    elif "refund" in lower or "return" in lower:
        intent, department = "track_refund", "Finance & Billing"
    elif "deliver" in lower or "arrive" in lower or "package" in lower:
        intent, department = "delivery_period", "Logistics"
    elif "invoice" in lower:
        intent, department = "get_invoice", "Finance & Billing"
    elif "login" in lower or "crash" in lower or "password" in lower:
        intent, department = "registration_problems", "Engineering"
    elif "charged twice" in lower or "billing" in lower:
        intent, department = "payment_issue", "Finance & Billing"
    elif "damaged" in lower or "wrong item" in lower:
        intent, department = "complaint", "Customer Relations"
    elif "unsubscribe" in lower or "newsletter" in lower:
        intent, department = "newsletter_subscription", "Customer Relations"
    elif tier == "Tier-2":
        intent = "complaint"

    return {
        "tier": tier,
        "intent": intent,
        "department": department,
        "confidence": 0.75 if tier == "Tier-1" else 0.82,
    }


def process_ticket_row(ticket: dict) -> dict:
    """Run full pipeline on one DB ticket row."""
    ticket_id = ticket["id"]
    text = ticket["text"]

    # 1. Ticket Intake Agent: ingest and extract metadata
    print(f"\n--- Processing Ticket ID: {ticket_id} ---")
    intake = parse_intake(text)
    print(f"📥 Intake Agent: Parsed customer name & order ID details")
    print(f"   Name: {intake['customer_name']} | Email: {intake['customer_email']} | Order: {intake['order_id']}")

    # 2. Status Tracking Agent: log state transition to PROCESSING
    logs = [f"Intake Agent: Ingested ticket text. Name: {intake['customer_name']} | Order ID: {intake['order_id']}"]
    StatusTrackingAgent.log_transition(ticket_id, "PENDING", "PROCESSING", logs)

    # 3. ML Classification Model: predict intent, tier, department, confidence
    classification = classify(intake["cleaned_text"])
    print(f"🔍 Classifier: intent='{classification['intent']}', tier='{classification['tier']}', confidence={classification['confidence']}")

    # 4. Route & Execute (Resolution or Escalation Agent)
    agent_result = run_agent(
        classification["tier"],
        classification["intent"],
        intake["cleaned_text"],
    )

    status = agent_result.get("status", "PENDING")
    
    # 5. Status Tracking Agent: log transition to target status
    StatusTrackingAgent.log_transition(ticket_id, "PROCESSING", status, logs)

    fields: dict = {
        "intent": classification["intent"],
        "tier": "Tier-1" if str(classification["tier"]) == "1" else "Tier-2" if str(classification["tier"]) == "2" else str(classification["tier"]),
        "department": classification["department"],
        "confidence": classification["confidence"],
    }
    if status == "RESOLVED":
        fields["response"] = agent_result.get("response")
    else:
        brief = agent_result.get("brief") or {}
        fields.update(
            {
                "department": brief.get("department") or classification["department"],
                "sentiment": brief.get("sentiment"),
                "priority": brief.get("priority"),
                "sla": brief.get("sla"),
                "issue_summary": brief.get("issue_summary"),
                "recommended_actions": brief.get("recommended_actions"),
            }
        )

    # 6. Save update using Status Tracking Agent
    return StatusTrackingAgent.update_database(ticket_id, status, **fields)


def seed_sample_tickets() -> list[dict]:
    """Insert 15 sample tickets if table is empty."""
    existing = get_all_tickets()
    if existing:
        print(f"Database already has {len(existing)} ticket(s). Skipping seed.")
        return existing

    samples = json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))
    created = []
    for item in samples:
        row = insert_ticket(item["text"], status="PENDING")
        created.append(row)
        print(f"  Seeded ticket id={row['id']}")
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Run support ticket pipeline")
    parser.add_argument("--seed-only", action="store_true", help="Only seed sample tickets")
    parser.add_argument("--id", type=int, help="Process a single ticket id")
    args = parser.parse_args()

    print("=== Team D15 Pipeline (Supabase + Groq) ===\n")

    if args.seed_only:
        seed_sample_tickets()
        return

    tickets = seed_sample_tickets()
    if not tickets:
        tickets = get_all_tickets()

    if args.id is not None:
        ticket = get_ticket_by_id(args.id)
        if not ticket:
            print(f"Ticket id={args.id} not found.")
            sys.exit(1)
        tickets = [ticket]

    pending = [t for t in tickets if t.get("status") in (None, "PENDING", "PROCESSING")]
    if not pending and not args.id:
        pending = tickets

    for ticket in pending:
        print(f"Processing ticket id={ticket['id']} ...")
        result = process_ticket_row(ticket)
        print(f"  -> {result['status']} | tier={result.get('tier')} | intent={result.get('intent')}")
        if result.get("response"):
            print(f"  -> response preview: {result['response'][:80]}...")
        if result.get("priority"):
            print(f"  -> brief: {result.get('priority')} | {result.get('department')} | {result.get('sla')}")

    print("\nDone. View rows in Supabase → Table Editor → tickets")


if __name__ == "__main__":
    main()
