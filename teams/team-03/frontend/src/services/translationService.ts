import { apiFetch } from "@/lib/api-client";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import {
  inferTextLanguage,
  isTranslationSuccessful,
  resolveTranslationPair,
} from "@/lib/translation-utils";
import type { LanguageCode, TranslationResponse } from "@/types/translation";

export interface TranslateRequest {
  text: string;
  target_language: LanguageCode;
  source_language?: LanguageCode;
}

interface TranslateApiResponse {
  translated_text: string;
  source_language: string;
  target_language: string;
}

/**
 * POST /api/v1/translation/translate
 */
export async function translateText(
  request: TranslateRequest,
): Promise<TranslationResponse> {
  const { text, target_language } = request;
  const source_language =
    request.source_language ?? inferTextLanguage(text);

  if (source_language === target_language) {
    return {
      translated_text: text,
      source_language,
      target_language,
    };
  }

  const data = await apiFetch<TranslateApiResponse>("/api/v1/translation/translate", {
    method: "POST",
    body: JSON.stringify({
      text,
      target_language,
      source_language: source_language === "en" ? undefined : source_language,
    }),
  });

  const response: TranslationResponse = {
    translated_text: data.translated_text,
    source_language: (data.source_language as LanguageCode) || source_language,
    target_language: (data.target_language as LanguageCode) || target_language,
  };

  if (typeof console !== "undefined") {
    console.info("[translation]", {
      source_language: response.source_language,
      target_language: response.target_language,
      translated_text: response.translated_text.slice(0, 200),
      success: isTranslationSuccessful(
        text,
        response.translated_text,
        target_language,
        source_language,
      ),
    });
  }

  return response;
}

/** Supported languages aligned with backend TargetLanguage enum. */
export async function getSupportedLanguages(): Promise<LanguageCode[]> {
  return SUPPORTED_LANGUAGES.map((l) => l.code);
}

export { resolveTranslationPair, isTranslationSuccessful, inferTextLanguage };
