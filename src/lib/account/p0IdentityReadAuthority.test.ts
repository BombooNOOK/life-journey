/**
 * AI-X6.7B4 — unit: read-authority gate default + contract where builder.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildP0OwnedRowWhere,
  accessFromP0Ownership,
} from "@/lib/account/p0IdentityReadContract";
import {
  isP0IdentityReadAuthorityEnabled,
  P0_IDENTITY_READ_AUTHORITY_FLAG,
} from "@/lib/account/p0IdentityReadAuthorityGate";
import { computeP0ReadShadowSetDiff } from "@/lib/account/p0IdentityOwnershipReadShadow";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI-X6.7B4 read-authority gate", () => {
  it("defaults OFF", () => {
    expect(isP0IdentityReadAuthorityEnabled({})).toBe(false);
  });

  it("enables on YES|1", () => {
    expect(
      isP0IdentityReadAuthorityEnabled({
        [P0_IDENTITY_READ_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isP0IdentityReadAuthorityEnabled({
        [P0_IDENTITY_READ_AUTHORITY_FLAG]: "1",
      }),
    ).toBe(true);
  });
});

describe("AI-X6.7B4 identity read contract", () => {
  it("fail-closes UNBOUND/AMBIGUOUS/MISMATCH", () => {
    expect(
      accessFromP0Ownership({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: "u",
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@x",
        reason: "x",
      }).ok,
    ).toBe(false);
    expect(
      accessFromP0Ownership({
        state: "AMBIGUOUS",
        identityId: null,
        firebaseUid: "u",
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@x",
        reason: "x",
      }).ok,
    ).toBe(false);
    expect(
      accessFromP0Ownership({
        state: "MISMATCH",
        identityId: "id-a",
        firebaseUid: "u",
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@x",
        reason: "x",
      }).ok,
    ).toBe(false);
  });

  it("mixed where never uses bare current email — only explicit list", () => {
    const where = buildP0OwnedRowWhere({
      identityId: "id-a",
      explicitHistoricalEmails: ["old@ljd.invalid"],
    });
    expect(where).toEqual({
      OR: [
        { identityId: "id-a" },
        { identityId: null, email: { in: ["old@ljd.invalid"] } },
      ],
    });
    const identityOnly = buildP0OwnedRowWhere({
      identityId: "id-a",
      explicitHistoricalEmails: [],
    });
    expect(identityOnly).toEqual({ identityId: "id-a" });
  });

  it("set classification BOTH_DIFFER when both sides have unique ids", () => {
    const diff = computeP0ReadShadowSetDiff({
      oldIds: ["a", "b"],
      newIds: ["b", "c"],
    });
    expect(diff.setClassification).toBe("BOTH_DIFFER");
    expect(diff.onlyOld).toEqual(["a"]);
    expect(diff.onlyNew).toEqual(["c"]);
    expect(diff.both).toEqual(["b"]);
  });
});
