"use client";

import { LocalizedText } from "@/components/translation/LocalizedText";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/stores/conversationStore";
import type { LanguageCode } from "@/types/translation";
import { useState } from "react";

interface MessageTranslateMenuProps {
  originalText: string;
  className?: string;
}

/**
 * Shows translated text as the primary display when a non-English language is selected.
 * Replaces the old pattern that kept English above and translation in a separate card.
 */
export function MessageTranslateMenu({
  originalText,
  className,
}: MessageTranslateMenuProps) {
  const chatLanguage = useConversationStore((s) => s.language);
  const [overrideLanguage, setOverrideLanguage] = useState<LanguageCode | "">("");
  const targetLanguage = (overrideLanguage || chatLanguage) as LanguageCode;
  // Parent MessageRenderer already renders the message; only show a second line when
  // the farmer picks a different preview language from the dropdown.
  const showTranslatedPreview =
    overrideLanguage !== "" && overrideLanguage !== chatLanguage;

  if (!originalText.trim()) return null;

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <select
        value={overrideLanguage || chatLanguage}
        onChange={(e) => setOverrideLanguage(e.target.value as LanguageCode)}
        aria-label="Translation language"
        className="h-8 rounded-md border bg-background px-2 text-xs"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
            {lang.code === chatLanguage ? " (chat)" : ""}
          </option>
        ))}
      </select>
      {showTranslatedPreview && (
        <LocalizedText
          text={originalText}
          language={targetLanguage}
          showOriginal={false}
        />
      )}
    </div>
  );
}
