"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { ChatLayout } from "@/components/chat/layout/ChatLayout";
import { ChatInput } from "@/components/chat/input/ChatInput";
import { MessageList } from "@/components/chat/messages/MessageList";
import { useChatOrchestration } from "@/hooks/use-chat-orchestration";
import { useConversationHydration } from "@/hooks/use-conversations";

export function ChatInterface() {
  const [draft, setDraft] = useState("");
  const isHydrated = useConversationHydration();

  const {
    messages,
    isLoading,
    error,
    language,
    sendMessage,
    sendVoiceMessage,
    answerDiagnosticQuestion,
    retryLastMessage,
  } = useChatOrchestration();

  const handleSuggestionClick = (text: string) => {
    setDraft(text);
  };

  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Loading conversations…</span>
      </div>
    );
  }

  return (
    <ChatLayout>
      <MessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSuggestionClick={handleSuggestionClick}
        onDiagnosticAnswer={answerDiagnosticQuestion}
        onRetry={retryLastMessage}
      />
      <ChatInput
        onSend={sendMessage}
        onVoiceSend={sendVoiceMessage}
        language={language}
        isLoading={isLoading}
        value={draft}
        onValueChange={setDraft}
      />
    </ChatLayout>
  );
}
