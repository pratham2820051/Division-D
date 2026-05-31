"use client";

import { translateText } from "@/services/translationService";
import { TranslationLoading } from "@/components/translation/TranslationLoading";
import { getLanguageLabel } from "@/lib/languages";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

interface TranslatedContentProps {
  originalText: string;
  targetLanguage: LanguageCode;
  className?: string;
}

export function TranslatedContent({
  originalText,
  targetLanguage,
  className,
}: TranslatedContentProps) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (targetLanguage === "en") return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await translateText({
          text: originalText,
          target_language: targetLanguage,
        });
        if (!cancelled) setTranslatedText(result.translated_text);
      } catch {
        if (!cancelled) setError("Translation failed.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [originalText, targetLanguage]);

  if (targetLanguage === "en") return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
        <Languages className="h-3.5 w-3.5" />
        {getLanguageLabel(targetLanguage)}
      </div>

      {isLoading && <TranslationLoading />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isLoading && translatedText && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {translatedText}
        </p>
      )}
    </div>
  );
}
