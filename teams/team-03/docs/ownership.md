# Developer Ownership

## Developer A — Diagnostic Brain

- `backend/features/rag/`
- `backend/features/triage/`
- `backend/features/confidence_scoring/`
- `backend/features/prompts/`
- `backend/datasets/`
- `backend/vector_store/`
- `backend/shared/llm/`

## Developer B — Experience & Delivery

- `backend/features/chat/`
- `backend/features/memory/`
- `backend/features/voice/`
- `backend/features/translation/`
- `backend/features/sms_alerts/`
- `frontend/` (both devs; B leads shell)

## Shared (both review before merge)

- `backend/config/`
- `backend/shared/` (except llm — A owns)
- `backend/database/`
- `backend/main.py`
