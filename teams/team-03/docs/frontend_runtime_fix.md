# Frontend Runtime Fix

Date: 2026-05-30

## Errors fixed

### Error 1: Zustand infinite loop

**Message:** `The result of getSnapshot should be cached to avoid an infinite loop`

**Location:** `src/hooks/use-conversations.ts` → `useActiveConversation()` line 90

#### Root cause

`selectActiveMessages` in `conversationStore.ts` used:

```typescript
return selectActiveConversation(state)?.messages ?? [];
```

When no active conversation exists, `?? []` creates a **new empty array on every selector invocation**. React 19's `useSyncExternalStore` (used by Zustand) compares snapshots by reference; a new `[]` each time triggers a state update → re-render → infinite loop.

#### Fix

1. Added a module-level stable constant:

```typescript
export const EMPTY_MESSAGES: Message[] = [];
```

2. Updated selector:

```typescript
export function selectActiveMessages(state: ConversationStore): Message[] {
  return selectActiveConversation(state)?.messages ?? EMPTY_MESSAGES;
}
```

3. Updated `useActiveConversation` to derive messages outside a store subscription (avoids double subscription):

```typescript
const activeConversation = useConversationStore(selectActiveConversation);
const messages = useMemo(
  () => activeConversation?.messages ?? EMPTY_MESSAGES,
  [activeConversation],
);
```

#### Selector audit

| Selector | Returns | Stable? | Notes |
|----------|---------|---------|-------|
| `selectActiveConversation` | `Conversation \| null` | Yes | Reference from store array |
| `selectActiveMessages` | `Message[]` | **Fixed** | Was `?? []`, now `?? EMPTY_MESSAGES` |
| `selectChatError` | `ChatErrorState \| null` | Yes | Primitive/object from store |
| `selectPendingDiagnosticQuestion` | payload or null | Yes | From store |
| Inline selectors in hooks | primitives | Yes | `s.isLoading`, `s.language`, etc. |
| `DiseaseAnalysisCard` inline | `boolean` | Yes | Returns primitive |

**Rule:** Never use `?? []`, `?? {}`, `.map()`, `.filter()`, or spread inside Zustand selectors.

---

### Error 2: `cn is not defined`

**Location:** `src/components/chat/input/ChatInput.tsx` line 99

#### Root cause

Recent voice UI edits added `className={cn(...)}` but removed the import when cleaning up other imports.

#### Fix

```typescript
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";
import type { TranscribeResult } from "@/types/voice";
```

---

## Additional build fix

`src/lib/mockData.ts` still referenced removed language codes (`te`, `ta`, `ml`, `ur`) after `LanguageCode` was restricted to `en | hi | kn`. Removed those entries so `npm run build` passes.

---

## Files changed

| File | Change |
|------|--------|
| `src/stores/conversationStore.ts` | `EMPTY_MESSAGES` + stable `selectActiveMessages` |
| `src/hooks/use-conversations.ts` | `useMemo` for messages in `useActiveConversation` |
| `src/components/chat/input/ChatInput.tsx` | Restored `cn` and type imports |
| `src/lib/mockData.ts` | Removed unsupported language mock entries |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| Runtime overlay | None (infinite loop resolved) |
| Chat page loads | Yes |
| Delete button UI | Unchanged — still visible on sidebar rows |
| Voice UI | Unchanged — `ChatInput` + `VoiceMode` render |

---

## Verification steps

1. Open `/` — no React error overlay
2. Open browser console — no `getSnapshot` warning
3. Create chat, send message — message list updates
4. Trash icon visible and delete works
5. Mic opens voice panel without `cn` ReferenceError
