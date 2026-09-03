/**
 * AI-X6.7B7A — Diary-history backfill resolution.
 * Reuses B2/B7B evidence + identity-owned Profile + identity-owned DiaryBook parent.
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT OWNERSHIP.
 */

import {
  resolveValueIdentityOwnershipForLegacyRow,
  type ValueBackfillEvidence,
  type ValueBackfillResolution,
} from "@/lib/value/valueIdentityBackfill";

export type DiaryBackfillEvidence = ValueBackfillEvidence & {
  /** diaryBookId → identityId for DiaryBook rows with non-null identityId */
  diaryBookIdentityById: ReadonlyMap<string, string>;
};

export type DiaryBackfillResolution = ValueBackfillResolution & {
  evidence:
    | ValueBackfillResolution["evidence"]
    | "identity_owned_diary_book";
};

export function resolveDiaryIdentityOwnershipForLegacyRow(
  row: {
    email: string;
    profileId?: string | null;
    diaryBookId?: string | null;
  },
  evidence: DiaryBackfillEvidence,
): DiaryBackfillResolution {
  const diaryBookId = row.diaryBookId?.trim() || "";
  const fromBook = diaryBookId
    ? evidence.diaryBookIdentityById.get(diaryBookId) ?? null
    : null;

  const base = resolveValueIdentityOwnershipForLegacyRow(
    { email: row.email, profileId: row.profileId },
    evidence,
  );

  if (!fromBook) return base;

  if (base.class === "BOUND" && base.identityId) {
    if (base.identityId === fromBook) {
      return {
        ...base,
        evidence:
          base.evidence === "settings_identityId" ||
          base.evidence === "legacy_actor_claim" ||
          base.evidence === "identity_owned_profile"
            ? base.evidence
            : "identity_owned_diary_book",
      };
    }
    return {
      class: "AMBIGUOUS",
      identityId: null,
      evidence: "conflict",
      reason: "email_evidence_diary_book_conflict",
    };
  }

  if (base.class === "AMBIGUOUS") return base;

  return {
    class: "BOUND",
    identityId: fromBook,
    evidence: "identity_owned_diary_book",
    reason: "identity_owned_diary_book",
  };
}
