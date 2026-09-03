/**
 * AI-X6.7B7A — Unit: diary gates + backfill resolver.
 */

import { describe, expect, it } from "vitest";

import {
  resolveDiaryIdentityOwnershipForLegacyRow,
  type DiaryBackfillEvidence,
} from "@/lib/diary/diaryIdentityBackfill";
import {
  isP1DiaryIdentityDualWriteEnabled,
  isP1DiaryIdentityMutationAuthorityEnabled,
  isP1DiaryIdentityReadAuthorityEnabled,
  P1_DIARY_IDENTITY_DUAL_WRITE_FLAG,
  P1_DIARY_IDENTITY_MUTATION_AUTHORITY_FLAG,
  P1_DIARY_IDENTITY_READ_AUTHORITY_FLAG,
} from "@/lib/diary/diaryIdentityGates";
import { IDENTITY_REBIND_ALLOWED } from "@/lib/diary/diaryIdentityAuthority";

describe("AI-X6.7B7A diary gates", () => {
  it("default OFF", () => {
    expect(isP1DiaryIdentityReadAuthorityEnabled({})).toBe(false);
    expect(isP1DiaryIdentityMutationAuthorityEnabled({})).toBe(false);
    expect(isP1DiaryIdentityDualWriteEnabled({})).toBe(false);
  });

  it("YES enables", () => {
    expect(
      isP1DiaryIdentityReadAuthorityEnabled({
        [P1_DIARY_IDENTITY_READ_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isP1DiaryIdentityMutationAuthorityEnabled({
        [P1_DIARY_IDENTITY_MUTATION_AUTHORITY_FLAG]: "1",
      }),
    ).toBe(true);
    expect(
      isP1DiaryIdentityDualWriteEnabled({
        [P1_DIARY_IDENTITY_DUAL_WRITE_FLAG]: "YES",
      }),
    ).toBe(true);
  });

  it("IDENTITY_REBIND_ALLOWED=NO", () => {
    expect(IDENTITY_REBIND_ALLOWED).toBe(false);
  });
});

describe("AI-X6.7B7A diary backfill resolver", () => {
  const empty: DiaryBackfillEvidence = {
    settingsByEmail: new Map(),
    claimByActorKey: new Map(),
    primaryEmailIdentityIds: new Map(),
    profileIdentityById: new Map(),
    diaryBookIdentityById: new Map(),
  };

  it("UNBOUND without evidence", () => {
    const r = resolveDiaryIdentityOwnershipForLegacyRow(
      { email: "a@ljd.invalid", profileId: "p1" },
      empty,
    );
    expect(r.class).toBe("UNBOUND");
  });

  it("BOUND via diary book parent", () => {
    const evidence: DiaryBackfillEvidence = {
      ...empty,
      diaryBookIdentityById: new Map([["book1", "id-a"]]),
    };
    const r = resolveDiaryIdentityOwnershipForLegacyRow(
      {
        email: "orphan@ljd.invalid",
        profileId: "p1",
        diaryBookId: "book1",
      },
      evidence,
    );
    expect(r.class).toBe("BOUND");
    expect(r.identityId).toBe("id-a");
    expect(r.evidence).toBe("identity_owned_diary_book");
  });

  it("AMBIGUOUS on settings vs diary book conflict", () => {
    const evidence: DiaryBackfillEvidence = {
      ...empty,
      settingsByEmail: new Map([["a@ljd.invalid", "id-a"]]),
      diaryBookIdentityById: new Map([["book1", "id-b"]]),
    };
    const r = resolveDiaryIdentityOwnershipForLegacyRow(
      { email: "a@ljd.invalid", profileId: "p1", diaryBookId: "book1" },
      evidence,
    );
    expect(r.class).toBe("AMBIGUOUS");
  });
});
