/**
 * AI-X6.7B7B — Unit: value gates default OFF; backfill never uses current auth email.
 */

import { describe, expect, it } from "vitest";

import {
  resolveValueIdentityOwnershipForLegacyRow,
  type ValueBackfillEvidence,
} from "@/lib/value/valueIdentityBackfill";
import {
  isP1ValueIdentityDualWriteEnabled,
  isP1ValueIdentityMutationAuthorityEnabled,
  isP1ValueIdentityReadAuthorityEnabled,
  P1_VALUE_IDENTITY_DUAL_WRITE_FLAG,
  P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG,
  P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG,
} from "@/lib/value/valueIdentityGates";
import { classifyValueObjectOwnership } from "@/lib/value/valueIdentityOwnership";
import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { STRIPE_IDENTITY_MAPPING_UNRESOLVED } from "@/lib/value/stripeIdentitySyncSafety";

describe("AI-X6.7B7B value gates", () => {
  it("default OFF", () => {
    expect(isP1ValueIdentityReadAuthorityEnabled({})).toBe(false);
    expect(isP1ValueIdentityMutationAuthorityEnabled({})).toBe(false);
    expect(isP1ValueIdentityDualWriteEnabled({})).toBe(false);
  });

  it("YES/1 enable", () => {
    expect(
      isP1ValueIdentityReadAuthorityEnabled({
        [P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isP1ValueIdentityMutationAuthorityEnabled({
        [P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG]: "1",
      }),
    ).toBe(true);
    expect(
      isP1ValueIdentityDualWriteEnabled({
        [P1_VALUE_IDENTITY_DUAL_WRITE_FLAG]: "YES",
      }),
    ).toBe(true);
  });
});

describe("AI-X6.7B7B value backfill resolver", () => {
  const empty: ValueBackfillEvidence = {
    settingsByEmail: new Map(),
    claimByActorKey: new Map(),
    primaryEmailIdentityIds: new Map(),
    profileIdentityById: new Map(),
  };

  it("UNBOUND without evidence — never current auth email", () => {
    const r = resolveValueIdentityOwnershipForLegacyRow(
      { email: "a@ljd.invalid", profileId: "p1" },
      empty,
    );
    expect(r.class).toBe("UNBOUND");
    expect(r.identityId).toBeNull();
  });

  it("BOUND via settings; profile agree", () => {
    const evidence: ValueBackfillEvidence = {
      ...empty,
      settingsByEmail: new Map([["a@ljd.invalid", "id-a"]]),
      profileIdentityById: new Map([["p1", "id-a"]]),
    };
    const r = resolveValueIdentityOwnershipForLegacyRow(
      { email: "a@ljd.invalid", profileId: "p1" },
      evidence,
    );
    expect(r.class).toBe("BOUND");
    expect(r.identityId).toBe("id-a");
  });

  it("AMBIGUOUS when settings and profile disagree", () => {
    const evidence: ValueBackfillEvidence = {
      ...empty,
      settingsByEmail: new Map([["a@ljd.invalid", "id-a"]]),
      profileIdentityById: new Map([["p1", "id-b"]]),
    };
    const r = resolveValueIdentityOwnershipForLegacyRow(
      { email: "a@ljd.invalid", profileId: "p1" },
      evidence,
    );
    expect(r.class).toBe("AMBIGUOUS");
    expect(r.identityId).toBeNull();
  });

  it("BOUND via identity-owned profile alone", () => {
    const evidence: ValueBackfillEvidence = {
      ...empty,
      profileIdentityById: new Map([["p1", "id-a"]]),
    };
    const r = resolveValueIdentityOwnershipForLegacyRow(
      { email: "orphan@ljd.invalid", profileId: "p1" },
      evidence,
    );
    expect(r.class).toBe("BOUND");
    expect(r.evidence).toBe("identity_owned_profile");
    expect(r.identityId).toBe("id-a");
  });
});

describe("AI-X6.7B7B object ownership classify", () => {
  const boundA: P0OwnershipResolution = {
    state: "BOUND",
    identityId: "id-a",
    firebaseUid: "uid-a",
    evidenceSource: "VERIFIED_FIREBASE_UID",
    legacyActorKeys: [],
    verifiedEmailMetadata: "b@ljd.invalid",
    reason: "ok",
  };

  it("same identity → BOUND; other → NOT_OWNED; null → NOT_OWNED", () => {
    expect(
      classifyValueObjectOwnership({
        ownership: boundA,
        objectIdentityId: "id-a",
      }),
    ).toBe("BOUND");
    expect(
      classifyValueObjectOwnership({
        ownership: boundA,
        objectIdentityId: "id-b",
      }),
    ).toBe("NOT_OWNED");
    expect(
      classifyValueObjectOwnership({
        ownership: boundA,
        objectIdentityId: null,
      }),
    ).toBe("NOT_OWNED");
  });
});

describe("AI-X6.7B7B Stripe mapping unresolved list", () => {
  it("documents unresolved production mapping; no live calls implied", () => {
    expect(STRIPE_IDENTITY_MAPPING_UNRESOLVED.length).toBeGreaterThan(0);
    expect(
      STRIPE_IDENTITY_MAPPING_UNRESOLVED.some((s) =>
        s.includes("No Stripe customer create"),
      ),
    ).toBe(true);
  });
});
