"use client";

import { useEffect, useMemo, useState } from "react";

import { TranslationLoading } from "@/components/translation/TranslationLoading";
import {
  isTranslationSuccessful,
  needsClientTranslation,
  resolveTranslationPair,
} from "@/lib/translation-utils";
import { translateText } from "@/services/translationService";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";

interface LocalizedTextProps {
  text: string;
  language?: LanguageCode;
  className?: string;
  showOriginal?: boolean;
  as?: "p" | "span" | "li";
}

export function LocalizedText({
  text,
  language = "en",
  className,
  showOriginal = false,
  as: Component = "p",
}: LocalizedTextProps) {
  const shouldTranslate = useMemo(
    () => needsClientTranslation(text, language),
    [text, language],
  );

  const [displayText, setDisplayText] = useState(() =>
    shouldTranslate ? "" : text,
  );
  const [isLoading, setIsLoading] = useState(shouldTranslate);
  const [error, setError] = useState<string | null>(null);
  const [usedTranslation, setUsedTranslation] = useState(false);

  useEffect(() => {
    if (!shouldTranslate) {
      setDisplayText(text);
      setUsedTranslation(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const { source, target } = resolveTranslationPair(text, language);

    async function load() {
      setIsLoading(true);
      setError(null);
      setDisplayText("");
      try {
        const result = await translateText({
          text,
          target_language: target,
          source_language: source,
        });
        if (cancelled) return;

        const ok = isTranslationSuccessful(
          text,
          result.translated_text,
          target,
          source,
        );

        if (ok && result.translated_text?.trim()) {
          setDisplayText(result.translated_text);
          setUsedTranslation(true);
          if (typeof console !== "undefined") {
            console.info("[LocalizedText]", {
              source_language: result.source_language,
              target_language: result.target_language,
              translated_text: result.translated_text.slice(0, 200),
            });
          }
        } else {
          setError("Translation unavailable — showing original.");
          setDisplayText(text);
          setUsedTranslation(false);
        }
      } catch {
        if (!cancelled) {
          setError("Translation unavailable.");
          setDisplayText(text);
          setUsedTranslation(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [text, language, shouldTranslate]);

  if (!shouldTranslate) {
    return <Component className={cn("whitespace-pre-wrap break-words", className)}>{text}</Component>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {isLoading && <TranslationLoading />}
      {error && !isLoading && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {!isLoading && displayText && (
        <Component className="whitespace-pre-wrap break-words">{displayText}</Component>
      )}
      {showOriginal && usedTranslation && !isLoading && (
        <p className="text-xs italic text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
