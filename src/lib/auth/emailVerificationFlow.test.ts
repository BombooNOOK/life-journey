import { describe, expect, it, vi } from "vitest";

import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  checkEmailVerificationStatus,
  createEmailVerificationController,
  mapEmailVerificationError,
  shouldSkipVerifiedAuthCompletion,
} from "@/lib/auth/emailVerificationFlow";

function mockUser(overrides: {
  emailVerified: boolean;
  providers?: string[];
  reload?: () => Promise<void>;
  getIdToken?: (force?: boolean) => Promise<string>;
}) {
  return {
    emailVerified: overrides.emailVerified,
    providerData: (overrides.providers ?? ["password"]).map((providerId) => ({ providerId })),
    reload: overrides.reload ?? (async () => undefined),
    getIdToken: overrides.getIdToken ?? (async () => "token"),
  };
}

describe("emailVerificationFlow", () => {
  it("A: signup sendVerification is called exactly once via controller.send", async () => {
    const sendVerification = vi.fn(async () => undefined);
    const controller = createEmailVerificationController({ sendVerification });
    const user = mockUser({ emailVerified: false });
    const first = await controller.send(user);
    expect(first).toEqual({ ok: true });
    expect(sendVerification).toHaveBeenCalledTimes(1);
  });

  it("B: emailVerified=false skips verified completion path", () => {
    expect(
      shouldSkipVerifiedAuthCompletion(
        mockUser({ emailVerified: false, providers: ["password"] }),
      ),
    ).toBe(true);
  });

  it("C: after reload emailVerified=true becomes verified and refreshes token", async () => {
    const user = mockUser({
      emailVerified: false,
      reload: async () => {
        user.emailVerified = true;
      },
      getIdToken: vi.fn(async (force?: boolean) => {
        expect(force).toBe(true);
        return "fresh";
      }),
    });
    const result = await checkEmailVerificationStatus(user);
    expect(result).toEqual({ status: "verified", refreshedToken: true });
    expect(user.getIdToken).toHaveBeenCalledWith(true);
  });

  it("D: after reload false stays pending and does not refresh token", async () => {
    const getIdToken = vi.fn(async () => "token");
    const user = mockUser({
      emailVerified: false,
      reload: async () => {
        user.emailVerified = false;
      },
      getIdToken,
    });
    const result = await checkEmailVerificationStatus(user);
    expect(result).toEqual({ status: "pending" });
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it("E: getIdToken(true) only after verified", async () => {
    const getIdToken = vi.fn(async () => "fresh");
    const pending = mockUser({ emailVerified: false, getIdToken });
    await checkEmailVerificationStatus(pending);
    expect(getIdToken).not.toHaveBeenCalled();

    const verified = mockUser({
      emailVerified: false,
      reload: async () => {
        verified.emailVerified = true;
      },
      getIdToken,
    });
    await checkEmailVerificationStatus(verified);
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledWith(true);
  });

  it("F: resend cooldown blocks rapid resend / concurrent send", async () => {
    let now = 1_000_000;
    const sendVerification = vi.fn(async () => undefined);
    const controller = createEmailVerificationController({
      sendVerification,
      nowMs: () => now,
    });
    const user = mockUser({ emailVerified: false });
    expect((await controller.send(user)).ok).toBe(true);
    expect(sendVerification).toHaveBeenCalledTimes(1);

    const blocked = await controller.send(user);
    expect(blocked.ok).toBe(false);
    expect(sendVerification).toHaveBeenCalledTimes(1);

    now += EMAIL_VERIFICATION_RESEND_COOLDOWN_MS + 1;
    expect((await controller.send(user)).ok).toBe(true);
    expect(sendVerification).toHaveBeenCalledTimes(2);
  });

  it("G: resend error maps to safe message without raw firebase / email dump", async () => {
    const sendVerification = vi.fn(async () => {
      throw {
        code: "auth/too-many-requests",
        message: "Quota exceeded for user secret@example.com token=abc",
      };
    });
    const controller = createEmailVerificationController({ sendVerification });
    const result = await controller.send(mockUser({ emailVerified: false }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).not.toMatch(/secret@example\.com|token=abc|Quota exceeded/i);
    expect(result.message).toContain("上限");

    const mapped = mapEmailVerificationError({
      code: "auth/network-request-failed",
      message: "raw dump uid=XYZ",
    });
    expect(mapped).not.toMatch(/uid=XYZ|raw dump/i);
  });

  it("H: Google/provider existing flow is not skipped when verified or federated", () => {
    expect(
      shouldSkipVerifiedAuthCompletion(
        mockUser({ emailVerified: true, providers: ["password"] }),
      ),
    ).toBe(false);
    expect(
      shouldSkipVerifiedAuthCompletion(
        mockUser({ emailVerified: true, providers: ["google.com"] }),
      ),
    ).toBe(false);
    expect(
      shouldSkipVerifiedAuthCompletion(
        mockUser({ emailVerified: false, providers: ["google.com"] }),
      ),
    ).toBe(false);
  });

  it("I: welcome-email path is separate — verification helper never mentions welcome", () => {
    const msg = mapEmailVerificationError({ code: "auth/too-many-requests", message: "x" });
    expect(msg.toLowerCase()).not.toContain("welcome");
  });

  it("J: unverified password user is blocked from Identity Binding completion helper", () => {
    expect(
      shouldSkipVerifiedAuthCompletion(
        mockUser({ emailVerified: false, providers: ["password"] }),
      ),
    ).toBe(true);
  });
});
