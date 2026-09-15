import { describe, expect, it } from "vitest";

import { mapEmailVerificationError } from "@/lib/auth/emailVerificationFlow";
import {
  EMAIL_VERIFICATION_ERROR_HEADING,
  EMAIL_VERIFICATION_SENT_HEADING,
  EMAIL_VERIFICATION_SENT_STEPS,
  EMAIL_VERIFICATION_TOO_MANY_REQUESTS_BODY,
  EMAIL_VERIFICATION_WELCOME_DISTINCT_ERROR,
  EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT,
  claimsVerificationEmailSent,
  resolveEmailVerificationPendingUi,
} from "@/lib/auth/emailVerificationPendingUi";

describe("emailVerificationPendingUi", () => {
  it("A: phase=sent shows sent success heading", () => {
    const ui = resolveEmailVerificationPendingUi({ phase: "sent" });
    expect(ui.heading).toBe(EMAIL_VERIFICATION_SENT_HEADING);
    expect(claimsVerificationEmailSent(ui)).toBe(true);
  });

  it("B: phase=error never claims verification email was sent", () => {
    const ui = resolveEmailVerificationPendingUi({
      phase: "error",
      errorMessage: "何か失敗しました",
    });
    expect(ui.heading).toBe(EMAIL_VERIFICATION_ERROR_HEADING);
    expect(claimsVerificationEmailSent(ui)).toBe(false);
    expect(ui.heading).not.toContain("送信しました");
    expect(JSON.stringify(ui)).not.toContain("確認メールを送信しました");
  });

  it("C: phase=error + too-many-requests shows cannot-send copy", () => {
    const mapped = mapEmailVerificationError({ code: "auth/too-many-requests", message: "x" });
    const ui = resolveEmailVerificationPendingUi({ phase: "error", errorMessage: mapped });
    expect(ui.heading).toBe(EMAIL_VERIFICATION_ERROR_HEADING);
    expect(ui.alertMessage).toBe(EMAIL_VERIFICATION_TOO_MANY_REQUESTS_BODY);
    expect(ui.alertMessage).toContain("再送");
    expect(claimsVerificationEmailSent(ui)).toBe(false);
  });

  it("D: sent state includes 3-step guidance", () => {
    const ui = resolveEmailVerificationPendingUi({ phase: "sent" });
    expect(ui.steps).toEqual([...EMAIL_VERIFICATION_SENT_STEPS]);
    expect(ui.steps).toHaveLength(3);
  });

  it("E: sent state distinguishes welcome from verification", () => {
    const ui = resolveEmailVerificationPendingUi({ phase: "sent" });
    expect(ui.welcomeDistinction).toBe(EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT);
    expect(ui.welcomeDistinction?.toLowerCase()).not.toContain("welcome-email");
  });

  it("F: error state clarifies welcome alone does not mean verified", () => {
    const ui = resolveEmailVerificationPendingUi({
      phase: "error",
      errorMessage: "失敗",
    });
    expect(ui.welcomeDistinction).toBe(EMAIL_VERIFICATION_WELCOME_DISTINCT_ERROR);
    expect(ui.welcomeDistinction).toContain("まだ完了していません");
  });

  it("G: raw Firebase error objects are not shown", () => {
    const mapped = mapEmailVerificationError({
      code: "auth/too-many-requests",
      message: "Quota exceeded for user secret@example.com",
    });
    const ui = resolveEmailVerificationPendingUi({ phase: "error", errorMessage: mapped });
    const blob = JSON.stringify(ui);
    expect(blob).not.toMatch(/Quota exceeded|secret@example\.com|auth\/too-many-requests/i);
  });

  it("H: raw email/UID/token are not shown", () => {
    const ui = resolveEmailVerificationPendingUi({
      phase: "error",
      errorMessage: mapEmailVerificationError({
        code: "auth/network-request-failed",
        message: "fail uid=ABC token=xyz email=a@b.c",
      }),
    });
    const blob = JSON.stringify(ui);
    expect(blob).not.toMatch(/uid=ABC|token=xyz|a@b\.c/i);
  });

  it("I: sent state makes check the primary action", () => {
    const ui = resolveEmailVerificationPendingUi({ phase: "sent" });
    expect(ui.primaryAction).toBe("check");
  });

  it("J: error state makes resend the primary action", () => {
    const ui = resolveEmailVerificationPendingUi({
      phase: "error",
      errorMessage: "失敗",
    });
    expect(ui.primaryAction).toBe("resend");
  });
});
