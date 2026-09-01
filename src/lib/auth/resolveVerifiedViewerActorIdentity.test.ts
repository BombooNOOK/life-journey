/**
 * AI-X6.1 stable actor resolver foundation — unit tests.
 *
 * SELECT-only mocks. Asserts zero identity-layer writes.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { resolveVerifiedViewerActorIdentity } from "@/lib/auth/resolveVerifiedViewerActorIdentity";

describe("resolveVerifiedViewerActorIdentity (AI-X6.1)", () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const $transaction = vi.fn();

  const db = {
    accountIdentity: {
      findUnique,
      create,
      update,
      delete: deleteFn,
    },
    accountIdentityEmail: {
      create,
      update,
      delete: deleteFn,
    },
    accountIdentityLegacyActorClaim: {
      create,
      update,
      delete: deleteFn,
    },
    $transaction,
  };

  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    update.mockReset();
    deleteFn.mockReset();
    $transaction.mockReset();
  });

  function assertNoIdentityWrites() {
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(deleteFn).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  }

  it("G: no verified session → verified_session_required", async () => {
    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => null,
      db: db as never,
    });
    expect(result).toEqual({ state: "verified_session_required" });
    expect(findUnique).not.toHaveBeenCalled();
    assertNoIdentityWrites();
  });

  it("F: verified UID with no AccountIdentity → identity_not_bound (no writes)", async () => {
    findUnique.mockResolvedValue(null);

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-NEW",
        email: "new@example.com",
      }),
      db: db as never,
    });

    expect(result).toEqual({
      state: "identity_not_bound",
      firebaseUid: "UID-NEW",
      verifiedEmailMetadata: "new@example.com",
    });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(findUnique.mock.calls[0]![0]).toMatchObject({
      where: { firebaseUid: "UID-NEW" },
    });
    assertNoIdentityWrites();
  });

  it("A: Identity + zero claims → stable key only; no implicit current email", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-A",
        email: "current@example.com",
      }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.stableActorKey).toBe(buildFirebaseActorKey("UID-A"));
    expect(result.actorLookupKeys).toEqual(["firebase:UID-A"]);
    expect(result.legacyActorKeys).toEqual([]);
    expect(result.verifiedEmailMetadata).toBe("current@example.com");
    expect(result.actorLookupKeys).not.toContain("current@example.com");
    assertNoIdentityWrites();
  });

  it("B: Identity + one explicit legacy claim", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-A",
        email: "current@example.com",
      }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.actorLookupKeys).toEqual([
      "firebase:UID-A",
      "old@example.com",
    ]);
    expect(result.legacyActorKeys).toEqual(["old@example.com"]);
    expect(result.actorLookupKeys).not.toContain("current@example.com");
    assertNoIdentityWrites();
  });

  it("C: Identity + multiple explicit legacy claims (stable first)", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [
        { actorKey: "a@example.com" },
        { actorKey: "b@example.com" },
        { actorKey: "c@example.com" },
      ],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-A",
        email: "now@example.com",
      }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.actorLookupKeys[0]).toBe("firebase:UID-A");
    expect(result.actorLookupKeys).toEqual([
      "firebase:UID-A",
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
    expect(result.legacyActorKeys).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
    expect(result.actorLookupKeys).not.toContain("now@example.com");
    assertNoIdentityWrites();
  });

  it("D: current email differs from legacy claim — claim remains; email is metadata", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [{ actorKey: "legacy@example.com" }],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-A",
        email: "New.Email@Example.com",
      }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.verifiedEmailMetadata).toBe("new.email@example.com");
    expect(result.actorLookupKeys).toContain("legacy@example.com");
    expect(result.actorLookupKeys).not.toContain("new.email@example.com");
    assertNoIdentityWrites();
  });

  it("E: current email matches historical email but NO claim → email NOT in lookup keys", async () => {
    findUnique.mockResolvedValue({
      id: "id-2",
      firebaseUid: "UID-B",
      legacyActorClaims: [],
    });

    const historicalEmail = "old@example.com";
    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-B",
        email: historicalEmail,
      }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.verifiedEmailMetadata).toBe(historicalEmail);
    expect(result.actorLookupKeys).toEqual(["firebase:UID-B"]);
    expect(result.actorLookupKeys).not.toContain(historicalEmail);
    expect(result.legacyActorKeys).toEqual([]);
    assertNoIdentityWrites();
  });

  it("H: email-reuse safety — UID-2 with current email old@ but no claim must not gain historical authority", async () => {
    // UID-1 has the claim (resolved separately for clarity)
    findUnique.mockResolvedValueOnce({
      id: "id-1",
      firebaseUid: "UID-1",
      legacyActorClaims: [{ actorKey: "old@example.com" }],
    });
    const uid1 = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-1",
        email: "new-for-uid1@example.com",
      }),
      db: db as never,
    });
    expect(uid1.state).toBe("resolved");
    if (uid1.state === "resolved") {
      expect(uid1.actorLookupKeys).toEqual([
        "firebase:UID-1",
        "old@example.com",
      ]);
    }

    // UID-2 authenticates as old@example.com but has no claim
    findUnique.mockResolvedValueOnce({
      id: "id-2",
      firebaseUid: "UID-2",
      legacyActorClaims: [],
    });
    const uid2 = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({
        uid: "UID-2",
        email: "old@example.com",
      }),
      db: db as never,
    });

    expect(uid2.state).toBe("resolved");
    if (uid2.state !== "resolved") return;
    expect(uid2.actorLookupKeys).toEqual(["firebase:UID-2"]);
    expect(uid2.actorLookupKeys).not.toContain("old@example.com");
    expect(uid2.legacyActorKeys).toEqual([]);
    expect(uid2.verifiedEmailMetadata).toBe("old@example.com");
    assertNoIdentityWrites();
  });

  it("dedupes duplicate claim actorKeys defensively", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [
        { actorKey: "dup@example.com" },
        { actorKey: "dup@example.com" },
        { actorKey: "other@example.com" },
      ],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({ uid: "UID-A", email: "x@example.com" }),
      db: db as never,
    });

    expect(result.state).toBe("resolved");
    if (result.state !== "resolved") return;
    expect(result.legacyActorKeys).toEqual([
      "dup@example.com",
      "other@example.com",
    ]);
    expect(result.actorLookupKeys).toEqual([
      "firebase:UID-A",
      "dup@example.com",
      "other@example.com",
    ]);
    assertNoIdentityWrites();
  });

  it("fail-closed on invalid identity row", async () => {
    findUnique.mockResolvedValue({
      id: "",
      firebaseUid: "UID-A",
      legacyActorClaims: [],
    });

    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });

    expect(result.state).toBe("identity_incomplete");
    if (result.state !== "identity_incomplete") return;
    expect(result.reason).toBe("identity_row_invalid");
    assertNoIdentityWrites();
  });

  it("SELECT-only: findUnique is the only Prisma interaction for resolved path", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      legacyActorClaims: [{ actorKey: "claimed@example.com" }],
    });

    await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({ uid: "UID-A", email: "now@example.com" }),
      db: db as never,
    });

    expect(findUnique).toHaveBeenCalledTimes(1);
    assertNoIdentityWrites();
    // Explicit write-count contract for X6.1
    expect(create.mock.calls.length).toBe(0);
    expect(update.mock.calls.length).toBe(0);
    expect(deleteFn.mock.calls.length).toBe(0);
  });
});
