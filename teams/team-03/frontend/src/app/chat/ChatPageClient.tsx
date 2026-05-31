"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ChatInterface = dynamic(
  () =>
    import("@/components/chat/ChatInterface").then((mod) => mod.ChatInterface),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Loading chat…</span>
      </div>
    ),
  },
);

export function ChatPageClient() {
  return <ChatInterface />;
}
