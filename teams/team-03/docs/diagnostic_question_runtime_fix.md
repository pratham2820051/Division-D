# Diagnostic Question Runtime Fix

**Date:** 2026-05-30  
**Error:** `ReferenceError: Cannot access 'conversation' before initialization`  
**Location:** `frontend/src/hooks/use-chat-orchestration.ts` → `dispatchMessage()` (line ~85)

---

## Root Cause

In `dispatchMessage()`, `conversation?.language` was read **before** `conversation` was declared:

```typescript
// BUG — temporal dead zone (TDZ)
const conversationLanguage =
  options?.language ??
  conversation?.language ??   // ← ReferenceError: conversation not initialized yet
  language;

let conversationId = activeConversationId;
// ...
const conversation = conversations.find((c) => c.id === conversationId);
```

JavaScript `const` bindings exist in a temporal dead zone from the start of the block until the declaration runs. Referencing `conversation` above its `const` line throws at runtime.

This surfaced when clicking **Yes** / **No** on a diagnostic question because `answerDiagnosticQuestion()` calls `dispatchMessage(answer)`, which hit the bad ordering on every send — not only diagnostic answers, but that path is the most common trigger after the first assistant reply.

---

## Fix

### 1. Reorder initialization in `dispatchMessage()`

Resolve `conversationId` and look up `conversation` **first**, then derive language:

```typescript
let conversationId = activeConversationId;
if (!conversationId) {
  conversationId = createConversation();
}

const conversation = conversations.find((c) => c.id === conversationId);

const messageLanguage = resolveDispatchMessageLanguage(
  conversation,
  language,
  {
    language: options?.language,
    detectedLanguage: options?.voiceMetadata?.detected_language,
  },
);
```

### 2. Extract language helper (regression guard)

New module: `frontend/src/lib/chat-dispatch-language.ts`

- Encapsulates “conversation must exist before reading `conversation.language`”
- Covered by `frontend/src/lib/chat-dispatch-language.test.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/hooks/use-chat-orchestration.ts` | Move `conversation` lookup before language resolution |
| `frontend/src/lib/chat-dispatch-language.ts` | Pure helper for dispatch language |
| `frontend/src/lib/chat-dispatch-language.test.ts` | Regression tests |
| `frontend/vitest.config.ts` | Vitest + `@/` alias |
| `frontend/package.json` | `"test": "vitest run"`, `vitest` devDependency |

---

## Verification

### Automated

```bash
cd frontend
npm install
npm test
```

Expected: all tests in `chat-dispatch-language.test.ts` pass.

### Manual (browser)

1. Start backend and frontend (`npm run dev`).
2. Open chat, describe symptoms until a **diagnostic question** card appears.
3. Click **Yes** — message sends, no console error, flow continues.
4. Click **No** on a new question — same.
5. Type a custom answer (e.g. “sometimes”) and send — same.
6. Confirm DevTools console has no `ReferenceError`.

---

## Prevention

- Never reference a `const`/`let` variable above its declaration in the same block.
- Use `resolveDispatchMessageLanguage()` for any future dispatch paths that need `conversation.language`.
