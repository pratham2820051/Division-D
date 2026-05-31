export type LanguageCode = "en" | "kn" | "hi";

export interface Language {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface TranslationRequest {
  text: string;
  target_language: LanguageCode;
  source_language?: LanguageCode;
}

export interface TranslationResponse {
  translated_text: string;
  source_language: LanguageCode;
  target_language: LanguageCode;
}
