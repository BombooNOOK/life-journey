/**
 * AI-X6-I3.9 — verified-auth gate hardening for forest resident (unit).
 *
 * Mode A (verified-auth OFF): legacy email path; no ownership resolve.
 * Mode B (verified-auth ON): preserves I3.8H fail-closed semantics.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import {
  ensureForestResidentForEmail,
  shouldFailClosedForestResidentForTransientUnverifiedSession,
} from "@/lib/forestResident/forestResidentNumber";

describe("ensureForestResidentForEmail I3.9 verified-auth gate", () => {
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
    allocate.mockClear();
    for (const fn of Object.values(accountSettings)) fn.mockReset();
    profile.findFirst.mockReset();
    profile.findFirst.mockResolvedValue(null);
    resolveOwnership.mockClear();
  });
  afterEach(() => {
    delete process.env[VERIFIED_AUTH_SESSION_FLAG];
  });

  it("Mode A OFF: existing email settings usable without ownership / lj_session", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findUnique.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: null,
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    const card = await ensureForestResidentForEmail("a@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership,
      isVerifiedAuthEnabled: () => false,
    });

    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(card?.residentNumber).toBe("BN-000802079");
    expect(accountSettings.findUnique).toHaveBeenCalledWith({
      where: { email: "a@ljd.invalid" },
      select: expect.any(Object),
    });
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
  });

  it("Mode A OFF via env default (no seam): existing email usable without ownership", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    accountSettings.findUnique.mockResolvedValueOnce({
      id: "settings-a",
      email: "a@ljd.invalid",
      identityId: null,
      forestResidentNumber: "BN-000802079",
      forestResidentIssuedAt: issuedAt,
      forestResidentDisplayName: null,
      createdAt: issuedAt,
    });

    const card = await ensureForestResidentForEmail("a@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership,
    });

    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(card?.residentNumber).toBe("BN-000802079");
    expect(accountSettings.findUnique).toHaveBeenCalledWith({
      where: { email: "a@ljd.invalid" },
      select: expect.any(Object),
    });
    expect(accountSettings.create).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
  });

  it("Mode A OFF: new email may allocate FRN via legacy path", async () => {
    const issuedAt = new Date("2026-02-01T00:00:00Z");
    accountSettings.findUnique.mockResolvedValueOnce(null);
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
      resolveOwnership,
      isVerifiedAuthEnabled: () => false,
    });

    expect(resolveOwnership).not.toHaveBeenCalled();
    expect(card?.residentNumber).toBe("BN-000802999");
    expect(accountSettings.create).toHaveBeenCalledTimes(1);
    expect(accountSettings.create.mock.calls[0]![0].data.identityId).toBeUndefined();
    expect(allocate).toHaveBeenCalledTimes(1);
  });

  it("Mode B ON: verified_session_required still returns null with zero email lookup (I3.8H)", async () => {
    expect(
      shouldFailClosedForestResidentForTransientUnverifiedSession({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    ).toBe(true);

    const card = await ensureForestResidentForEmail("b@ljd.invalid", {
      db,
      allocateResidentNumber: allocate,
      resolveOwnership,
      isVerifiedAuthEnabled: () => true,
    });

    expect(resolveOwnership).toHaveBeenCalledTimes(1);
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(accountSettings.findUnique).not.toHaveBeenCalled();
    expect(accountSettings.findFirst).not.toHaveBeenCalled();
    expect(accountSettings.create).not.toHaveBeenCalled();
  });
});
