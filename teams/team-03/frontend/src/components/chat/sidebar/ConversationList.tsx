import { ConversationEmptyState } from "@/components/chat/sidebar/ConversationEmptyState";
import {
  ConversationItem,
  ConversationListSkeleton,
} from "@/components/chat/sidebar/ConversationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading?: boolean;
  isSearching?: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onNewChat?: () => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading = false,
  isSearching = false,
  onSelect,
  onRename,
  onDelete,
  onNewChat,
}: ConversationListProps) {
  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <ConversationEmptyState
        isSearching={isSearching}
        onNewChat={onNewChat}
      />
    );
  }

  return (
    <ScrollArea className="flex-1 px-2">
      <div className="flex flex-col gap-0.5 pb-3">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
