"use client";

import { HeartPulse } from "lucide-react";

import { LocalizedText } from "@/components/translation/LocalizedText";
import { SeverityBadge } from "@/components/triage/SeverityBadge";
import { cn } from "@/lib/utils";
import type { FirstAidPayload } from "@/types/message";
import type { LanguageCode } from "@/types/translation";

interface FirstAidMessageCardProps {
  payload: FirstAidPayload;
  language?: LanguageCode;
  className?: string;
}

export function FirstAidMessageCard({
  payload,
  language = "en",
  className,
}: FirstAidMessageCardProps) {
  const steps = payload.instructions ?? [];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-green-200/70 bg-gradient-to-br from-green-50 to-emerald-50/80 shadow-sm dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-green-200/50 bg-green-100/50 px-4 py-2.5 dark:border-green-900/30 dark:bg-green-900/20">
        <HeartPulse className="h-4 w-4 text-green-700 dark:text-green-300" />
        <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
          First-aid instructions
        </h3>
        {payload.severity && (
          <div className="ml-auto">
            <SeverityBadge severity={payload.severity} />
          </div>
        )}
      </div>
      <ol className="list-decimal space-y-2.5 px-4 py-4 pl-8 text-sm leading-relaxed text-foreground sm:px-5 sm:py-5">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`} className="break-words pl-1">
            <LocalizedText text={step} language={language} as="span" />
          </li>
        ))}
      </ol>
    </div>
  );
}
