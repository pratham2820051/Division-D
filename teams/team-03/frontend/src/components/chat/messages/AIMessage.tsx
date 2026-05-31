"use client";

import { Loader2, RotateCcw, Volume2 } from "lucide-react";

import { ChatAvatar } from "@/components/chat/messages/ChatAvatar";
import { MessageTranslateMenu } from "@/components/translation/MessageTranslateMenu";
import { VoicePlayer } from "@/components/voice/VoicePlayer";
import { Button } from "@/components/ui/button";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import type { Message } from "@/types/conversation";

interface AIMessageProps {
  message: Message;
}

export function AIMessage({ message }: AIMessageProps) {
  const voice = useVoiceOutput({ autoPlay: true });

  const handleListen = () => {
    void voice.speak(message.content);
  };

  return (
    <article className="w-full bg-[hsl(var(--chat-assistant))]">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 md:px-6">
        <ChatAvatar role="assistant" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-1 text-xs font-semibold text-foreground">
            PashuMitra AI
          </p>
          <div className="space-y-1">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground">
              {message.content}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <MessageTranslateMenu originalText={message.content} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={handleListen}
                disabled={voice.isLoading}
                aria-label="Listen to response"
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
            {voice.audioUrl && !voice.error && (
              <VoicePlayer
                src={voice.audioUrl}
                variant="compact"
                autoPlay={false}
                className="mt-1"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
