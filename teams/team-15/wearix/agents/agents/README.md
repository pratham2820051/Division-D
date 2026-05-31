# Member 2 — Groq Agents (Team D15)

Tier-1 and Tier-2 LLM agents for the customer support escalation pipeline.

## Setup

```powershell
cd c:\Users\Anusha\Downloads\Hackthon
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set your Groq API key:

```
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

## Frozen input schema

All agents accept:

```python
{"intent": "<intent_label>", "text": "<customer_message>"}
```

## Public API

| Function | File | When to use |
|----------|------|-------------|
| `draft_customer_reply(intent, text)` | `resolver.py` | Tier-1 → customer reply string |
| `generate_escalation_brief(intent, text)` | `escalator.py` | Tier-2 → `{sentiment, priority, department, sla, ...}` |
| `run_agent(tier, intent, text)` | `router.py` | **Recommended for pipeline** — picks agent automatically |

### Pipeline integration (Member 3)

```python
from agents.router import run_agent

classification = classify(ticket_text)  # Member 1
result = run_agent(
    classification["tier"],
    classification["intent"],
    ticket_text,
)

if result["status"] == "RESOLVED":
    save_response(result["response"])
else:
    brief = result["brief"]
    save_escalation(brief)
```

`tier` accepts: `"Tier-1"`, `"Tier-2"`, `1`, `2`, `"tier1"`, `"tier2"`, etc.

## Run manually

```powershell
python agents/resolver.py
python agents/escalator.py
python agents/router.py
```

## Demo artifacts

Generate cached sample outputs for slides/demo backup:

```powershell
python -m agents.generate_demo_outputs
```

Creates `agents/sample_outputs.json` (7 records from mock inputs).

## Retry behavior

Groq calls retry up to 3 times on rate limits (429) and transient server errors, with exponential backoff. Implemented in `groq_utils.py` — used by both agents automatically.
