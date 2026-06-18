import { describe, expect, it } from "vitest";

import { validateGuestSupportInquiryInput } from "@/lib/support/createGuestSupportInquiry";

describe("validateGuestSupportInquiryInput", () => {
  it("accepts valid guest inquiry", () => {
    const result = validateGuestSupportInquiryInput({
      email: " Guest@Example.com ",
      category: "other",
      message: "  質問です。 ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("guest@example.com");
      expect(result.message).toBe("質問です。");
    }
  });

  it("rejects profile deletion category for guests", () => {
    const result = validateGuestSupportInquiryInput({
      email: "guest@example.com",
      category: "profile_deletion",
      message: "削除したい",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_CATEGORY");
    }
  });

  it("rejects invalid email", () => {
    const result = validateGuestSupportInquiryInput({
      email: "not-an-email",
      category: "other",
      message: "質問です",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_EMAIL");
    }
  });
});
