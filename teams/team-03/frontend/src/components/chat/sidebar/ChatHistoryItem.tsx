import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types/chat";

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
}

function formatRelativeDate(date: Date): string {
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatHistoryItem({
  session,
  isActive,
  onSelect,
}: ChatHistoryItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        "group flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-sidebar-accent text-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/80",
      )}
    >
      <span className="truncate text-sm">{session.title}</span>
      <span className="text-[11px] text-muted-foreground">
        {formatRelativeDate(session.updatedAt)}
      </span>
    </button>
  );
}
