"""
Tier-2 Escalation Agent (Member 2 — Groq Agents).

Input schema (frozen):  {"intent": str, "text": str}
Output: structured brief with sentiment, priority, department, SLA
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.groq_utils import DEFAULT_MODEL, create_chat_completion

# Frozen schema — hardcoded mock inputs (Bitext-aligned Tier-2 samples)
MOCK_TIER2_INPUTS: list[dict[str, str]] = [
    {
        "intent": "complaint",
        "text": "This is the third time my order arrived damaged. I want compensation, not another apology.",
    },
    {
        "intent": "payment_issue",
        "text": "I was charged twice for order ORD-77801 and nobody has fixed it after two weeks.",
    },
    {
        "intent": "registration_problems",
        "text": "I cannot log in after the password reset. The app crashes every time on Android.",
    },
    {
        "intent": "contact_human_agent",
        "text": "Stop sending bots. I need a supervisor now — I will dispute the charge with my bank.",
    },
]

DEPARTMENT_ROUTING: dict[str, str] = {
    "complaint": "Customer Relations",
    "payment_issue": "Finance & Billing",
    "check_invoice": "Finance & Billing",
    "get_invoice": "Finance & Billing",
    "registration_problems": "Engineering",
    "contact_human_agent": "Customer Relations",
    "contact_customer_service": "Customer Relations",
    "review": "Customer Relations",
}

SLA_BY_PRIORITY: dict[str, str] = {
    "critical": "4 business hours",
    "high": "8 business hours",
    "medium": "24 business hours",
    "low": "48 business hours",
}

BRIEF_SCHEMA = {
    "sentiment": "one of: positive, neutral, negative, frustrated, urgent",
    "priority": "one of: low, medium, high, critical",
    "department": "target Tier-2 team name",
    "sla": "human-readable SLA window e.g. '8 business hours'",
    "issue_summary": "2-3 sentence internal summary for the receiving team",
    "recommended_actions": "bulleted string of 2-4 next steps for the human agent",
}

SYSTEM_PROMPT = """You are a Tier-2 escalation analyst for ShopEase e-commerce support.

Given a classified intent and customer message, produce an INTERNAL escalation brief for the receiving department.

Department routing guide (use unless the message clearly indicates another team):
- billing, payment, invoice, double charge, refund not received → Finance & Billing
- damaged goods, repeated failures, compensation demands, supervisor requests → Customer Relations
- app crash, login bugs, website errors → Engineering
- fraud, unauthorized charges, account takeover → Security
- legal threats, regulatory complaints → Legal & Compliance

Priority rules:
- critical: fraud, account compromise, legal/regulatory threat, safety issue
- high: duplicate billing, refund overdue 14+ days, repeat failure (3+ contacts), chargeback threat
- medium: standard complaints, technical issues with workaround
- low: general feedback, non-urgent inquiries misrouted to Tier-2

SLA rules (must match priority):
- critical → 4 business hours
- high → 8 business hours
- medium → 24 business hours
- low → 48 business hours

Respond with valid JSON only, matching this schema:
{
  "sentiment": "...",
  "priority": "...",
  "department": "...",
  "sla": "...",
  "issue_summary": "...",
  "recommended_actions": "..."
}"""


def _build_escalator_prompt(intent: str, text: str) -> str:
    hint_dept = DEPARTMENT_ROUTING.get(intent, "infer from message content")
    return f"""Intent label: {intent}
Routing hint (override if message contradicts): {hint_dept}

Customer message:
\"\"\"
{text}
\"\"\"

Generate the escalation brief JSON."""


def _parse_json_content(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group())
        raise


def _normalize_brief(data: dict[str, Any], intent: str) -> dict[str, str]:
    priority = str(data.get("priority", "medium")).lower().strip()
    if priority not in SLA_BY_PRIORITY:
        priority = "medium"

    department = str(data.get("department") or DEPARTMENT_ROUTING.get(intent, "Customer Relations")).strip()
    sla = str(data.get("sla") or SLA_BY_PRIORITY[priority]).strip()
    sentiment = str(data.get("sentiment", "negative")).lower().strip()

    brief: dict[str, str] = {
        "sentiment": sentiment,
        "priority": priority,
        "department": department,
        "sla": sla,
    }
    if data.get("issue_summary"):
        brief["issue_summary"] = str(data["issue_summary"]).strip()
    if data.get("recommended_actions"):
        brief["recommended_actions"] = str(data["recommended_actions"]).strip()
    return brief


def generate_escalation_brief(intent: str, text: str, *, model: str | None = None) -> dict[str, str]:
    """
    Tier-2 Escalation Agent entry point.

    Args:
        intent: Classified intent (e.g. complaint, payment_issue).
        text: Raw customer ticket body.

    Returns:
        Dict with keys: sentiment, priority, department, sla
        (plus issue_summary and recommended_actions when provided by the model).
    """
    response = create_chat_completion(
        model=model or DEFAULT_MODEL,
        temperature=0.2,
        max_tokens=500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_escalator_prompt(intent, text)},
        ],
    )
    raw = (response.choices[0].message.content or "").strip()
    if not raw:
        raise RuntimeError("Groq returned an empty escalation brief.")
    parsed = _parse_json_content(raw)
    return _normalize_brief(parsed, intent)


def _demo() -> None:
    sample = MOCK_TIER2_INPUTS[1]
    print("=== Tier-2 Escalator (mock input) ===")
    print(f"Input: {sample}\n")
    brief = generate_escalation_brief(sample["intent"], sample["text"])
    print(json.dumps(brief, indent=2))


if __name__ == "__main__":
    _demo()
