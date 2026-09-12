/**
 * AI-X6-I3.9 — verified-auth gate hardening for Profile bootstrap (unit).
 *
 * Mode A (verified-auth OFF): legacy email bootstrap; no ownership resolve.
 * Mode B (verified-auth ON): preserves I3.7 fail-closed semantics.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import {
  ensureDefaultProfile,
  shouldFailClosedEmailBootstrapForTransientUnverifiedSession,
} from "@/lib/profile/activeProfile";

vi.mock("@/lib/account/p0IdentityWriteFields", () => ({
  resolveP0ProfileCreateIdentityFields: vi.fn(async () => ({})),
}));

describe("ensureDefaultProfile I3.9 verified-auth gate", () => {
  const profile = {
    count: vi.fn(),
    create: vi.fn(),
  };
  const db = { profile } as never;
  const resolveOwnership = vi.fn(async () => ({
    state: "UNBOUND" as const,
    identityId: null,
    firebaseUid: null,
    evidenceSource: "NONE" as const,
    legacyActorKeys: [] as string[],
    verifiedEmailMetadata: "",
    reason: "verified_session_required",
  }));

  beforeEach(() => {
    delete process.env[VERIFIED_AUTH_SESSION_FLAG];
    profile.count.mockReset();
    profile.create.mockReset();
    resolveOwnership.mockClear();
  });
  afterEach(() => {
    delete process.env[VERIFIED_AUTH_SESSION_FLAG];
  });

  it("Mode A OFF: verified_session_required ownership is never consulted; email bootstrap runs", async () => {
    profile.count.mockResolvedValueOnce(0);
    profile.create.mockResolvedValueOnce({ id: "legacy:x" });
    await ensureDefaultProfile("user@ljd.invalid", {
      db,
      resolveOwnership,
      isVerifiedAuthEnabled: () => false,
    });
    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(profile.count).toHaveBeenCalledWith({
      where: { email: "user@ljd.invalid", isArchived: false },
    });
    expect(profile.create).toHaveBeenCalledTimes(1);
    expect(profile.create.mock.calls[0]![0].data).toEqual({
      id: expect.stringMatching(/^legacy:/),
      email: "user@ljd.invalid",
      nickname: "メイン",
    });
    expect(profile.create.mock.calls[0]![0].data.identityId).toBeUndefined();
  });

  it("Mode A OFF: existing email Profile → no create, no ownership", async () => {
    profile.count.mockResolvedValueOnce(1);
    await ensureDefaultProfile("user@ljd.invalid", {
      db,
      resolveOwnership,
      isVerifiedAuthEnabled: () => false,
    });
    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("Mode A OFF via env default (no seam): production path skips ownership", async () => {
    profile.count.mockResolvedValueOnce(0);
    profile.create.mockResolvedValueOnce({ id: "legacy:x" });
    await ensureDefaultProfile("user@ljd.invalid", {
      db,
      resolveOwnership,
    });
    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(profile.count).toHaveBeenCalledWith({
      where: { email: "user@ljd.invalid", isArchived: false },
    });
    expect(profile.create).toHaveBeenCalledTimes(1);
    expect(profile.create.mock.calls[0]![0].data.identityId).toBeUndefined();
  });

  it("Mode B ON: verified_session_required still fail-closes (I3.7 preserved)", async () => {
    expect(
      shouldFailClosedEmailBootstrapForTransientUnverifiedSession({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    ).toBe(true);

    await ensureDefaultProfile("b@ljd.invalid", {
      db,
      resolveOwnership,
      isVerifiedAuthEnabled: () => true,
    });
    expect(resolveOwnership).toHaveBeenCalledTimes(1);
    expect(profile.count).not.toHaveBeenCalled();
    expect(profile.create).not.toHaveBeenCalled();
  });
});
