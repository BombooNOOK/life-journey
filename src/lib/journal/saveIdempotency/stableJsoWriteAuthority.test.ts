/**
 * AI-X6.3 stable JSO write authority — unit tests.
 *
 * Flag OFF = legacy email actorKey.
 * Flag ON = firebase:<UID> only; fail closed; no email fallback.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  resolveJournalSaveWriteActorKey,
  stableJsoWriteRejectHttp,
} from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";
import {
  isStableJsoWriteAuthorityEnabled,
  STABLE_JSO_WRITE_AUTHORITY_FLAG,
} from "@/lib/journal/saveIdempotency/stableJsoWriteAuthorityGate";

describe("stableJsoWriteAuthorityGate", () => {
  it("defaults OFF", () => {
    expect(isStableJsoWriteAuthorityEnabled({})).toBe(false);
    expect(
      isStableJsoWriteAuthorityEnabled({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "",
      }),
    ).toBe(false);
    expect(
      isStableJsoWriteAuthorityEnabled({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "true",
      }),
    ).toBe(false);
  });

  it("accepts YES|1", () => {
    expect(
      isStableJsoWriteAuthorityEnabled({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isStableJsoWriteAuthorityEnabled({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "1",
      }),
    ).toBe(true);
  });
});

describe("resolveJournalSaveWriteActorKey (AI-X6.3)", () => {
  const findUnique = vi.fn();
  const db = { accountIdentity: { findUnique } };

  beforeEach(() => {
    findUnique.mockReset();
  });

  it("A: flag OFF → normalized cookie email; resolver not called", async () => {
    const result = await resolveJournalSaveWriteActorKey("Person@Example.com", {
      isStableWriteEnabled: () => false,
      getSession: async () => ({ uid: "UID-A", email: "person@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "legacy",
      actorKey: "person@example.com",
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("B: flag ON + resolved → firebase:<UID>", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [],
    });
    const result = await resolveJournalSaveWriteActorKey("person@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "person@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable",
      actorKey: buildFirebaseActorKey("UID-A"),
      firebaseUid: "UID-A",
      identityId: "id-1",
    });
  });

  it("C: flag ON + email A→B same UID → actorKey unchanged", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-1",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });

    const withA = await resolveJournalSaveWriteActorKey("old@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-1", email: "old@example.com" }),
      db: db as never,
    });
    const withB = await resolveJournalSaveWriteActorKey("new@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-1", email: "new@example.com" }),
      db: db as never,
    });

    expect(withA.mode).toBe("stable");
    expect(withB.mode).toBe("stable");
    if (withA.mode === "stable" && withB.mode === "stable") {
      expect(withA.actorKey).toBe(withB.actorKey);
      expect(withA.actorKey).toBe("firebase:UID-1");
    }
  });

  it("D: flag ON + two UIDs reuse same email → distinct actorKeys", async () => {
    findUnique
      .mockResolvedValueOnce({
        id: "id-1",
        firebaseUid: "UID-1",
        legacyActorClaims: [],
      })
      .mockResolvedValueOnce({
        id: "id-2",
        firebaseUid: "UID-2",
        legacyActorClaims: [],
      });

    const uid1 = await resolveJournalSaveWriteActorKey("shared@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-1", email: "shared@example.com" }),
      db: db as never,
    });
    const uid2 = await resolveJournalSaveWriteActorKey("shared@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-2", email: "shared@example.com" }),
      db: db as never,
    });

    expect(uid1).toMatchObject({ mode: "stable", actorKey: "firebase:UID-1" });
    expect(uid2).toMatchObject({ mode: "stable", actorKey: "firebase:UID-2" });
    if (uid1.mode === "stable" && uid2.mode === "stable") {
      expect(uid1.actorKey).not.toBe(uid2.actorKey);
    }
  });

  it("E: explicit legacy claim exists — new write still firebase:<UID>", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-1",
      legacyActorClaims: [
        { actorKey: "old@example.com" },
        { actorKey: "earlier@example.com" },
      ],
    });
    const result = await resolveJournalSaveWriteActorKey("now@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-1", email: "now@example.com" }),
      db: db as never,
    });
    expect(result).toMatchObject({
      mode: "stable",
      actorKey: "firebase:UID-1",
    });
    if (result.mode === "stable") {
      expect(result.actorKey).not.toBe("old@example.com");
      expect(result.actorKey).not.toBe("earlier@example.com");
      expect(result.actorKey).not.toBe("now@example.com");
    }
  });

  it("F: identity_not_bound → stable_rejected, no write key", async () => {
    findUnique.mockResolvedValue(null);
    const result = await resolveJournalSaveWriteActorKey("new@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-NEW", email: "new@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "identity_not_bound",
    });
  });

  it("G: verified_session_required", async () => {
    const result = await resolveJournalSaveWriteActorKey("user@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => null,
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "verified_session_required",
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("H: identity_incomplete", async () => {
    findUnique.mockResolvedValue({
      id: "",
      firebaseUid: "UID-A",
      legacyActorClaims: [],
    });
    const result = await resolveJournalSaveWriteActorKey("a@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "identity_incomplete",
    });
  });

  it("I: resolver exception → stable_identity_unavailable", async () => {
    findUnique.mockRejectedValue(new Error("db down secret@example.com"));
    const result = await resolveJournalSaveWriteActorKey("a@example.com", {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "stable_identity_unavailable",
    });
  });

  it("reject HTTP mapping exposes no UID/email", () => {
    for (const reason of [
      "verified_session_required",
      "identity_not_bound",
      "identity_incomplete",
      "stable_identity_unavailable",
    ] as const) {
      const http = stableJsoWriteRejectHttp(reason);
      expect(http.body.code).toBe("STABLE_IDENTITY_REQUIRED");
      expect(http.body.state).toBe(reason);
      const serialized = JSON.stringify(http.body);
      expect(serialized).not.toContain("@");
      expect(serialized).not.toContain("firebase:");
      expect(serialized).not.toContain("UID-");
    }
    expect(stableJsoWriteRejectHttp("verified_session_required").status).toBe(
      401,
    );
    expect(stableJsoWriteRejectHttp("identity_not_bound").status).toBe(409);
    expect(stableJsoWriteRejectHttp("stable_identity_unavailable").status).toBe(
      503,
    );
  });
});
