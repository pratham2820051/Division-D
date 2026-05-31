import { describe, expect, it } from "vitest";

import { resolveDispatchMessageLanguage } from "@/lib/chat-dispatch-language";
import type { Conversation } from "@/types/conversation";

function conversation(language: Conversation["language"]): Conversation {
  return {
    id: "chat-1",
    title: "Test",
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
    language,
  };
}

describe("resolveDispatchMessageLanguage", () => {
  it("uses conversation.language when options.language is omitted", () => {
    expect(
      resolveDispatchMessageLanguage(conversation("kn"), "en"),
    ).toBe("kn");
  });

  it("prefers explicit options.language over conversation.language", () => {
    expect(
      resolveDispatchMessageLanguage(conversation("kn"), "en", {
        language: "hi",
      }),
    ).toBe("hi");
  });

  it("falls back to store language when conversation is missing", () => {
    expect(resolveDispatchMessageLanguage(null, "hi")).toBe("hi");
  });

  it("resolves language for diagnostic yes/no using conversation.language", () => {
    expect(resolveDispatchMessageLanguage(conversation("hi"), "en")).toBe("hi");
    expect(resolveDispatchMessageLanguage(conversation("kn"), "en")).toBe("kn");
  });

  it("does not throw when conversation is undefined (safe lookup order)", () => {
    expect(() => resolveDispatchMessageLanguage(undefined, "en")).not.toThrow();
  });
});
