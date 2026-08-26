/**
 * AI-X6.2 Journal identity shadow diagnostics — unit tests.
 *
 * Observe only: never alters authority. No PII in emitted reports.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  IDENTITY_SHADOW_DIAGNOSTICS_FLAG,
  isIdentityShadowDiagnosticsEnabled,
} from "@/lib/auth/identityShadowDiagnosticsGate";
import { compareLegacyCookieActorToStableResolution } from "@/lib/auth/journalIdentityShadowCompare";
import { observeJournalIdentityShadow } from "@/lib/auth/observeJournalIdentityShadow";
import type { ResolveVerifiedViewerActorIdentityResult } from "@/lib/auth/resolveVerifiedViewerActorIdentity";

describe("identityShadowDiagnosticsGate", () => {
  it("defaults OFF", () => {
    expect(isIdentityShadowDiagnosticsEnabled({})).toBe(false);
    expect(
      isIdentityShadowDiagnosticsEnabled({
        [IDENTITY_SHADOW_DIAGNOSTICS_FLAG]: "",
      }),
    ).toBe(false);
    expect(
      isIdentityShadowDiagnosticsEnabled({
        [IDENTITY_SHADOW_DIAGNOSTICS_FLAG]: "true",
      }),
    ).toBe(false);
  });

  it("accepts YES|1", () => {
    expect(
      isIdentityShadowDiagnosticsEnabled({
        [IDENTITY_SHADOW_DIAGNOSTICS_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isIdentityShadowDiagnosticsEnabled({
        [IDENTITY_SHADOW_DIAGNOSTICS_FLAG]: "1",
      }),
    ).toBe(true);
  });
});

describe("compareLegacyCookieActorToStableResolution", () => {
  it("G: verified_session_required", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "user@example.com",
      stableResolution: { state: "verified_session_required" },
    });
    expect(result.state).toBe("verified_session_required");
    expect(result.cookieActorAuthorized).toBe(false);
    expect(result.hasVerifiedSession).toBe(false);
    expect(result.identityBound).toBe(false);
  });

  it("F: identity_not_bound", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "user@example.com",
      stableResolution: {
        state: "identity_not_bound",
        firebaseUid: "UID-NEW",
        verifiedEmailMetadata: "user@example.com",
      },
    });
    expect(result.state).toBe("identity_not_bound");
    expect(result.hasVerifiedSession).toBe(true);
    expect(result.identityBound).toBe(false);
    expect(result.cookieActorAuthorized).toBe(false);
  });

  it("H: identity_incomplete fail-closed", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "user@example.com",
      stableResolution: {
        state: "identity_incomplete",
        firebaseUid: "UID-A",
        identityId: "id-1",
        verifiedEmailMetadata: "user@example.com",
        reason: "identity_row_invalid",
      },
    });
    expect(result.state).toBe("identity_incomplete");
    expect(result.cookieActorAuthorized).toBe(false);
  });

  it("C: cookie equals stable firebase actorKey", () => {
    const resolved: ResolveVerifiedViewerActorIdentityResult = {
      state: "resolved",
      firebaseUid: "UID-A",
      identityId: "id-1",
      stableActorKey: "firebase:UID-A",
      actorLookupKeys: ["firebase:UID-A"],
      legacyActorKeys: [],
      verifiedEmailMetadata: "now@example.com",
    };
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "firebase:UID-A",
      stableResolution: resolved,
    });
    expect(result.state).toBe("stable_resolved_cookie_is_stable");
    expect(result.cookieActorKind).toBe("stable");
    expect(result.cookieActorAuthorized).toBe(true);
  });

  it("B: cookie equals explicit legacy claim", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "old@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-1",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: ["firebase:UID-A", "old@example.com"],
        legacyActorKeys: ["old@example.com"],
        verifiedEmailMetadata: "old@example.com",
      },
    });
    expect(result.state).toBe("stable_resolved_cookie_is_explicit_legacy_claim");
    expect(result.cookieActorKind).toBe("explicit_legacy_claim");
    expect(result.cookieActorAuthorized).toBe(true);
    expect(result.legacyClaimCount).toBe(1);
  });

  it("D: email-change mismatch — new cookie not in stable key set", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "new@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-1",
        identityId: "id-1",
        stableActorKey: "firebase:UID-1",
        actorLookupKeys: ["firebase:UID-1", "old@example.com"],
        legacyActorKeys: ["old@example.com"],
        verifiedEmailMetadata: "new@example.com",
      },
    });
    expect(result.state).toBe("stable_resolved_cookie_not_authorized");
    expect(result.cookieActorKind).toBe("unauthorized");
    expect(result.cookieActorAuthorized).toBe(false);
    expect(result.identityBound).toBe(true);
    expect(result.legacyClaimCount).toBe(1);
  });

  it("E: email-reuse — UID-2 cookie old@ with no claim is unauthorized", () => {
    const uid1 = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "new-for-uid1@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-1",
        identityId: "id-1",
        stableActorKey: "firebase:UID-1",
        actorLookupKeys: ["firebase:UID-1", "old@example.com"],
        legacyActorKeys: ["old@example.com"],
        verifiedEmailMetadata: "new-for-uid1@example.com",
      },
    });
    expect(uid1.state).toBe("stable_resolved_cookie_not_authorized");

    const uid2WithClaimOnUid1Email = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "old@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-2",
        identityId: "id-2",
        stableActorKey: "firebase:UID-2",
        actorLookupKeys: ["firebase:UID-2"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "old@example.com",
      },
    });
    expect(uid2WithClaimOnUid1Email.state).toBe(
      "stable_resolved_cookie_not_authorized",
    );
    expect(uid2WithClaimOnUid1Email.cookieActorAuthorized).toBe(false);
    expect(uid2WithClaimOnUid1Email.legacyClaimCount).toBe(0);
  });

  it("E variant: UID-2 identity_not_bound while cookie is historical email", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "old@example.com",
      stableResolution: {
        state: "identity_not_bound",
        firebaseUid: "UID-2",
        verifiedEmailMetadata: "old@example.com",
      },
    });
    expect(result.state).toBe("identity_not_bound");
    expect(result.cookieActorAuthorized).toBe(false);
  });

  it("never treats verified email metadata alone as authorization", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "same@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-1",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: ["firebase:UID-A"],
        legacyActorKeys: [],
        // Metadata equals cookie — still not a claim
        verifiedEmailMetadata: "same@example.com",
      },
    });
    expect(result.state).toBe("stable_resolved_cookie_not_authorized");
  });

  it("stable_resolved_invalid when lookup set malformed", () => {
    const result = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: "a@example.com",
      stableResolution: {
        state: "resolved",
        firebaseUid: "UID-A",
        identityId: "id-1",
        stableActorKey: "firebase:UID-A",
        actorLookupKeys: [],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@example.com",
      },
    });
    expect(result.state).toBe("stable_resolved_invalid");
    expect(result.cookieActorAuthorized).toBe(false);
  });
});

describe("observeJournalIdentityShadow", () => {
  const findUnique = vi.fn();
  const emit = vi.fn();
  const db = { accountIdentity: { findUnique } };

  beforeEach(() => {
    findUnique.mockReset();
    emit.mockReset();
  });

  it("A: flag OFF — resolver not called, null report, no emit", async () => {
    const resolveSpy = vi.fn();
    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save",
        legacyCookieActorKey: "user@example.com",
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
      {
        isEnabled: () => false,
        getSession: resolveSpy,
        db: db as never,
        emit,
      },
    );
    expect(result).toBeNull();
    expect(resolveSpy).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("B: bound + cookie is explicit claim — authorized diagnostic; emit PII-free", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });

    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save",
        legacyCookieActorKey: "old@example.com",
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
      {
        isEnabled: () => true,
        getSession: async () => ({ uid: "UID-A", email: "old@example.com" }),
        db: db as never,
        emit,
      },
    );

    expect(result?.state).toBe("stable_resolved_cookie_is_explicit_legacy_claim");
    expect(result?.cookieActorAuthorized).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
    const logged = emit.mock.calls[0]![0];
    expect(logged).toMatchObject({
      state: "stable_resolved_cookie_is_explicit_legacy_claim",
      route: "journal.save",
      cookieActorAuthorized: true,
      cookieActorKind: "explicit_legacy_claim",
      legacyClaimCount: 1,
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    const serialized = JSON.stringify(logged);
    expect(serialized).not.toContain("old@example.com");
    expect(serialized).not.toContain("UID-A");
    expect(serialized).not.toContain("firebase:");
    expect(serialized).not.toContain("id-1");
  });

  it("D: email-change mismatch recorded; emit has no raw email", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-1",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });

    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save_operations.lookup",
        legacyCookieActorKey: "new@example.com",
        saveOperationId: "01HXSAVEOPERATIONID00000002",
      },
      {
        isEnabled: () => true,
        getSession: async () => ({ uid: "UID-1", email: "new@example.com" }),
        db: db as never,
        emit,
      },
    );

    expect(result?.state).toBe("stable_resolved_cookie_not_authorized");
    expect(result?.cookieActorAuthorized).toBe(false);
    const serialized = JSON.stringify(emit.mock.calls[0]![0]);
    expect(serialized).not.toContain("new@example.com");
    expect(serialized).not.toContain("old@example.com");
  });

  it("I: resolver throws — safe error report; never rethrows", async () => {
    findUnique.mockRejectedValue(new Error("boom secret@example.com UID-LEAK"));

    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save_capability",
        legacyCookieActorKey: "user@example.com",
      },
      {
        isEnabled: () => true,
        getSession: async () => ({ uid: "UID-A", email: "user@example.com" }),
        db: db as never,
        emit,
      },
    );

    expect(result?.state).toBe("shadow_observation_error");
    expect(result?.cookieActorAuthorized).toBe(false);
    const serialized = JSON.stringify(emit.mock.calls[0]![0]);
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("UID-LEAK");
    expect(serialized).not.toContain("boom");
  });

  it("F via observe: identity_not_bound", async () => {
    findUnique.mockResolvedValue(null);
    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save",
        legacyCookieActorKey: "new@example.com",
      },
      {
        isEnabled: () => true,
        getSession: async () => ({ uid: "UID-NEW", email: "new@example.com" }),
        db: db as never,
        emit,
      },
    );
    expect(result?.state).toBe("identity_not_bound");
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it("G via observe: verified_session_required", async () => {
    const result = await observeJournalIdentityShadow(
      {
        route: "journal.save",
        legacyCookieActorKey: "user@example.com",
      },
      {
        isEnabled: () => true,
        getSession: async () => null,
        db: db as never,
        emit,
      },
    );
    expect(result?.state).toBe("verified_session_required");
    expect(findUnique).not.toHaveBeenCalled();
  });
});
