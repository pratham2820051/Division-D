"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { DeleteConversationDialog } from "@/components/chat/sidebar/DeleteConversationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftTitle(conversation.title);
  }, [conversation.title]);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    } else {
      setDraftTitle(conversation.title);
    }
    setIsRenaming(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-1 py-0.5 transition-colors",
          isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70",
        )}
      >
        {isRenaming ? (
          <div className="flex flex-1 items-center gap-1 px-1 py-1">
            <Input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraftTitle(conversation.title);
                  setIsRenaming(false);
                }
              }}
              onBlur={commitRename}
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className="min-w-0 flex-1 truncate px-2 py-2 text-left text-sm"
              title={conversation.title}
            >
              {conversation.title}
            </button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              aria-label={`Rename ${conversation.title}`}
              title="Rename"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOpen(true);
              }}
              disabled={isDeleting}
              aria-label={`Delete ${conversation.title}`}
              title="Delete chat"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>

      <DeleteConversationDialog
        open={deleteOpen}
        title={conversation.title}
        onOpenChange={setDeleteOpen}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        >
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
          <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
