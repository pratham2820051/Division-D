# Supabase setup guide (beginner) — Team D15

This guide takes you from **zero** to a working pipeline:

**ticket text → classify → Groq agent (Member 2) → save in Supabase (Member 3)**

Member 2 (`agents/`) is already built. You will set up Supabase and run `pipeline.py`.

---

## Part A — Create a Supabase project (15 minutes)

### Step 1: Sign up

1. Open [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub or email

### Step 2: New project

1. Click **New project**
2. Choose your **organization** (or create one)
3. Fill in:
   - **Name:** `team-d15-support` (any name)
   - **Database password:** generate a strong password → **save it somewhere safe**
   - **Region:** pick closest to you (e.g. Southeast Asia / US East)
4. Click **Create new project**
5. Wait 1–2 minutes until status is **Active**

### Step 3: Create the `tickets` table

1. In the left sidebar, open **SQL Editor**
2. Click **New query**
3. Open the file `db/schema.sql` from this repo, copy **all** of it, paste into the editor
4. Click **Run** (or Ctrl+Enter)
5. You should see **Success**

### Step 4: Confirm the table

1. Left sidebar → **Table Editor**
2. You should see table **`tickets`** with columns like `id`, `text`, `status`, `response`, etc.

---

## Part B — Get API keys (5 minutes)

1. Left sidebar → **Project Settings** (gear icon)
2. Click **API** under Configuration
3. Copy these two values:

| Name in Supabase | Put in `.env` as |
|------------------|------------------|
| **Project URL** | `SUPABASE_URL` |
| **service_role** key (under Project API keys) | `SUPABASE_KEY` |

> **Why service_role?** For a hackathon backend script, it’s simpler than Row Level Security setup.  
> **Never** commit this key to GitHub or share it publicly. Only use in `.env` on your machine.

4. Open your `.env` file in the project root and add:

```env
GROQ_API_KEY=your_existing_groq_key
GROQ_MODEL=llama-3.3-70b-versatile

SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_service_role_key
```

5. Update `.env.example` for teammates (placeholder values only, no real keys)

---

## Part C — Install Python packages (2 minutes)

Open PowerShell:

```powershell
cd c:\Users\Anusha\Downloads\Hackthon
pip install -r requirements.txt
```

---

## Part D — Run the pipeline (Member 3 work)

### 1) Seed 15 sample tickets (no Groq calls yet)

```powershell
python pipeline.py --seed-only
```

Check **Supabase → Table Editor → tickets** — you should see 15 rows with `status = PENDING`.

### 2) Process all tickets (classify + Groq + update DB)

```powershell
python pipeline.py
```

This will:

1. Classify each ticket (stub until Member 1 connects `ml/classifier.py`)
2. Call your Groq agents via `run_agent()`
3. Update Supabase: `RESOLVED` + `response` OR `ESCALATED` + brief fields

### 3) Process one ticket only (faster test)

```powershell
python pipeline.py --id 1
```

---

## Part E — What each file does

| File | Role |
|------|------|
| `agents/resolver.py` | Member 2 — Tier-1 reply |
| `agents/escalator.py` | Member 2 — Tier-2 brief |
| `agents/router.py` | Member 2 — `run_agent(tier, intent, text)` |
| `db/schema.sql` | SQL to run once in Supabase |
| `db/database.py` | Member 3 — CRUD functions |
| `pipeline.py` | Member 3 — connects everything |
| `data/sample_tickets.json` | 15 demo tickets |

---

## Part F — CRUD functions (for Member 4 dashboard)

Member 4 can import from `db/database.py`:

```python
from db.database import get_all_tickets, get_ticket_by_id

rows = get_all_tickets()   # for the queue table
one = get_ticket_by_id(3)  # for detail view
```

---

## Part G — When Member 1 finishes the ML classifier

Replace the stub automatically: put `ml/classifier.py` with:

```python
def classify(text: str) -> dict:
    return {"tier": "...", "intent": "...", "department": "...", "confidence": 0.91}
```

`pipeline.py` already tries `from ml.classifier import classify` first.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `SUPABASE_URL and SUPABASE_KEY must be set` | Add both to `.env`, restart terminal |
| `relation "tickets" does not exist` | Run `db/schema.sql` in SQL Editor |
| `insert failed` / permission denied | Use **service_role** key, or check RLS policy in schema.sql |
| Groq errors | Check `GROQ_API_KEY` in `.env` |
| Empty table after seed | Run `python pipeline.py --seed-only` again |

---

## Security checklist

- [ ] `.env` is in `.gitignore` (already done)
- [ ] Never paste **service_role** key in chat, slides, or GitHub
- [ ] Rotate keys if accidentally exposed

---

## Quick command summary

```powershell
cd c:\Users\Anusha\Downloads\Hackthon
pip install -r requirements.txt

# After Supabase project + schema.sql + .env keys:
python pipeline.py --seed-only
python pipeline.py
python pipeline.py --id 1
```

You’re done when Supabase **tickets** rows show `RESOLVED` or `ESCALATED` with filled `response` or brief columns.
