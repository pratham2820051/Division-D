import { describe, expect, it } from "vitest";

import {
  inferTextLanguage,
  isTranslationSuccessful,
  needsClientTranslation,
} from "@/lib/translation-utils";

describe("translation-utils", () => {
  it("infers Hindi from Devanagari script", () => {
    expect(inferTextLanguage("बुखार")).toBe("hi");
  });

  it("infers Kannada from Kannada script", () => {
    expect(inferTextLanguage("ಜ್ವರ")).toBe("kn");
  });

  it("requires translation for English text when display language is Hindi", () => {
    expect(
      needsClientTranslation("Based on fever, Mastitis is one possibility.", "hi"),
    ).toBe(true);
  });

  it("rejects unchanged English as successful Hindi translation", () => {
    const original = "Based on fever";
    expect(
      isTranslationSuccessful(original, original, "hi", "en"),
    ).toBe(false);
  });

  it("accepts Devanagari output for Hindi target", () => {
    expect(
      isTranslationSuccessful("fever", "बुखार", "hi", "en"),
    ).toBe(true);
  });
});
