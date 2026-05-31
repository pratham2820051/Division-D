"use client";

export function useSession() {
  return { sessionId: null as string | null, reset: () => {} };
}
