"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ArrowUp, Mic } from "lucide-react";

import { VoiceMode } from "@/components/voice/VoiceMode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";
import type { TranscribeResult } from "@/types/voice";

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceSend?: (message: string, result?: TranscribeResult) => void;
  language?: LanguageCode;
  isLoading?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ChatInput({
  onSend,
  onVoiceSend,
  language = "en",
  isLoading = false,
  placeholder = "Message PashuMitra AI...",
  value: controlledValue,
  onValueChange,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const value = controlledValue ?? internalValue;
  const setValue = onValueChange ?? setInternalValue;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const submit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleTranscription = async (text: string, result?: TranscribeResult) => {
    if (!text?.trim()) {
      return;
    }
    if (onVoiceSend) {
      await onVoiceSend(text.trim(), result);
      setVoiceModeOpen(false);
      setValue("");
    } else {
      setVoiceModeOpen(false);
      setValue(text.trim());
      adjustHeight();
    }
  };

  const handleMicClick = () => {
    if (!voiceModeOpen) {
      setVoiceModeOpen(true);
      return;
    }
    setVoiceModeOpen(false);
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-2 md:px-6">
      {voiceModeOpen && (
        <div className="mx-auto mb-3 max-w-3xl">
          <VoiceMode
            variant="inline"
            autoStartRecording
            language={language}
            onTranscription={handleTranscription}
            onClose={() => setVoiceModeOpen(false)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div
          className={cn(
            "chat-gradient-border flex items-end gap-2 rounded-3xl bg-background p-2 shadow-md",
            "focus-within:shadow-lg focus-within:ring-2 focus-within:ring-ring/20",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            disabled={isLoading}
            className={cn(
              "h-9 w-9 shrink-0 rounded-full",
              voiceModeOpen ? "bg-primary/10 text-primary" : "text-muted-foreground",
            )}
            aria-label={voiceModeOpen ? "Close voice mode" : "Start voice recording"}
          >
            <Mic className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />

          <Button
            type="submit"
            size="icon"
            disabled={!value.trim() || isLoading}
            className="h-9 w-9 shrink-0 rounded-full"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Tap mic to record · stop when done · message auto-sends · Enter for text
        </p>
      </form>
    </div>
  );
}
