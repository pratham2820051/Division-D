import { ChatHistoryList } from "@/components/chat/sidebar/ChatHistoryList";
import { NewChatButton } from "@/components/chat/sidebar/NewChatButton";
import { Separator } from "@/components/ui/separator";
import type { ChatSession } from "@/types/chat";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white shadow-sm">
          PM
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            PashuMitra AI
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Livestock triage
          </p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <NewChatButton onClick={onNewChat} />
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        <p className="mb-1.5 px-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Chats
        </p>
        <ChatHistoryList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={onSelectSession}
        />
      </div>
    </aside>
  );
}
