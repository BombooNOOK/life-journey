/**
 * AI-X6.7C1.5A2-I3 — identity-safe ensureDefaultProfile unit tests.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import {
  ensureDefaultProfile,
  shouldFailClosedEmailBootstrapForTransientUnverifiedSession,
  shouldSkipEmailBootstrapForIdentityOwnedProfiles,
} from "@/lib/profile/activeProfile";

vi.mock("@/lib/account/p0IdentityWriteFields", () => ({
  resolveP0ProfileCreateIdentityFields: vi.fn(async () => ({})),
}));

beforeEach(() => {
  // Mode B — I3 / I3.7 identity-safe path under verified-auth ON.
  process.env[VERIFIED_AUTH_SESSION_FLAG] = "YES";
});
afterEach(() => {
  delete process.env[VERIFIED_AUTH_SESSION_FLAG];
});

function bound(
  identityId: string,
  emailMeta = "b@ljd.invalid",
): P0OwnershipResolution {
  return {
    state: "BOUND",
    identityId,
    firebaseUid: "uid-a",
    evidenceSource: "VERIFIED_FIREBASE_UID",
    legacyActorKeys: [],
    verifiedEmailMetadata: emailMeta,
    reason: "ok",
  };
}

function unbound(reason = "verified_session_required"): P0OwnershipResolution {
  return {
    state: "UNBOUND",
    identityId: null,
    firebaseUid: null,
    evidenceSource: "NONE",
    legacyActorKeys: [],
    verifiedEmailMetadata: "",
    reason,
  };
}

describe("shouldSkipEmailBootstrapForIdentityOwnedProfiles", () => {
  it("skips when BOUND and identity owns ≥1 profile", () => {
    expect(
      shouldSkipEmailBootstrapForIdentityOwnedProfiles({
        ownership: bound("id-a"),
        identityOwnedNonArchivedCount: 1,
      }),
    ).toBe(true);
  });

  it("does not skip when BOUND but zero identity-owned profiles", () => {
    expect(
      shouldSkipEmailBootstrapForIdentityOwnedProfiles({
        ownership: bound("id-a"),
        identityOwnedNonArchivedCount: 0,
      }),
    ).toBe(false);
  });

  it("does not skip when UNBOUND (legacy path)", () => {
    expect(
      shouldSkipEmailBootstrapForIdentityOwnedProfiles({
        ownership: unbound("identity_not_bound"),
        identityOwnedNonArchivedCount: 5,
      }),
    ).toBe(false);
  });
});

describe("ensureDefaultProfile identity-first", () => {
  const profile = {
    count: vi.fn(),
    create: vi.fn(),
  };
  // Minimal prisma surface for ensureDefaultProfile
  const db = { profile } as never;

  beforeEach(() => {
    profile.count.mockReset();
    profile.create.mockReset();
  });

  it("T_IDENTITY_PROFILE_PRECEDENCE: session B does not create when identity owns P1(email A)", async () => {
    profile.count.mockResolvedValueOnce(1);
    await ensureDefaultProfile("b@ljd.invalid", {
      db,
      resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
    });
    expect(profile.count).toHaveBeenCalledTimes(1);
    expect(profile.count).toHaveBeenCalledWith({
      where: { identityId: "id-a", isArchived: false },
    });
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("I3.7: verified_session_required fail-closes with zero INSERT", async () => {
    expect(
      shouldFailClosedEmailBootstrapForTransientUnverifiedSession(
        unbound("verified_session_required"),
      ),
    ).toBe(true);
    await ensureDefaultProfile("new@ljd.invalid", {
      db,
      resolveOwnership: async () => unbound("verified_session_required"),
    });
    expect(profile.count).not.toHaveBeenCalled();
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("T_LEGACY_UNBOUND: creates by email when identity_not_bound", async () => {
    profile.count.mockResolvedValueOnce(0);
    profile.create.mockResolvedValueOnce({ id: "legacy:x" });
    await ensureDefaultProfile("new@ljd.invalid", {
      db,
      resolveOwnership: async () => unbound("identity_not_bound"),
    });
    expect(profile.create).toHaveBeenCalledTimes(1);
    expect(profile.create.mock.calls[0]![0].data.email).toBe("new@ljd.invalid");
  });

  it("BOUND with no identity Profile falls through to email create", async () => {
    profile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    profile.create.mockResolvedValueOnce({ id: "legacy:y" });
    await ensureDefaultProfile("b@ljd.invalid", {
      db,
      resolveOwnership: async () => bound("id-a"),
    });
    expect(profile.count).toHaveBeenCalledTimes(2);
    expect(profile.create).toHaveBeenCalledTimes(1);
  });

  it("does not invent identity ownership when unbound", async () => {
    profile.count.mockResolvedValueOnce(1);
    await ensureDefaultProfile("a@ljd.invalid", {
      db,
      resolveOwnership: async () => unbound("identity_not_bound"),
    });
    expect(profile.create).not.toHaveBeenCalled();
    expect(profile.count).toHaveBeenCalledWith({
      where: { email: "a@ljd.invalid", isArchived: false },
    });
  });
});
