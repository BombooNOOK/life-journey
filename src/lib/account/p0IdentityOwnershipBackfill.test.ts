/**
 * AI-X6.7B2 / B4 — P0 backfill + read-shadow unit tests (no DB required).
 */

import { describe, expect, it } from "vitest";

import {
  countP0BackfillResolutions,
  resolveP0IdentityOwnershipForLegacyEmail,
  type P0BackfillEvidence,
} from "@/lib/account/p0IdentityOwnershipBackfill";
import {
  buildP0ReadShadowRows,
  classifyP0ReadShadowRow,
  computeP0ReadShadowSetDiff,
} from "@/lib/account/p0IdentityOwnershipReadShadow";

const ID_A = "identity-a";
const ID_B = "identity-b";
const EMAIL_A = "a@ljd.invalid";
const EMAIL_B = "b@ljd.invalid";

describe("AI-X6.7B2 P0 backfill dry-run resolution", () => {
  it("A: normal bound legacy user via AccountSettings.identityId", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map([[EMAIL_A, ID_A]]),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map([[EMAIL_A, [ID_A]]]),
    };
    const r = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(r).toMatchObject({
      class: "BOUND",
      identityId: ID_A,
      evidence: "settings_identityId",
    });
  });

  it("B: changed-email same UID — historical EMAIL-A still binds via claim/settings to UID-A", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map([[EMAIL_A, ID_A]]),
      claimByActorKey: new Map([[EMAIL_A, ID_A]]),
      primaryEmailIdentityIds: new Map([[EMAIL_B, [ID_A]]]),
    };
    const historical = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(historical).toMatchObject({ class: "BOUND", identityId: ID_A });
  });

  it("C: reused EMAIL-A under UID-B must NOT bind historical rows to UID-B when UID-A claim/settings exist", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map([[EMAIL_A, ID_A]]),
      claimByActorKey: new Map([[EMAIL_A, ID_A]]),
      primaryEmailIdentityIds: new Map([[EMAIL_A, [ID_A, ID_B]]]),
    };
    const r = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(r).toMatchObject({
      class: "BOUND",
      identityId: ID_A,
      evidence: "settings_identityId",
    });
    expect(r.identityId).not.toBe(ID_B);
  });

  it("C2: reused EMAIL-A with only dual primary (no settings/claim) is AMBIGUOUS — never guess UID-A", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map(),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map([[EMAIL_A, [ID_A, ID_B]]]),
    };
    const r = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(r).toMatchObject({
      class: "AMBIGUOUS",
      identityId: null,
      reason: "multiple_primary_identity_emails",
    });
  });

  it("D: unbound legacy user with no evidence", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map(),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map(),
    };
    const r = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(r).toMatchObject({ class: "UNBOUND", identityId: null });
  });

  it("E: settings vs claim conflict → AMBIGUOUS", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map([[EMAIL_A, ID_A]]),
      claimByActorKey: new Map([[EMAIL_A, ID_B]]),
      primaryEmailIdentityIds: new Map(),
    };
    const r = resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence);
    expect(r).toMatchObject({
      class: "AMBIGUOUS",
      reason: "settings_claim_conflict",
    });
  });

  it("count strategy aggregates BOUND/UNBOUND/AMBIGUOUS", () => {
    const evidence: P0BackfillEvidence = {
      settingsByEmail: new Map([[EMAIL_A, ID_A]]),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map(),
    };
    const resolutions = [
      resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence),
      resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, evidence),
      resolveP0IdentityOwnershipForLegacyEmail("x@ljd.invalid", {
        settingsByEmail: new Map(),
        claimByActorKey: new Map(),
        primaryEmailIdentityIds: new Map(),
      }),
      resolveP0IdentityOwnershipForLegacyEmail(EMAIL_A, {
        settingsByEmail: new Map([[EMAIL_A, ID_A]]),
        claimByActorKey: new Map([[EMAIL_A, ID_B]]),
        primaryEmailIdentityIds: new Map(),
      }),
    ];
    const counts = countP0BackfillResolutions(resolutions);
    expect(counts).toEqual({ bound: 2, unbound: 1, ambiguous: 1 });
  });
});

describe("AI-X6.7B4 P0 read-shadow set semantics", () => {
  it("classifies MATCH / LEGACY_ONLY / IDENTITY_ONLY / UNBOUND_LEGACY / OWNERSHIP_CONFLICT", () => {
    expect(
      classifyP0ReadShadowRow({
        id: "1",
        inOld: true,
        inNew: true,
        unbound: false,
        ownershipConflict: false,
      }),
    ).toBe("MATCH");
    expect(
      classifyP0ReadShadowRow({
        id: "2",
        inOld: true,
        inNew: false,
        unbound: false,
        ownershipConflict: false,
      }),
    ).toBe("LEGACY_ONLY");
    expect(
      classifyP0ReadShadowRow({
        id: "3",
        inOld: false,
        inNew: true,
        unbound: false,
        ownershipConflict: false,
      }),
    ).toBe("IDENTITY_ONLY");
    expect(
      classifyP0ReadShadowRow({
        id: "4",
        inOld: true,
        inNew: false,
        unbound: true,
        ownershipConflict: false,
      }),
    ).toBe("UNBOUND_LEGACY");
    expect(
      classifyP0ReadShadowRow({
        id: "5",
        inOld: true,
        inNew: true,
        unbound: false,
        ownershipConflict: true,
      }),
    ).toBe("OWNERSHIP_CONFLICT");
  });

  it("changed-email: OLD empty, NEW has history → IDENTITY_ONLY (not LEGACY_ONLY)", () => {
    const diff = computeP0ReadShadowSetDiff({
      oldIds: [],
      newIds: ["entry-a1", "profile-a1"],
    });
    expect(diff.setClassification).toBe("IDENTITY_ONLY");
    expect(diff.onlyOld).toEqual([]);
    expect(diff.onlyNew.sort()).toEqual(["entry-a1", "profile-a1"].sort());
    const rows = buildP0ReadShadowRows({
      oldIds: [],
      newIds: ["entry-a1", "profile-a1"],
    });
    expect(rows.every((r) => r.category === "IDENTITY_ONLY")).toBe(true);
  });

  it("reused-email: OLD has history, NEW empty → LEGACY_ONLY", () => {
    const diff = computeP0ReadShadowSetDiff({
      oldIds: ["entry-a1"],
      newIds: [],
    });
    expect(diff.setClassification).toBe("LEGACY_ONLY");
    expect(diff.onlyOld).toEqual(["entry-a1"]);
    expect(diff.onlyNew).toEqual([]);
  });

  it("buildP0ReadShadowRows covers set comparison", () => {
    const rows = buildP0ReadShadowRows({
      oldIds: ["a", "b", "u"],
      newIds: ["a", "c"],
      unboundIds: new Set(["u"]),
      conflictingIds: new Set(),
    });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.category]));
    expect(byId.a).toBe("MATCH");
    expect(byId.b).toBe("LEGACY_ONLY");
    expect(byId.c).toBe("IDENTITY_ONLY");
    expect(byId.u).toBe("UNBOUND_LEGACY");
  });
});
