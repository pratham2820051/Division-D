import { MessageSquare } from "lucide-react";

import { ChatHistoryItem } from "@/components/chat/sidebar/ChatHistoryItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession } from "@/types/chat";

interface ChatHistoryListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
}

export function ChatHistoryList({
  sessions,
  activeSessionId,
  onSelect,
}: ChatHistoryListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
        <MessageSquare className="h-7 w-7 opacity-30" />
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-2">
      <div className="flex flex-col gap-0.5 pb-3">
        {sessions.map((session) => (
          <ChatHistoryItem
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
