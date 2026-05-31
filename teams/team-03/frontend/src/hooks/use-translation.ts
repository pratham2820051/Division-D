"use client";

import { useCallback, useEffect, useState } from "react";

import { translateText } from "@/services/translationService";
import type { LanguageCode } from "@/types/translation";

interface UseTranslationResult {
  translatedText: string | null;
  isLoading: boolean;
  error: string | null;
  translate: () => Promise<void>;
}

export function useTranslation(
  text: string,
  targetLanguage: LanguageCode,
  enabled = true,
): UseTranslationResult {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async () => {
    if (!text.trim() || targetLanguage === "en" || !enabled) {
      setTranslatedText(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await translateText({
        text,
        target_language: targetLanguage,
      });
      setTranslatedText(result.translated_text);
    } catch {
      setError("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [text, targetLanguage, enabled]);

  useEffect(() => {
    translate();
  }, [translate]);

  return { translatedText, isLoading, error, translate };
}
