/**
 * AI-X6.7C1.5A2-I3.7 — transition-gap Profile bootstrap fail-closed (unit).
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import {
  ensureDefaultProfile,
  shouldFailClosedEmailBootstrapForTransientUnverifiedSession,
} from "@/lib/profile/activeProfile";

vi.mock("@/lib/account/p0IdentityWriteFields", () => ({
  resolveP0ProfileCreateIdentityFields: vi.fn(async () => ({})),
}));

beforeEach(() => {
  // Mode B — I3.7 fail-closed under verified-auth ON.
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
    reason: "verified_uid_identity_bound",
  };
}

function unbound(reason: string): P0OwnershipResolution {
  return {
    state: "UNBOUND",
    identityId: null,
    firebaseUid: reason === "identity_not_bound" ? "uid-new" : null,
    evidenceSource: "NONE",
    legacyActorKeys: [],
    verifiedEmailMetadata: reason === "identity_not_bound" ? "new@ljd.invalid" : "",
    reason,
  };
}

describe("shouldFailClosedEmailBootstrapForTransientUnverifiedSession", () => {
  it("fail-closes only verified_session_required", () => {
    expect(
      shouldFailClosedEmailBootstrapForTransientUnverifiedSession(
        unbound("verified_session_required"),
      ),
    ).toBe(true);
    expect(
      shouldFailClosedEmailBootstrapForTransientUnverifiedSession(
        unbound("identity_not_bound"),
      ),
    ).toBe(false);
    expect(
      shouldFailClosedEmailBootstrapForTransientUnverifiedSession(bound("id-a")),
    ).toBe(false);
  });
});

describe("ensureDefaultProfile I3.7 transition-gap", () => {
  const profile = {
    count: vi.fn(),
    create: vi.fn(),
  };
  const db = { profile } as never;

  beforeEach(() => {
    profile.count.mockReset();
    profile.create.mockReset();
  });

  it("T6: verified_session_required → zero Profile INSERT", async () => {
    await ensureDefaultProfile("b@ljd.invalid", {
      db,
      resolveOwnership: async () => unbound("verified_session_required"),
    });
    expect(profile.count).not.toHaveBeenCalled();
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("T7: identity_not_bound preserves email bootstrap", async () => {
    profile.count.mockResolvedValueOnce(0);
    profile.create.mockResolvedValueOnce({ id: "legacy:x" });
    await ensureDefaultProfile("new@ljd.invalid", {
      db,
      resolveOwnership: async () => unbound("identity_not_bound"),
    });
    expect(profile.create).toHaveBeenCalledTimes(1);
    expect(profile.create.mock.calls[0]![0].data.email).toBe("new@ljd.invalid");
  });

  it("T2: BOUND session B does not create when identity owns Profile A", async () => {
    profile.count.mockResolvedValueOnce(1);
    await ensureDefaultProfile("b@ljd.invalid", {
      db,
      resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
    });
    expect(profile.create).not.toHaveBeenCalled();
  });

  it("T8: concurrent verified_session_required → zero creates", async () => {
    await Promise.all(
      Array.from({ length: 8 }, () =>
        ensureDefaultProfile("b@ljd.invalid", {
          db,
          resolveOwnership: async () => unbound("verified_session_required"),
        }),
      ),
    );
    expect(profile.create).not.toHaveBeenCalled();
  });
});
