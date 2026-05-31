"use client";

import { HelpCircle, Loader2, MessageSquare } from "lucide-react";

import { LocalizedText } from "@/components/translation/LocalizedText";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiagnosticQuestionPayload } from "@/types/message";
import type { LanguageCode } from "@/types/translation";

interface DiagnosticQuestionCardProps {
  payload: DiagnosticQuestionPayload;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  language?: LanguageCode;
  className?: string;
}

export function DiagnosticQuestionCard({
  payload,
  onAnswer,
  disabled = false,
  isSubmitting = false,
  language = "en",
  className,
}: DiagnosticQuestionCardProps) {
  const handleCustom = () => {
    const answer = window.prompt("Enter your answer:");
    if (answer?.trim()) {
      onAnswer(answer.trim());
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-purple-50/70 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:to-purple-950/20",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-violet-200/50 bg-violet-100/50 px-4 py-2.5 dark:border-violet-900/30 dark:bg-violet-900/20">
        <HelpCircle className="h-4 w-4 text-violet-700 dark:text-violet-300" />
        <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
          Diagnostic question
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <LocalizedText
          text={payload.question}
          language={language}
          className="text-base font-medium leading-snug text-foreground"
        />
        {payload.context && (
          <LocalizedText
            text={payload.context}
            language={language}
            className="text-xs leading-relaxed text-muted-foreground"
          />
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            onClick={() => onAnswer("Yes")}
            disabled={disabled || isSubmitting}
            className="h-10 w-full sm:min-w-[5rem] sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAnswer("No")}
            disabled={disabled || isSubmitting}
            className="h-10 w-full sm:min-w-[5rem] sm:w-auto"
          >
            No
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCustom}
            disabled={disabled || isSubmitting}
            className="col-span-2 h-10 gap-1 sm:col-span-1 sm:w-auto"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Custom answer
          </Button>
        </div>
      </div>
    </div>
  );
}
