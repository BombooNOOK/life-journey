import { describe, expect, it } from "vitest";

import { validateSupportInquiryMessageBody } from "@/lib/support/validateSupportInquiryMessageBody";

describe("validateSupportInquiryMessageBody", () => {
  it("accepts trimmed message", () => {
    const result = validateSupportInquiryMessageBody("  追加の質問です。 ");
    expect(result).toEqual({ ok: true, body: "追加の質問です。" });
  });

  it("rejects empty message", () => {
    const result = validateSupportInquiryMessageBody("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMPTY_MESSAGE");
    }
  });

  it("rejects message over 4000 chars", () => {
    const result = validateSupportInquiryMessageBody("a".repeat(4001));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MESSAGE_TOO_LONG");
    }
  });
});
