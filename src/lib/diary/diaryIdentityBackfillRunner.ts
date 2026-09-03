/**
 * AI-X6.7B7A — Diary-history identity backfill runner.
 * DRY_RUN / APPLY. Null-only updates. Idempotent second APPLY.
 * Never mutates draft/book content, dates, binding status, or receipt fields.
 */

import type { PrismaClient } from "@prisma/client";

import {
  toReportEvidenceSource,
  type P0ReportEvidenceSource,
} from "@/lib/account/p0IdentityOwnershipBackfillApply";
import { loadValueBackfillEvidenceFromDb } from "@/lib/value/valueIdentityBackfillRunner";
import {
  resolveDiaryIdentityOwnershipForLegacyRow,
  type DiaryBackfillEvidence,
} from "@/lib/diary/diaryIdentityBackfill";

export type DiaryBackfillMode = "DRY_RUN" | "APPLY";

export type DiaryBackfillDecisionResult =
  | "BOUND"
  | "ALREADY_BOUND"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "CONFLICT";

export type DiaryBackfillTable =
  | "JournalDraft"
  | "DiaryBook"
  | "DiaryBookshelfBook"
  | "DiaryBookBindingRequest";

export type DiaryBackfillDecision = {
  rowAlias: string;
  table: DiaryBackfillTable;
  rowId: string;
  emailHashAlias: string;
  currentIdentityId: string | null;
  proposedIdentityId: string | null;
  result: DiaryBackfillDecisionResult;
  evidenceSource:
    | Exclude<P0ReportEvidenceSource, "CURRENT_AUTH_EMAIL_ONLY">
    | "IDENTITY_OWNED_PROFILE"
    | "IDENTITY_OWNED_DIARY_BOOK";
  reason: string;
};

function emailHashAlias(email: string): string {
  let h = 0;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `e${(h >>> 0).toString(16)}`;
}

function toEvidenceSource(
  evidence: ReturnType<typeof resolveDiaryIdentityOwnershipForLegacyRow>["evidence"],
): DiaryBackfillDecision["evidenceSource"] {
  if (evidence === "identity_owned_profile") return "IDENTITY_OWNED_PROFILE";
  if (evidence === "identity_owned_diary_book") return "IDENTITY_OWNED_DIARY_BOOK";
  const mapped = toReportEvidenceSource(evidence);
  if (mapped === "CURRENT_AUTH_EMAIL_ONLY") return "CONFLICT";
  return mapped;
}

function classifyRow(input: {
  rowAlias: string;
  table: DiaryBackfillTable;
  rowId: string;
  email: string;
  currentIdentityId: string | null;
  proposed: ReturnType<typeof resolveDiaryIdentityOwnershipForLegacyRow>;
}): DiaryBackfillDecision {
  const evidenceSource = toEvidenceSource(input.proposed.evidence);
  const proposedId = input.proposed.identityId;

  if (input.currentIdentityId) {
    if (
      input.proposed.class === "BOUND" &&
      proposedId &&
      proposedId === input.currentIdentityId
    ) {
      return {
        rowAlias: input.rowAlias,
        table: input.table,
        rowId: input.rowId,
        emailHashAlias: emailHashAlias(input.email),
        currentIdentityId: input.currentIdentityId,
        proposedIdentityId: proposedId,
        result: "ALREADY_BOUND",
        evidenceSource,
        reason: "already_bound_matches",
      };
    }
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: input.currentIdentityId,
      proposedIdentityId: proposedId,
      result: "CONFLICT",
      evidenceSource: "CONFLICT",
      reason: proposedId
        ? "existing_identity_conflicts_with_computed"
        : "existing_bind_with_unresolved_proposal",
    };
  }

  if (input.proposed.class === "BOUND" && proposedId) {
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: null,
      proposedIdentityId: proposedId,
      result: "BOUND",
      evidenceSource,
      reason: input.proposed.reason,
    };
  }
  if (input.proposed.class === "AMBIGUOUS") {
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: null,
      proposedIdentityId: null,
      result: "AMBIGUOUS",
      evidenceSource: "CONFLICT",
      reason: input.proposed.reason,
    };
  }
  return {
    rowAlias: input.rowAlias,
    table: input.table,
    rowId: input.rowId,
    emailHashAlias: emailHashAlias(input.email),
    currentIdentityId: null,
    proposedIdentityId: null,
    result: "UNBOUND",
    evidenceSource: "NONE",
    reason: input.proposed.reason,
  };
}

export async function loadDiaryBackfillEvidenceFromDb(
  prisma: PrismaClient,
): Promise<DiaryBackfillEvidence> {
  const base = await loadValueBackfillEvidenceFromDb(prisma);
  const books = await prisma.diaryBook.findMany({
    where: { identityId: { not: null } },
    select: { id: true, identityId: true },
  });
  const diaryBookIdentityById = new Map<string, string>();
  for (const b of books) {
    if (b.identityId) diaryBookIdentityById.set(b.id, b.identityId);
  }
  return { ...base, diaryBookIdentityById };
}

export async function runDiaryHistoryIdentityBackfill(
  prisma: PrismaClient,
  options: {
    mode: DiaryBackfillMode;
    emailFilter?: ReadonlySet<string>;
  },
): Promise<{
  mode: DiaryBackfillMode;
  decisions: DiaryBackfillDecision[];
  updatesByTable: Record<DiaryBackfillTable, number>;
  untouched: number;
  rowCounts: Record<DiaryBackfillTable, number>;
}> {
  const evidence = await loadDiaryBackfillEvidenceFromDb(prisma);
  const filter = options.emailFilter;

  const drafts = await prisma.journalDraft.findMany({
    select: { id: true, email: true, profileId: true, identityId: true },
  });
  const books = await prisma.diaryBook.findMany({
    select: { id: true, email: true, profileId: true, identityId: true },
  });
  const shelves = await prisma.diaryBookshelfBook.findMany({
    select: { id: true, email: true, profileId: true, identityId: true },
  });
  const bindings = await prisma.diaryBookBindingRequest.findMany({
    select: {
      id: true,
      email: true,
      profileId: true,
      identityId: true,
      diaryBookId: true,
    },
  });

  const decisions: DiaryBackfillDecision[] = [];

  const push = (
    table: DiaryBackfillTable,
    row: {
      id: string;
      email: string;
      profileId: string;
      identityId: string | null;
      diaryBookId?: string | null;
    },
  ) => {
    const email = row.email.trim().toLowerCase();
    if (filter && !filter.has(email)) return;
    const proposed = resolveDiaryIdentityOwnershipForLegacyRow(
      {
        email: row.email,
        profileId: row.profileId,
        diaryBookId: row.diaryBookId,
      },
      evidence,
    );
    decisions.push(
      classifyRow({
        rowAlias: `${table}:${row.id}`,
        table,
        rowId: row.id,
        email: row.email,
        currentIdentityId: row.identityId,
        proposed,
      }),
    );
  };

  for (const r of drafts) push("JournalDraft", r);
  for (const r of books) push("DiaryBook", r);
  for (const r of shelves) push("DiaryBookshelfBook", r);
  for (const r of bindings) push("DiaryBookBindingRequest", r);

  const updatesByTable: Record<DiaryBackfillTable, number> = {
    JournalDraft: 0,
    DiaryBook: 0,
    DiaryBookshelfBook: 0,
    DiaryBookBindingRequest: 0,
  };
  let untouched = 0;

  if (options.mode === "APPLY") {
    for (const d of decisions) {
      if (d.result !== "BOUND" || !d.proposedIdentityId) {
        untouched += 1;
        continue;
      }
      let count = 0;
      if (d.table === "JournalDraft") {
        count = (
          await prisma.journalDraft.updateMany({
            where: { id: d.rowId, identityId: null },
            data: { identityId: d.proposedIdentityId },
          })
        ).count;
      } else if (d.table === "DiaryBook") {
        count = (
          await prisma.diaryBook.updateMany({
            where: { id: d.rowId, identityId: null },
            data: { identityId: d.proposedIdentityId },
          })
        ).count;
      } else if (d.table === "DiaryBookshelfBook") {
        count = (
          await prisma.diaryBookshelfBook.updateMany({
            where: { id: d.rowId, identityId: null },
            data: { identityId: d.proposedIdentityId },
          })
        ).count;
      } else {
        count = (
          await prisma.diaryBookBindingRequest.updateMany({
            where: { id: d.rowId, identityId: null },
            data: { identityId: d.proposedIdentityId },
          })
        ).count;
      }
      updatesByTable[d.table] += count;
      if (count === 0) untouched += 1;
    }
  } else {
    untouched = decisions.filter((d) => d.result !== "BOUND").length;
  }

  const countTable = (t: DiaryBackfillTable) =>
    decisions.filter((d) => d.table === t).length;

  return {
    mode: options.mode,
    decisions,
    updatesByTable,
    untouched,
    rowCounts: {
      JournalDraft: countTable("JournalDraft"),
      DiaryBook: countTable("DiaryBook"),
      DiaryBookshelfBook: countTable("DiaryBookshelfBook"),
      DiaryBookBindingRequest: countTable("DiaryBookBindingRequest"),
    },
  };
}
