import { describe, expect, it } from "vitest";

import {
  isSupportInquiryCategory,
  truncateSupportInquiryMessagePreview,
} from "@/lib/support/supportInquiryTypes";
import { validateSupportInquiryInput } from "@/lib/support/createSupportInquiry";

describe("validateSupportInquiryInput", () => {
  it("accepts valid category and message", () => {
    const result = validateSupportInquiryInput({
      category: "profile_deletion",
      message: "  プロフィール削除をお願いします。 ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.category).toBe("profile_deletion");
      expect(result.message).toBe("プロフィール削除をお願いします。");
    }
  });

  it("rejects invalid category", () => {
    const result = validateSupportInquiryInput({
      category: "unknown",
      message: "test",
    });
    expect(result).toEqual({
      ok: false,
      code: "INVALID_CATEGORY",
      error: "お問い合わせ種別を選択してください。",
    });
  });

  it("rejects empty message", () => {
    const result = validateSupportInquiryInput({
      category: "other",
      message: "   ",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMPTY_MESSAGE");
    }
  });

  it("rejects message over 4000 chars", () => {
    const result = validateSupportInquiryInput({
      category: "other",
      message: "a".repeat(4001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MESSAGE_TOO_LONG");
    }
  });
});

describe("supportInquiryTypes helpers", () => {
  it("recognizes all categories", () => {
    expect(isSupportInquiryCategory("profile_deletion")).toBe(true);
    expect(isSupportInquiryCategory("backup_restore")).toBe(true);
    expect(isSupportInquiryCategory("invalid")).toBe(false);
  });

  it("truncates message preview", () => {
    expect(truncateSupportInquiryMessagePreview("短い")).toBe("短い");
    expect(truncateSupportInquiryMessagePreview("a".repeat(100))).toBe(`${"a".repeat(80)}…`);
  });
});
