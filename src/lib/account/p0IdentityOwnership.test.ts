/**
 * AI-X6.7B3 — P0 ownership resolver + dual-write unit tests (no DB).
 */

import { describe, expect, it } from "vitest";

import {
  decideP0JournalDualWrite,
  decideP0ProfileDualWrite,
} from "@/lib/account/p0IdentityDualWrite";
import {
  checkProfileIdentityForDualWrite,
  classifyVerifiedActorIdentity,
  dualWriteIdentityIdOrNull,
  type P0OwnershipResolution,
} from "@/lib/account/p0IdentityOwnership";

const bound: P0OwnershipResolution = {
  state: "BOUND",
  identityId: "id-a",
  firebaseUid: "uid-a",
  evidenceSource: "VERIFIED_FIREBASE_UID",
  legacyActorKeys: ["old@ljd.invalid"],
  verifiedEmailMetadata: "new@ljd.invalid",
  reason: "verified_uid_identity_bound",
};

describe("AI-X6.7B3 P0 ownership resolver", () => {
  it("maps resolved UID identity to BOUND without using email as authority", async () => {
    const r = await classifyVerifiedActorIdentity(
      {
        state: "resolved",
        firebaseUid: "uid-a",
        identityId: "id-a",
        stableActorKey: "firebase:uid-a",
        actorLookupKeys: ["firebase:uid-a"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@ljd.invalid",
      },
      {
        db: {
          accountSettings: {
            findUnique: async () => null,
            findFirst: async () => null,
          },
        },
      },
    );
    expect(r.state).toBe("BOUND");
    expect(r.identityId).toBe("id-a");
    expect(r.evidenceSource).toBe("VERIFIED_FIREBASE_UID");
  });

  it("detects MISMATCH when email-scoped settings point elsewhere", async () => {
    const r = await classifyVerifiedActorIdentity(
      {
        state: "resolved",
        firebaseUid: "uid-a",
        identityId: "id-a",
        stableActorKey: "firebase:uid-a",
        actorLookupKeys: ["firebase:uid-a"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "shared@ljd.invalid",
      },
      {
        db: {
          accountSettings: {
            findUnique: async () => ({
              id: "s1",
              email: "shared@ljd.invalid",
              identityId: "id-b",
            }),
            findFirst: async () => null,
          },
        },
      },
    );
    expect(r.state).toBe("MISMATCH");
  });

  it("never grants dual-write identity from email alone when unbound", () => {
    const unbound: P0OwnershipResolution = {
      state: "UNBOUND",
      identityId: null,
      firebaseUid: "uid-b",
      evidenceSource: "NONE",
      legacyActorKeys: [],
      verifiedEmailMetadata: "a@ljd.invalid",
      reason: "identity_not_bound",
    };
    expect(
      dualWriteIdentityIdOrNull({ dualWriteEnabled: true, ownership: unbound }),
    ).toBeNull();
  });
});

describe("AI-X6.7B3 dual-write decisions", () => {
  it("gate OFF → legacy_null even when BOUND", () => {
    expect(
      decideP0ProfileDualWrite({ ownership: bound, dualWriteEnabled: false }),
    ).toMatchObject({ action: "legacy_null", reason: "dual_write_gate_off" });
  });

  it("gate ON + BOUND → write_identity", () => {
    expect(
      decideP0ProfileDualWrite({ ownership: bound, dualWriteEnabled: true }),
    ).toMatchObject({ action: "write_identity", identityId: "id-a" });
  });

  it("journal HOLD when profile identity mismatches", () => {
    expect(
      decideP0JournalDualWrite({
        ownership: bound,
        profileIdentityId: "id-other",
        dualWriteEnabled: true,
      }),
    ).toMatchObject({ action: "hold", identityId: null });
  });

  it("profile identity check fail-closed on mismatch", () => {
    expect(
      checkProfileIdentityForDualWrite({
        resolvedIdentityId: "id-a",
        profileIdentityId: "id-b",
      }),
    ).toMatchObject({ ok: false, mode: "mismatch" });
  });
});
