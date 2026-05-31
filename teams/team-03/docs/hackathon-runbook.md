# Hackathon Runbook

## Hour 0–1 (both)

1. Copy env files and add `GROQ_API_KEY`
2. Run backend health check: `GET /api/v1/health`
3. Run frontend: `npm run dev`
4. Agree on schemas in `docs/api-contracts.md`

## Demo path

Voice (Hindi) → Chat triage → RAG diagnosis → Severity + first aid → WhatsApp alert

## Integration branch

Merge to `dev` every 90 minutes. Wire `chat_service` to A's services in hours 8–10.
