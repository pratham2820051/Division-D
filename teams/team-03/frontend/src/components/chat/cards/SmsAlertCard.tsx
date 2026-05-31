"use client";

import { BellRing, Copy, Loader2, RotateCcw, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import { getWhatsAppAlertText } from "@/lib/alert-text";
import { cn } from "@/lib/utils";
import {
  resolveVetWhatsAppPhone,
  shareAlertOnWhatsApp,
} from "@/lib/whatsapp-share";
import { useConversationStore } from "@/stores/conversationStore";
import type { SmsAlertPayload } from "@/types/message";
import type { LanguageCode } from "@/types/translation";

interface SmsAlertCardProps {
  payload: SmsAlertPayload;
  language?: LanguageCode;
  className?: string;
}

export function SmsAlertCard({ payload, language = "en", className }: SmsAlertCardProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const chatLanguage = useConversationStore((s) => s.language);
  const displayLanguage = language || chatLanguage;
  const voice = useVoiceOutput({ language: displayLanguage, autoPlay: false });
  const whatsappText = getWhatsAppAlertText(payload);
  const vetPhone = resolveVetWhatsAppPhone(payload.recipientPhone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShareWhatsApp = useCallback(() => {
    shareAlertOnWhatsApp(whatsappText, vetPhone || null);
    setToastMessage("Opening WhatsApp...");
  }, [whatsappText, vetPhone]);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-sky-50/80 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:to-sky-950/20",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-blue-200/50 bg-blue-100/50 px-4 py-2.5 dark:border-blue-900/30 dark:bg-blue-900/20">
          <BellRing className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <h3 className="text-sm font-semibold">Veterinary Alert Draft</h3>
          <span className="text-xs text-muted-foreground">WhatsApp ready</span>
          {payload.recipientHint && (
            <span className="ml-auto text-xs text-muted-foreground">
              To: {payload.recipientHint}
            </span>
          )}
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="rounded-xl border bg-background/80 p-3 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap break-words font-sans text-foreground">
              {whatsappText}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-[#25D366] text-white hover:bg-[#20BD5A]"
              onClick={handleShareWhatsApp}
            >
              <WhatsAppIcon />
              Share on WhatsApp
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onClick={() => void voice.speak(whatsappText, displayLanguage)}
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
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-destructive"
                onClick={() => void voice.retry()}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>

          {vetPhone && (
            <p className="text-xs text-muted-foreground">
              Share opens chat with vet ({vetPhone})
            </p>
          )}
        </div>
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
