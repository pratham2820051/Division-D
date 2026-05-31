"use client";

import { Check, Loader2, MessageSquareText, Stethoscope, X } from "lucide-react";
import { useState } from "react";

import { LocalizedText } from "@/components/translation/LocalizedText";
import { SeverityBadge } from "@/components/triage/SeverityBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateSmsDraft } from "@/services/chatService";
import { useConversationStore } from "@/stores/conversationStore";
import type { DiseaseAnalysisPayload } from "@/types/message";
import type { LanguageCode } from "@/types/translation";

interface DiseaseAnalysisCardProps {
  payload: DiseaseAnalysisPayload;
  language?: LanguageCode;
  messageId?: string;
  className?: string;
}

export function DiseaseAnalysisCard({
  payload,
  language = "en",
  className,
}: DiseaseAnalysisCardProps) {
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const chatLanguage = useConversationStore((s) => s.language);
  const addMessage = useConversationStore((s) => s.addMessage);
  const hasSmsDraft = useConversationStore((s) => {
    if (!s.activeConversationId) return false;
    const chat = s.conversations.find((c) => c.id === s.activeConversationId);
    return chat?.messages.some((m) => m.type === "sms_alert") ?? false;
  });

  const [smsLoading, setSmsLoading] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);

  const diseases = Array.isArray(payload?.diseases) ? payload.diseases : [];
  const primary = diseases[0];

  if (!primary?.name) return null;

  const matchedSymptoms = primary.matchedSymptoms ?? [];
  const missingSymptoms = primary.missingSymptoms ?? [];
  const confidence = Math.min(100, Math.max(0, primary.confidence ?? 0));
  const displayLanguage = language || chatLanguage;

  const handleGenerateSms = async () => {
    if (!activeConversationId || hasSmsDraft) return;
    setSmsLoading(true);
    setSmsError(null);
    try {
      const result = await generateSmsDraft(activeConversationId, displayLanguage);
      addMessage(activeConversationId, result.assistantMessage);
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : "Could not generate SMS draft.");
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/80 shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/20",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-amber-200/50 bg-amber-100/50 px-4 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/20">
        <Stethoscope className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        <h3 className="text-sm font-semibold text-foreground">Disease Analysis</h3>
        <div className="ml-auto">
          <SeverityBadge severity={payload?.severity ?? null} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <LocalizedText
            text={primary.name}
            language={displayLanguage}
            className="text-lg font-semibold leading-snug text-foreground"
          />
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span className="font-semibold text-foreground">{confidence}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {matchedSymptoms.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Matched symptoms
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {matchedSymptoms.map((symptom) => (
                <li
                  key={symptom}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                >
                  <Check className="h-3 w-3 shrink-0" />
                  <LocalizedText text={symptom} language={displayLanguage} as="span" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingSymptoms.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Missing symptoms
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {missingSymptoms.map((symptom) => (
                <li
                  key={symptom}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3 shrink-0" />
                  <LocalizedText text={symptom} language={displayLanguage} as="span" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {diseases.length > 1 && (
          <div className="border-t border-amber-200/50 pt-3 dark:border-amber-900/30">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Other candidates</p>
            <ul className="space-y-2 text-sm">
              {diseases.slice(1).map((d) => (
                <li key={d.name} className="flex items-start justify-between gap-3">
                  <LocalizedText
                    text={d.name}
                    language={displayLanguage}
                    className="min-w-0 break-words"
                  />
                  <span className="shrink-0 font-medium text-muted-foreground">{d.confidence}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-amber-200/50 pt-3 dark:border-amber-900/30">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void handleGenerateSms()}
            disabled={smsLoading || hasSmsDraft || !activeConversationId}
          >
            {smsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquareText className="h-4 w-4" />
            )}
            {hasSmsDraft ? "SMS draft generated" : "Generate SMS Draft"}
          </Button>
          {smsError && (
            <p className="mt-2 text-xs text-destructive">{smsError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
