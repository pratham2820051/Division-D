import type { LanguageCode } from "@/types/translation";

const DEVANAGARI = /[\u0900-\u097F]/;
const KANNADA = /[\u0C80-\u0CFF]/;

/** Infer script-based language from message text. */
export function inferTextLanguage(text: string): LanguageCode {
  if (!text.trim()) return "en";
  if (KANNADA.test(text)) return "kn";
  if (DEVANAGARI.test(text)) return "hi";
  return "en";
}

export function looksLocalizedForLanguage(text: string, language: LanguageCode): boolean {
  if (language === "kn") return KANNADA.test(text);
  if (language === "hi") return DEVANAGARI.test(text);
  return language === "en";
}

/** True when API output is usable for the target language (not unchanged English). */
export function isTranslationSuccessful(
  original: string,
  translated: string,
  target: LanguageCode,
  source: LanguageCode,
): boolean {
  const orig = original.trim();
  const out = translated.trim();
  if (!out) return false;
  if (source === target) return true;
  if (out === orig) return false;

  if (target === "hi") return DEVANAGARI.test(out);
  if (target === "kn") return KANNADA.test(out);
  if (target === "en") {
    return !DEVANAGARI.test(out) && !KANNADA.test(out);
  }
  return out !== orig;
}

export function resolveTranslationPair(
  text: string,
  displayLanguage: LanguageCode,
): { source: LanguageCode; target: LanguageCode } {
  const inferred = inferTextLanguage(text);
  if (displayLanguage === "en") {
    return { source: inferred, target: "en" };
  }
  if (inferred === displayLanguage) {
    return { source: displayLanguage, target: displayLanguage };
  }
  return { source: inferred === "en" ? "en" : inferred, target: displayLanguage };
}

export function needsClientTranslation(
  text: string,
  displayLanguage: LanguageCode,
): boolean {
  if (!text.trim()) return false;
  const { source, target } = resolveTranslationPair(text, displayLanguage);
  if (source === target) return false;
  if (looksLocalizedForLanguage(text, target)) return false;
  return true;
}
