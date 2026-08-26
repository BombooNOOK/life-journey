/**
 * AI-X6.4 claim-backed JSO recovery — unit tests.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { assessStableJsoFlagCombination } from "@/lib/journal/saveIdempotency/assessStableJsoFlagCombination";
import { findJournalSaveOperationByAuthorizedActorKeys } from "@/lib/journal/saveIdempotency/findJournalSaveOperationByAuthorizedActorKeys";
import { resolveJournalSaveRecoveryAuthority } from "@/lib/journal/saveIdempotency/resolveJournalSaveRecoveryAuthority";
import {
  isStableJsoRecoveryEnabled,
  STABLE_JSO_RECOVERY_FLAG,
} from "@/lib/journal/saveIdempotency/stableJsoRecoveryGate";
import { STABLE_JSO_WRITE_AUTHORITY_FLAG } from "@/lib/journal/saveIdempotency/stableJsoWriteAuthorityGate";

describe("stableJsoRecoveryGate", () => {
  it("defaults OFF", () => {
    expect(isStableJsoRecoveryEnabled({})).toBe(false);
    expect(
      isStableJsoRecoveryEnabled({ [STABLE_JSO_RECOVERY_FLAG]: "true" }),
    ).toBe(false);
  });

  it("accepts YES|1", () => {
    expect(
      isStableJsoRecoveryEnabled({ [STABLE_JSO_RECOVERY_FLAG]: "YES" }),
    ).toBe(true);
    expect(isStableJsoRecoveryEnabled({ [STABLE_JSO_RECOVERY_FLAG]: "1" })).toBe(
      true,
    );
  });
});

describe("assessStableJsoFlagCombination (P)", () => {
  it("write ON + recovery OFF is unsafe", () => {
    expect(
      assessStableJsoFlagCombination({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "YES",
        [STABLE_JSO_RECOVERY_FLAG]: "",
      }),
    ).toEqual({
      status: "unsafe",
      reason: "stable_write_without_recovery",
      writeEnabled: true,
      recoveryEnabled: false,
    });
  });

  it("M/N/O safe combinations", () => {
    expect(assessStableJsoFlagCombination({})).toMatchObject({ status: "ok" });
    expect(
      assessStableJsoFlagCombination({
        [STABLE_JSO_RECOVERY_FLAG]: "YES",
      }),
    ).toMatchObject({ status: "ok", writeEnabled: false, recoveryEnabled: true });
    expect(
      assessStableJsoFlagCombination({
        [STABLE_JSO_WRITE_AUTHORITY_FLAG]: "YES",
        [STABLE_JSO_RECOVERY_FLAG]: "YES",
      }),
    ).toMatchObject({ status: "ok", writeEnabled: true, recoveryEnabled: true });
  });
});

describe("resolveJournalSaveRecoveryAuthority", () => {
  const findUnique = vi.fn();
  const db = { accountIdentity: { findUnique } };

  beforeEach(() => {
    findUnique.mockReset();
  });

  it("A: flag OFF → legacy cookie email only; resolver not called", async () => {
    const result = await resolveJournalSaveRecoveryAuthority(
      "Person@Example.com",
      {
        isStableRecoveryEnabled: () => false,
        getSession: async () => ({ uid: "UID-A", email: "person@example.com" }),
        db: db as never,
      },
    );
    expect(result).toEqual({
      mode: "legacy",
      actorKeys: ["person@example.com"],
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("B/O: flag ON resolved → firebase + claims in actorLookupKeys", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-1",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });
    const result = await resolveJournalSaveRecoveryAuthority(
      "new@example.com",
      {
        isStableRecoveryEnabled: () => true,
        getSession: async () => ({ uid: "UID-1", email: "new@example.com" }),
        db: db as never,
      },
    );
    expect(result).toEqual({
      mode: "stable",
      actorKeys: ["firebase:UID-1", "old@example.com"],
      firebaseUid: "UID-1",
      identityId: "id-1",
    });
    expect(result.mode === "stable" && result.actorKeys).not.toContain(
      "new@example.com",
    );
  });

  it("I: identity_not_bound fail closed (no cookie fallback)", async () => {
    findUnique.mockResolvedValue(null);
    const result = await resolveJournalSaveRecoveryAuthority("a@example.com", {
      isStableRecoveryEnabled: () => true,
      getSession: async () => ({ uid: "UID-NEW", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "identity_not_bound",
    });
  });

  it("J: verified_session_required", async () => {
    const result = await resolveJournalSaveRecoveryAuthority("a@example.com", {
      isStableRecoveryEnabled: () => true,
      getSession: async () => null,
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "verified_session_required",
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("K: identity_incomplete", async () => {
    findUnique.mockResolvedValue({
      id: "",
      firebaseUid: "UID-A",
      legacyActorClaims: [],
    });
    const result = await resolveJournalSaveRecoveryAuthority("a@example.com", {
      isStableRecoveryEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "identity_incomplete",
    });
  });

  it("L: resolver exception → stable_identity_unavailable", async () => {
    findUnique.mockRejectedValue(new Error("boom secret@example.com"));
    const result = await resolveJournalSaveRecoveryAuthority("a@example.com", {
      isStableRecoveryEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({
      mode: "stable_rejected",
      reason: "stable_identity_unavailable",
    });
  });
});

describe("findJournalSaveOperationByAuthorizedActorKeys", () => {
  const findMany = vi.fn();
  const client = { journalSaveOperation: { findMany } };

  beforeEach(() => {
    findMany.mockReset();
  });

  it("B: stable row found", async () => {
    findMany.mockResolvedValue([
      {
        status: "completed",
        journalEntryId: "e1",
        requestFingerprint: "fp",
        resultCode: "OK",
      },
    ]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: ["firebase:UID-1"],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result).toEqual({
      kind: "found",
      row: {
        status: "completed",
        journalEntryId: "e1",
        requestFingerprint: "fp",
        resultCode: "OK",
      },
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        saveOperationId: "01HXSAVEOPERATIONID00000001",
        actorKey: { in: ["firebase:UID-1"] },
      },
      select: {
        status: true,
        journalEntryId: true,
        requestFingerprint: true,
        resultCode: true,
      },
      take: 2,
    });
  });

  it("C/N: legacy claimed row found (email change irrelevant)", async () => {
    findMany.mockResolvedValue([
      {
        status: "completed",
        journalEntryId: "e-old",
        requestFingerprint: "fp",
        resultCode: "OK",
      },
    ]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: ["firebase:UID-1", "old@example.com"],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result.kind).toBe("found");
    expect(findMany.mock.calls[0]![0].where.actorKey.in).toEqual([
      "firebase:UID-1",
      "old@example.com",
    ]);
  });

  it("D: no authorized keys match → not_found", async () => {
    findMany.mockResolvedValue([]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: ["firebase:UID-2"],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result).toEqual({ kind: "not_found" });
  });

  it("E: email-reuse — UID-2 keys exclude claim of UID-1", async () => {
    findMany.mockResolvedValue([]);
    await findJournalSaveOperationByAuthorizedActorKeys(client as never, {
      actorKeys: ["firebase:UID-2"],
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    expect(findMany.mock.calls[0]![0].where.actorKey.in).toEqual([
      "firebase:UID-2",
    ]);
    expect(findMany.mock.calls[0]![0].where.actorKey.in).not.toContain(
      "old@example.com",
    );
  });

  it("F: multiple claims, query includes all; one match → found", async () => {
    findMany.mockResolvedValue([
      {
        status: "processing",
        journalEntryId: null,
        requestFingerprint: "fp",
        resultCode: null,
      },
    ]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: [
          "firebase:UID-1",
          "old-a@example.com",
          "old-b@example.com",
        ],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result.kind).toBe("found");
    expect(findMany.mock.calls[0]![0].where.actorKey.in).toHaveLength(3);
  });

  it("G: stable + legacy duplicate → ambiguous (never pick)", async () => {
    findMany.mockResolvedValue([
      {
        status: "completed",
        journalEntryId: "e1",
        requestFingerprint: "fp1",
        resultCode: "OK",
      },
      {
        status: "completed",
        journalEntryId: "e2",
        requestFingerprint: "fp2",
        resultCode: "OK",
      },
    ]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: ["firebase:UID-1", "old@example.com"],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result).toEqual({ kind: "ambiguous", matchCount: 2 });
  });

  it("H: two legacy claims both match → ambiguous", async () => {
    findMany.mockResolvedValue([
      {
        status: "completed",
        journalEntryId: "e-a",
        requestFingerprint: "fp",
        resultCode: "OK",
      },
      {
        status: "completed",
        journalEntryId: "e-b",
        requestFingerprint: "fp",
        resultCode: "OK",
      },
    ]);
    const result = await findJournalSaveOperationByAuthorizedActorKeys(
      client as never,
      {
        actorKeys: [
          "firebase:UID-1",
          "old-a@example.com",
          "old-b@example.com",
        ],
        saveOperationId: "01HXSAVEOPERATIONID00000001",
      },
    );
    expect(result).toEqual({ kind: "ambiguous", matchCount: 2 });
  });
});
