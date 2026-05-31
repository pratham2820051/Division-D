import { MessageSquarePlus } from "lucide-react";

interface ConversationEmptyStateProps {
  isSearching?: boolean;
  onNewChat?: () => void;
}

export function ConversationEmptyState({
  isSearching = false,
  onNewChat,
}: ConversationEmptyStateProps) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No chats found</p>
        <p className="text-xs text-muted-foreground/80">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <MessageSquarePlus className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No conversations yet</p>
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          className="text-xs font-medium text-primary hover:underline"
        >
          Start a new chat
        </button>
      )}
    </div>
  );
}
