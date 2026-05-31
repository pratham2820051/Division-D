import { describe, expect, it } from "vitest";

import {
  buildWhatsAppShareUrl,
  normalizeWhatsAppPhone,
  resolveVetWhatsAppPhone,
} from "@/lib/whatsapp-share";

describe("normalizeWhatsAppPhone", () => {
  it("keeps digits only", () => {
    expect(normalizeWhatsAppPhone("+91 98765 43210")).toBe("919876543210");
  });

  it("returns empty for blank", () => {
    expect(normalizeWhatsAppPhone("  ")).toBe("");
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("builds generic share link without phone", () => {
    const url = buildWhatsAppShareUrl("Hello vet", null);
    expect(url).toBe("https://wa.me/?text=Hello%20vet");
  });

  it("builds link with vet phone", () => {
    const url = buildWhatsAppShareUrl("Alert body", "+919876543210");
    expect(url).toBe("https://wa.me/919876543210?text=Alert%20body");
  });

  it("encodes newlines in draft text", () => {
    const url = buildWhatsAppShareUrl("Line1\nLine2", "919876543210");
    expect(url).toContain("text=Line1%0ALine2");
    expect(url).toContain("/919876543210?");
  });
});

describe("resolveVetWhatsAppPhone", () => {
  it("prefers payload phone over env", () => {
    expect(resolveVetWhatsAppPhone("919111111111", "919999999999")).toBe(
      "919111111111",
    );
  });

  it("falls back to env when payload empty", () => {
    expect(resolveVetWhatsAppPhone(undefined, "+91 8888888888")).toBe(
      "918888888888",
    );
  });
});
