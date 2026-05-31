"use client";

import { ConversationList } from "@/components/chat/sidebar/ConversationList";
import { ConversationSearch } from "@/components/chat/sidebar/ConversationSearch";
import { NewChatButton } from "@/components/chat/sidebar/NewChatButton";
import { Separator } from "@/components/ui/separator";
import { useConversationSearch } from "@/hooks/use-conversation-search";
import { useConversations } from "@/hooks/use-conversations";
import { deleteChat } from "@/services/chatService";

interface ConversationSidebarProps {
  onNewChat?: () => void;
  onSelect?: (id: string) => void;
}

export function ConversationSidebar({
  onNewChat,
  onSelect,
}: ConversationSidebarProps) {
  const {
    conversations,
    activeConversationId,
    isHydrated,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const {
    searchQuery,
    setSearchQuery,
    filteredConversations,
    isSearching,
  } = useConversationSearch();

  const handleNewChat = () => {
    const id = createConversation();
    onNewChat?.();
    onSelect?.(id);
  };

  const handleSelect = (id: string) => {
    selectConversation(id);
    onSelect?.(id);
  };

  const handleDelete = async (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation?.synced) {
      try {
        await deleteChat(id);
      } catch (error) {
        console.warn("[sidebar] delete backend failed, removing locally", { id, error });
      }
    }
    deleteConversation(id);
  };

  return (
    <aside className="flex h-full w-full min-w-[280px] flex-col bg-sidebar">
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
        <NewChatButton onClick={handleNewChat} />
      </div>

      <ConversationSearch
        value={searchQuery}
        onChange={setSearchQuery}
        className="mb-2"
      />

      <Separator className="bg-sidebar-border" />

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        <p className="mb-1.5 px-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {isSearching ? "Search results" : "Chats"}
        </p>
        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          isLoading={!isHydrated}
          isSearching={isSearching}
          onSelect={handleSelect}
          onRename={renameConversation}
          onDelete={handleDelete}
          onNewChat={handleNewChat}
        />
      </div>
    </aside>
  );
}
