/**
 * AI-X6.5A AccountSettings identity anchor — unit tests.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { planAccountSettingsIdentityBind } from "@/lib/account/planAccountSettingsIdentityBind";
import { resolveAccountSettingsByStableIdentity } from "@/lib/account/resolveAccountSettingsByStableIdentity";

describe("planAccountSettingsIdentityBind", () => {
  it("bindable when unbound settings email matches approved primary", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "a@example.com",
        candidateSettings: {
          id: "as-1",
          email: "a@example.com",
          identityId: null,
        },
        settingsAlreadyBoundToIdentity: null,
      }),
    ).toEqual({
      state: "bindable",
      identityId: "id-1",
      candidateSettingsId: "as-1",
    });
  });

  it("already_bound when settingsAlreadyBoundToIdentity present", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "a@example.com",
        candidateSettings: null,
        settingsAlreadyBoundToIdentity: { id: "as-1", email: "a@example.com" },
      }),
    ).toMatchObject({ state: "already_bound", candidateSettingsId: "as-1" });
  });

  it("no_account_settings when no candidate", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "a@example.com",
        candidateSettings: null,
        settingsAlreadyBoundToIdentity: null,
      }),
    ).toEqual({ state: "no_account_settings", identityId: "id-1" });
  });

  it("conflicting when candidate bound to other identity", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "a@example.com",
        candidateSettings: {
          id: "as-2",
          email: "a@example.com",
          identityId: "id-other",
        },
        settingsAlreadyBoundToIdentity: null,
      }),
    ).toMatchObject({ state: "conflicting_account_settings" });
  });

  it("review_required when email does not match approved primary (no inference)", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "approved@example.com",
        candidateSettings: {
          id: "as-1",
          email: "other@example.com",
          identityId: null,
        },
        settingsAlreadyBoundToIdentity: null,
      }),
    ).toMatchObject({ state: "review_required" });
  });

  it("ambiguous when already bound and different candidate supplied", () => {
    expect(
      planAccountSettingsIdentityBind({
        identityId: "id-1",
        primaryEmailNormalized: "a@example.com",
        candidateSettings: {
          id: "as-2",
          email: "a@example.com",
          identityId: null,
        },
        settingsAlreadyBoundToIdentity: { id: "as-1", email: "a@example.com" },
      }),
    ).toMatchObject({ state: "ambiguous" });
  });
});

describe("resolveAccountSettingsByStableIdentity", () => {
  const findUnique = vi.fn();
  const findMany = vi.fn();
  const settingsDb = {
    accountSettings: { findUnique, findMany },
  };

  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
  });

  it("H: verified_session_required", async () => {
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({ state: "verified_session_required" }),
      settingsDb: settingsDb as never,
    });
    expect(result).toEqual({ state: "verified_session_required" });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("resolved via identityId (email metadata change irrelevant)", async () => {
    findMany.mockResolvedValue([
      { id: "as-1", email: "new@example.com", identityId: "id-1" },
    ]);
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-1",
        identityId: "id-1",
        stableActorKey: "firebase:UID-1",
        actorLookupKeys: ["firebase:UID-1"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "new@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result).toEqual({
      state: "resolved",
      identityId: "id-1",
      firebaseUid: "UID-1",
      accountSettingsId: "as-1",
      emailMetadata: "new@example.com",
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { identityId: "id-1" },
      select: { id: true, email: true, identityId: true },
      take: 2,
    });
  });

  it("D: email-change — ownership follows identityId, not email string", async () => {
    findMany.mockResolvedValue([
      { id: "as-1", email: "new@example.com", identityId: "id-1" },
    ]);
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-1",
        identityId: "id-1",
        stableActorKey: "firebase:UID-1",
        actorLookupKeys: ["firebase:UID-1", "old@example.com"],
        legacyActorKeys: ["old@example.com"],
        verifiedEmailMetadata: "new@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result.state).toBe("resolved");
    if (result.state === "resolved") {
      expect(result.accountSettingsId).toBe("as-1");
      expect(result.emailMetadata).toBe("new@example.com");
    }
  });

  it("E: email reuse — ID-2 must not resolve ID-1 settings via current email", async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue({
      id: "as-owned-by-id1",
      email: "old@example.com",
      identityId: "id-1",
    });
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-2",
        identityId: "id-2",
        stableActorKey: "firebase:UID-2",
        actorLookupKeys: ["firebase:UID-2"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "old@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result).toEqual({
      state: "conflict",
      identityId: "id-2",
      firebaseUid: "UID-2",
      reason: "settings_bound_to_other_identity",
    });
  });

  it("F: stable identity + legacy email row bound elsewhere → fail closed", async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue({
      id: "as-foreign",
      email: "shared@example.com",
      identityId: "id-other",
    });
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-a",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: ["firebase:UID-A"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "shared@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result.state).toBe("conflict");
    if (result.state === "conflict") {
      expect(result.reason).toBe("settings_bound_to_other_identity");
    }
  });

  it("legacy_unbound when email row exists with identityId NULL (no auto-bind)", async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue({
      id: "as-legacy",
      email: "a@example.com",
      identityId: null,
    });
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-a",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: ["firebase:UID-A"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result).toEqual({
      state: "legacy_unbound",
      identityId: "id-a",
      firebaseUid: "UID-A",
      legacyAccountSettingsId: "as-legacy",
      legacyEmailMetadata: "a@example.com",
    });
  });

  it("G: new user identity with zero claims — not_found until settings created", async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-NEW",
        identityId: "id-new",
        stableActorKey: "firebase:UID-NEW",
        actorLookupKeys: ["firebase:UID-NEW"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "new@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result).toEqual({
      state: "not_found",
      identityId: "id-new",
      firebaseUid: "UID-NEW",
    });
  });

  it("I: never creates claims — settings lookup only", async () => {
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
    await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-a",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: ["firebase:UID-A"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(Object.keys(settingsDb.accountSettings)).toEqual([
      "findUnique",
      "findMany",
    ]);
  });

  it("conflict on multiple settings for same identity", async () => {
    findMany.mockResolvedValue([
      { id: "as-1", email: "a@example.com", identityId: "id-1" },
      { id: "as-2", email: "b@example.com", identityId: "id-1" },
    ]);
    const result = await resolveAccountSettingsByStableIdentity({
      resolveIdentity: async () => ({
        state: "resolved",
        firebaseUid: "UID-1",
        identityId: "id-1",
        stableActorKey: "firebase:UID-1",
        actorLookupKeys: ["firebase:UID-1"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@example.com",
      }),
      settingsDb: settingsDb as never,
    });
    expect(result).toMatchObject({
      state: "conflict",
      reason: "multiple_settings_for_identity",
    });
  });
});
