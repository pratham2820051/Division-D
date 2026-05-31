"""
FastAPI bridge — exposes the Python agent pipeline as HTTP endpoints.
Next.js calls these from /api/support/* route handlers.

Run:
    uvicorn api:app --reload --port 8000

Endpoints:
    POST /classify          — ML classify a message
    POST /process           — Full pipeline: intake → classify → agent → DB
    GET  /tickets           — All tickets from Supabase
    GET  /tickets/{id}      — Single ticket
    POST /tickets           — Insert + process a new ticket
    GET  /health            — Health check
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
load_dotenv()

# ── Import pipeline components ────────────────────────────────────────────────
from agents.intake_agent import parse_intake
from agents.router import run_agent
from db.database import (
    get_all_tickets,
    get_ticket_by_id,
    insert_ticket,
    update_status,
)

# ── ML Classifier (with stub fallback) ───────────────────────────────────────
try:
    from ml.classifier import classify as ml_classify
    _ML_AVAILABLE = True
except Exception:
    _ML_AVAILABLE = False

def classify(text: str) -> dict:
    if _ML_AVAILABLE:
        return ml_classify(text)
    # Stub fallback
    lower = text.lower()
    tier2_kw = ["damaged","twice","charged","supervisor","dispute","crash",
                "fraud","unauthorized","lawyer","complaint","without permission"]
    tier = 2 if any(k in lower for k in tier2_kw) else 1
    intent = "contact_customer_service"
    department = "Support"
    if "cancel" in lower:       intent, department = "cancel_order", "Orders"
    elif "refund" in lower or "return" in lower: intent, department = "track_refund", "Returns"
    elif "deliver" in lower or "package" in lower: intent, department = "delivery_period", "Logistics"
    elif "invoice" in lower:    intent, department = "get_invoice", "Billing"
    elif "login" in lower or "crash" in lower: intent, department = "registration_problems", "Account"
    elif "charged twice" in lower or "billing" in lower: intent, department = "payment_issue", "Billing"
    elif "damaged" in lower or "wrong item" in lower: intent, department = "complaint", "Support"
    elif "unsubscribe" in lower: intent, department = "newsletter_subscription", "General"
    return {"tier": tier, "intent": intent, "department": department, "confidence": 0.75}


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Wearix Support Agent API",
    description="Agentic customer support pipeline — Team D15",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────
class ClassifyRequest(BaseModel):
    text: str

class ProcessRequest(BaseModel):
    text: str

class NewTicketRequest(BaseModel):
    text: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "ml_available": _ML_AVAILABLE}


@app.post("/classify")
def classify_message(req: ClassifyRequest) -> dict[str, Any]:
    """Classify a message and return tier, intent, department, confidence."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")
    result = classify(req.text)
    # Normalise tier to string
    result["tier"] = f"Tier-{result['tier']}" if isinstance(result["tier"], int) else result["tier"]
    return result


@app.post("/process")
def process_message(req: ProcessRequest) -> dict[str, Any]:
    """
    Run the full pipeline on a raw message (no DB insert).
    Returns classification + agent output (response or brief).
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    # 1. Intake
    try:
        intake = parse_intake(req.text)
    except Exception:
        intake = {
            "customer_name": "Valued Customer",
            "customer_email": "customer@wearix.com",
            "order_id": "N/A",
            "cleaned_text": req.text,
        }

    # 2. Classify
    classification = classify(intake.get("cleaned_text", req.text))
    tier_str = f"Tier-{classification['tier']}" if isinstance(classification["tier"], int) else classification["tier"]

    # 3. Run agent
    try:
        agent_result = run_agent(tier_str, classification["intent"], intake.get("cleaned_text", req.text))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent error: {exc}")

    return {
        "intake": intake,
        "classification": {**classification, "tier": tier_str},
        "agent": agent_result,
    }


@app.get("/tickets")
def list_tickets() -> list[dict[str, Any]]:
    """Return all tickets from Supabase, newest first."""
    try:
        return get_all_tickets()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}")


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int) -> dict[str, Any]:
    """Return a single ticket by ID."""
    try:
        ticket = get_ticket_by_id(ticket_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}")
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket


@app.post("/tickets", status_code=201)
def create_and_process_ticket(req: NewTicketRequest) -> dict[str, Any]:
    """
    Insert a new ticket into Supabase, run the full pipeline, and update the row.
    Returns the final ticket row.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    # 1. Insert as PENDING
    try:
        row = insert_ticket(req.text, status="PENDING")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"DB insert error: {exc}")

    ticket_id = row["id"]

    # 2. Intake
    try:
        intake = parse_intake(req.text)
    except Exception:
        intake = {
            "customer_name": "Valued Customer",
            "customer_email": "customer@wearix.com",
            "order_id": "N/A",
            "cleaned_text": req.text,
        }

    # 3. Classify
    classification = classify(intake.get("cleaned_text", req.text))
    tier_str = f"Tier-{classification['tier']}" if isinstance(classification["tier"], int) else classification["tier"]

    # 4. Run agent
    try:
        agent_result = run_agent(tier_str, classification["intent"], intake.get("cleaned_text", req.text))
    except Exception as exc:
        # Save as PENDING with classification only
        try:
            update_status(ticket_id, "PENDING",
                          intent=classification["intent"],
                          tier=tier_str,
                          department=classification["department"],
                          confidence=classification["confidence"])
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"Agent error: {exc}")

    # 5. Persist result
    status = agent_result.get("status", "PENDING")
    fields: dict[str, Any] = {
        "intent": classification["intent"],
        "tier": tier_str,
        "department": classification["department"],
        "confidence": classification["confidence"],
    }
    if status == "RESOLVED":
        fields["response"] = agent_result.get("response")
    else:
        brief = agent_result.get("brief") or {}
        fields.update({
            "department": brief.get("department") or classification["department"],
            "sentiment": brief.get("sentiment"),
            "priority": brief.get("priority"),
            "sla": brief.get("sla"),
            "issue_summary": brief.get("issue_summary"),
            "recommended_actions": brief.get("recommended_actions"),
        })

    try:
        final_row = update_status(ticket_id, status, **fields)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"DB update error: {exc}")

    return {**final_row, "_agent": agent_result}
