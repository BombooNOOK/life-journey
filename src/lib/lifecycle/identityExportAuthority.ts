/**
 * AI-X6.7B7D — Identity-authorized export selection helpers.
 * Never includes rows merely because row.email == currentEmail.
 */

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { authorizeProfileIdForP0Identity } from "@/lib/account/p0IdentityReads";
import { prisma } from "@/lib/db";
import { isIdentityExportAuthorityEnabled } from "@/lib/lifecycle/lifecycleIdentityGates";
import {
  lifecycleOwnedWhere,
  resolveLifecycleSubject,
  type LifecycleSubject,
} from "@/lib/lifecycle/lifecycleSubject";

export type ExportRowAliases = {
  journalEntryIds: string[];
  journalDraftIds: string[];
  diaryBookIds: string[];
  bookshelfIds: string[];
  diaryBindingIds: string[];
};

/**
 * List identity-owned export row aliases for a profile scope.
 * Used by attack-matrix tests and by backup filtering.
 */
export async function listIdentityExportRowAliases(input: {
  subject: Extract<LifecycleSubject, { state: "BOUND" }>;
  ownership: P0OwnershipResolution;
  profileId: string;
}): Promise<ExportRowAliases | { ok: false; reason: string }> {
  const profileAuth = await authorizeProfileIdForP0Identity({
    ownership: input.ownership,
    profileId: input.profileId,
  });
  if (!profileAuth.ok) {
    return { ok: false, reason: "profile_not_owned" };
  }

  const where = lifecycleOwnedWhere({
    identityId: input.subject.identityId,
    explicitHistoricalEmails: input.subject.explicitHistoricalEmails,
    profileId: input.profileId,
  });

  const [entries, drafts, books, shelves, bindings] = await Promise.all([
    prisma.journalEntry.findMany({
      where: where as never,
      select: { id: true },
    }),
    prisma.journalDraft.findMany({
      where: where as never,
      select: { id: true },
    }),
    prisma.diaryBook.findMany({
      where: where as never,
      select: { id: true },
    }),
    prisma.diaryBookshelfBook.findMany({
      where: where as never,
      select: { id: true },
    }),
    prisma.diaryBookBindingRequest.findMany({
      where: where as never,
      select: { id: true },
    }),
  ]);

  return {
    journalEntryIds: entries.map((e) => e.id),
    journalDraftIds: drafts.map((d) => d.id),
    diaryBookIds: books.map((b) => b.id),
    bookshelfIds: shelves.map((s) => s.id),
    diaryBindingIds: bindings.map((b) => b.id),
  };
}

export async function buildJournalBackupDataUnderAuthority(params: {
  viewerEmail: string;
  profileId: string;
  profileNickname: string;
  exportedAt?: Date;
}): Promise<
  | {
      ok: true;
      legacy?: true;
      built: Awaited<
        ReturnType<typeof import("@/lib/journal/journalBackupExport").buildJournalBackupData>
      >;
      rowAliases?: ExportRowAliases;
    }
  | { ok: false; reason: string; state: string }
> {
  const { buildJournalBackupData } = await import("@/lib/journal/journalBackupExport");

  if (!isIdentityExportAuthorityEnabled()) {
    const built = await buildJournalBackupData(params);
    return { ok: true, legacy: true, built };
  }

  const subject = await resolveLifecycleSubject();
  if (subject.state !== "BOUND") {
    return { ok: false, reason: subject.reason, state: subject.state };
  }

  const { resolveP0IdentityOwnership } = await import(
    "@/lib/account/p0IdentityOwnership"
  );
  const ownership = await resolveP0IdentityOwnership();
  const aliases = await listIdentityExportRowAliases({
    subject,
    ownership,
    profileId: params.profileId,
  });
  if ("ok" in aliases && aliases.ok === false) {
    return { ok: false, reason: aliases.reason, state: "NOT_OWNED" };
  }

  const rowAliases = aliases as ExportRowAliases;
  // Build via historical explicit email (never current-email-alone authority).
  const exportEmail =
    subject.explicitHistoricalEmails[0] ?? params.viewerEmail;
  const built = await buildJournalBackupData({
    ...params,
    viewerEmail: exportEmail,
  });

  const ownedEntries = new Set(rowAliases.journalEntryIds);
  const ownedBooks = new Set(rowAliases.diaryBookIds);
  built.document.entries = built.document.entries.filter((e) =>
    ownedEntries.has(e.id),
  );
  built.document.diaryBooks = built.document.diaryBooks.filter((b) =>
    ownedBooks.has(b.id),
  );
  built.photoJobs = built.photoJobs.filter((j) => ownedEntries.has(j.entryId));

  return { ok: true, built, rowAliases };
}

export function countExportTransfer(input: {
  uidAEntryIds: readonly string[];
  exportedEntryIds: readonly string[];
}): number {
  const a = new Set(input.uidAEntryIds);
  return input.exportedEntryIds.filter((id) => a.has(id)).length;
}
