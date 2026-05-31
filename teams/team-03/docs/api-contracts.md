# API Contracts

Base URL: `http://localhost:8000/api/v1`

## POST /chat/message

**Request**
```json
{
  "session_id": "uuid | null",
  "message": "string",
  "language": "en"
}
```

**Response**
```json
{
  "session_id": "uuid",
  "reply": "string",
  "severity": "self_treatable | urgent | critical | null",
  "confidence": 0.0,
  "disease": "string | null",
  "first_aid": "string | null",
  "follow_up_question": "string | null"
}
```

## POST /voice/transcribe

Multipart audio file → `{ "text": "string", "language": "en" }`

## POST /voice/synthesize

`{ "text": "string", "language": "en" }` → audio bytes

## POST /alerts/generate

Triage result → `{ "sms_text": "string", "whatsapp_text": "string" }`
