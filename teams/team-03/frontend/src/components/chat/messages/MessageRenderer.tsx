"use client";

import { Loader2, RotateCcw, Volume2 } from "lucide-react";

import { DiagnosticQuestionCard } from "@/components/chat/cards/DiagnosticQuestionCard";
import { DiseaseAnalysisCard } from "@/components/chat/cards/DiseaseAnalysisCard";
import { FirstAidMessageCard } from "@/components/chat/cards/FirstAidMessageCard";
import { SmsAlertCard } from "@/components/chat/cards/SmsAlertCard";
import { ChatAvatar } from "@/components/chat/messages/ChatAvatar";
import { LocalizedText } from "@/components/translation/LocalizedText";
import { MessageTranslateMenu } from "@/components/translation/MessageTranslateMenu";
import { VoicePlayer } from "@/components/voice/VoicePlayer";
import { Button } from "@/components/ui/button";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import { getMessageDisplayText } from "@/lib/conversation-utils";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/stores/conversationStore";
import type { Message } from "@/types/conversation";
import type {
  DiagnosticQuestionPayload,
  DiseaseAnalysisPayload,
  FirstAidPayload,
  SmsAlertPayload,
} from "@/types/message";

interface AssistantMessageShellProps {
  message: Message;
  children: React.ReactNode;
  showActions?: boolean;
}

function AssistantMessageShell({
  message,
  children,
  showActions = true,
}: AssistantMessageShellProps) {
  const chatLanguage = useConversationStore((s) => s.language);
  const voice = useVoiceOutput({ language: chatLanguage, autoPlay: false });
  const displayText = getMessageDisplayText(message);

  return (
    <article className="w-full bg-[hsl(var(--chat-assistant))]">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 md:px-6">
        <ChatAvatar role="assistant" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-1 text-xs font-semibold text-foreground">PashuMitra AI</p>
          <div className="space-y-3">{children}</div>
          {showActions && message.type === "text" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {chatLanguage === "en" && (
                <MessageTranslateMenu originalText={displayText} />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() => void voice.speak(displayText, chatLanguage)}
                disabled={voice.isLoading}
              >
                {voice.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                Listen
              </Button>
              {voice.error && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-destructive"
                  onClick={() => void voice.retry()}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </div>
          )}
          {voice.audioUrl && message.type === "text" && (
            <VoicePlayer src={voice.audioUrl} variant="compact" className="mt-2" />
          )}
        </div>
      </div>
    </article>
  );
}

interface MessageRendererProps {
  message: Message;
  onDiagnosticAnswer?: (answer: string) => void;
  isSubmitting?: boolean;
}

export function MessageRenderer({
  message,
  onDiagnosticAnswer,
  isSubmitting = false,
}: MessageRendererProps) {
  const chatLanguage = useConversationStore((s) => s.language);

  if (message.role === "user") {
    return (
      <article className="w-full bg-[hsl(var(--chat-user))]">
        <div className="mx-auto flex max-w-3xl justify-end px-4 py-4 md:px-6">
          <div
            className={cn(
              "max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground",
              message.type === "voice" && "ring-2 ring-primary/30",
            )}
          >
            {message.type === "voice" && (
              <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">Voice</p>
            )}
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </article>
    );
  }

  switch (message.type) {
    case "disease_analysis":
      return (
        <AssistantMessageShell message={message} showActions={false}>
          <DiseaseAnalysisCard
            payload={message.payload as unknown as DiseaseAnalysisPayload}
            language={chatLanguage}
            messageId={message.id}
          />
        </AssistantMessageShell>
      );

    case "first_aid":
      return (
        <AssistantMessageShell message={message} showActions={false}>
          <FirstAidMessageCard
            payload={message.payload as unknown as FirstAidPayload}
            language={chatLanguage}
          />
        </AssistantMessageShell>
      );

    case "sms_alert":
      return (
        <AssistantMessageShell message={message} showActions={false}>
          <SmsAlertCard
            payload={message.payload as unknown as SmsAlertPayload}
            language={chatLanguage}
          />
        </AssistantMessageShell>
      );

    case "diagnostic_question":
      return (
        <AssistantMessageShell message={message} showActions={false}>
          <DiagnosticQuestionCard
            payload={message.payload as unknown as DiagnosticQuestionPayload}
            onAnswer={(answer) => onDiagnosticAnswer?.(answer)}
            isSubmitting={isSubmitting}
            language={chatLanguage}
          />
        </AssistantMessageShell>
      );

    case "system":
      return (
        <AssistantMessageShell message={message}>
          <LocalizedText
            text={message.content}
            language={chatLanguage}
            className="text-sm italic text-muted-foreground"
          />
        </AssistantMessageShell>
      );

    default:
      return (
        <AssistantMessageShell message={message}>
          <LocalizedText
            text={message.content}
            language={chatLanguage}
            className="text-[15px] leading-7 text-foreground"
          />
        </AssistantMessageShell>
      );
  }
}
