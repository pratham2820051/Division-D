"use client";

import { useEffect, useRef } from "react";

import { ChatEmptyState } from "@/components/chat/messages/ChatEmptyState";
import { MessageRenderer } from "@/components/chat/messages/MessageRenderer";
import { TypingIndicator } from "@/components/chat/messages/TypingIndicator";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types/conversation";
import type { ChatErrorState } from "@/types/conversation";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  error?: ChatErrorState | null;
  onSuggestionClick?: (text: string) => void;
  onDiagnosticAnswer?: (answer: string) => void;
  onRetry?: () => void;
}

export function MessageList({
  messages,
  isLoading = false,
  error = null,
  onSuggestionClick,
  onDiagnosticAnswer,
  onRetry,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ChatEmptyState onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {messages.map((message) => (
        <MessageRenderer
          key={message.id}
          message={message}
          onDiagnosticAnswer={onDiagnosticAnswer}
          isSubmitting={isLoading}
        />
      ))}

      {error && (
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="text-destructive">{error.message}</p>
            {error.retryable && onRetry && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={onRetry}
              >
                Retry sending
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading && messages.length > 0 && (
        <div className="bg-[hsl(var(--chat-assistant))]">
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
