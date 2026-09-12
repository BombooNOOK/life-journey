/**
 * AI-X6.7C1.5A2-I3.8 — AccountSettings identity-first forest resident (unit).
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import {
  ensureForestResidentForEmail,
  shouldFailClosedForestResidentForTransientUnverifiedSession,
} from "@/lib/forestResident/forestResidentNumber";

beforeEach(() => {
  // Mode B — I3.8 identity-safe path under verified-auth ON.
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
    verifiedEmailMetadata: "",
    reason,
  };
}

describe("shouldFailClosedForestResidentForTransientUnverifiedSession", () => {
  it("fail-closes only verified_session_required", () => {
    expect(
      shouldFailClosedForestResidentForTransientUnverifiedSession(
        unbound("verified_session_required"),
      ),
    ).toBe(true);
    expect(
      shouldFailClosedForestResidentForTransientUnverifiedSession(
        unbound("identity_not_bound"),
      ),
    ).toBe(false);
    expect(
      shouldFailClosedForestResidentForTransientUnverifiedSession(bound("id-a")),
    ).toBe(false);
  });
});

describe("ensureForestResidentForEmail I3.8", () => {
  const allocate = vi.fn(async () => "BN-000802999");
  const accountSettings = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const profile = { findFirst: vi.fn() };
  const db = { accountSettings, profile } as never;

  beforeEach(() => {
    allocate.mockClear();
    for (const fn of Object.values(accountSettings)) fn.mockReset();
    profile.findFirst.mockReset();
    profile.findFirst.mockResolvedValue(null);
  });

  it("T1/T2: BOUND returns identity-owned settings; no create/alloc", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findFirst.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: "id-a",
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
    });

    expect(card?.residentNumber).toBe("BN-000802079");
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.findFirst).toHaveBeenCalledWith({
      where: { identityId: "id-a" },
      select: expect.any(Object),
    });
  });

  it("T4: verified_session_required + no B row → null, zero alloc", async () => {
    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => unbound("verified_session_required"),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(accountSettings.findUnique).not.toHaveBeenCalled();
    expect(accountSettings.findFirst).not.toHaveBeenCalled();
  });

  it("T4B: verified_session_required + reused EMAIL-A identity-owned → null, no email lookup", async () => {
    const card = await ensureForestResidentForEmail("a@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => unbound("verified_session_required"),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.findUnique).not.toHaveBeenCalled();
    expect(accountSettings.findFirst).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(accountSettings.update).not.toHaveBeenCalled();
  });

  it("T4C: verified_session_required + null-identity issued row → null, no email lookup", async () => {
    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => unbound("verified_session_required"),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.findUnique).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(accountSettings.update).not.toHaveBeenCalled();
  });

  it("T5: identity_not_bound creates email bootstrap once", async () => {
    accountSettings.findUnique.mockResolvedValueOnce(null);
    const issuedAt = new Date("2026-02-01T00:00:00Z");
    accountSettings.create.mockResolvedValueOnce({
      id: "settings-new",
      email: "new@ljd.invalid",
      identityId: null,
      forestResidentNumber: "BN-000802999",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    const card = await ensureForestResidentForEmail("new@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => unbound("identity_not_bound"),
    });

    expect(card?.residentNumber).toBe("BN-000802999");
    expect(allocate).toHaveBeenCalledTimes(1);
    expect(accountSettings.create).toHaveBeenCalledTimes(1);
    expect(accountSettings.create.mock.calls[0]![0].data.identityId).toBeUndefined();
  });

  it("T6: BOUND ignores existing null-identity B row", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findFirst.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: "id-a",
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
    });

    expect(accountSettings.findUnique).not.toHaveBeenCalled();
    expect(accountSettings.update).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
  });

  it("T3: BOUND after A retired / B primary still returns canonical", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findFirst.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: "id-a",
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
    });
    expect(card?.residentNumber).toBe("BN-000802079");
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
  });

  it("T7: BOUND UID-B cannot claim EMAIL-A settings of UID-A", async () => {
    const { Prisma } = await import("@prisma/client");
    const err = new Prisma.PrismaClientKnownRequestError("Unique", {
      code: "P2002",
      clientVersion: "test",
    });
    accountSettings.findFirst
      .mockResolvedValueOnce(null) // initial by identity
      .mockResolvedValueOnce(null); // retry by identity after P2002
    accountSettings.create.mockRejectedValueOnce(err);
    accountSettings.findUnique.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: "id-a",
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: new Date(),
      forestResidentDisplayName: null,
      createdAt: new Date(),
    });

    const card = await ensureForestResidentForEmail("a@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => bound("id-b", "a@ljd.invalid"),
    });
    expect(card).toBeNull();
    expect(accountSettings.update).not.toHaveBeenCalled();
  });

  it("T8: concurrent BOUND hits do not allocate", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findFirst.mockResolvedValue({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: "id-a",
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });
    await Promise.all(
      Array.from({ length: 6 }, () =>
        ensureForestResidentForEmail("b@ljd.invalid", {
          db,
          allocateResidentNumber: allocate,
          resolveOwnership: async () => bound("id-a", "b@ljd.invalid"),
        }),
      ),
    );
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
  });

  it("AMBIGUOUS fail-closes with zero writes", async () => {
    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "AMBIGUOUS",
        identityId: null,
        firebaseUid: "uid",
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: "b@ljd.invalid",
        reason: "implicit_email_authority_detected",
      }),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
  });
});

describe("I3.8 T10/T11 call-graph (no AccountSettings writers)", () => {
  it("T10: first-visit-ready-context is read-only for AccountSettings", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/viewer/firstVisitReadyContext.ts",
      ),
      "utf8",
    );
    expect(src).toContain("accountSettings.findUnique");
    expect(src).not.toContain("ensureForestResidentForEmail");
    expect(src).not.toContain("accountSettings.create");
  });

  it("T11: orders/account settings page is findUnique-only", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/app/orders/account/page.tsx"),
      "utf8",
    );
    expect(src).toContain("accountSettings.findUnique");
    expect(src).not.toContain("ensureForestResidentForEmail");
    expect(src).not.toContain("accountSettings.create");
  });
});
