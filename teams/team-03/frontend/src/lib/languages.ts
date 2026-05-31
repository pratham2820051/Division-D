import type { Language } from "@/types/translation";

/** UI + chat languages supported in PashuMitra demo. */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
];

export function getLanguageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

/** Normalize persisted or API language codes to supported set. */
export function normalizeUiLanguage(code: string | null | undefined): Language["code"] {
  const base = (code ?? "en").split("-")[0].toLowerCase();
  if (base === "hi" || base === "kn") return base;
  return "en";
}
