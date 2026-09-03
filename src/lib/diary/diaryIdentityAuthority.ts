/**
 * AI-X6.7B7A — Diary-history identity ownership authority.
 *
 * Canonical owner: AccountIdentity.id
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT DIARY HISTORY OWNERSHIP.
 *
 * IDENTITY_REBIND_ALLOWED = NO
 */

import type { PrismaClient } from "@prisma/client";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import {
  loadExplicitHistoricalEmails,
  resolveP0IdentityReadAccess,
} from "@/lib/account/p0IdentityReadContract";
import { dualWriteIdentityIdOrNull } from "@/lib/account/p0IdentityOwnership";
import { prisma as defaultPrisma } from "@/lib/db";
import {
  isP1DiaryIdentityDualWriteEnabled,
  isP1DiaryIdentityMutationAuthorityEnabled,
  isP1DiaryIdentityReadAuthorityEnabled,
} from "@/lib/diary/diaryIdentityGates";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

export const IDENTITY_REBIND_ALLOWED = false as const;

export type DiaryAuthState =
  | "AUTHORIZED"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "MISMATCH"
  | "NOT_FOUND"
  | "NOT_OWNED"
  | "IDENTITY_UNAVAILABLE";

export type DiaryAuthResult =
  | {
      state: "AUTHORIZED";
      identityId: string;
      boundIdentityId: boolean;
      objectId: string;
    }
  | {
      state: Exclude<DiaryAuthState, "AUTHORIZED">;
      reason: string;
      objectId?: string;
    };

function denyFromOwnership(
  ownership: P0OwnershipResolution,
): DiaryAuthResult | null {
  if (ownership.state === "BOUND" && ownership.identityId) return null;
  if (ownership.state === "MISMATCH") {
    return { state: "MISMATCH", reason: ownership.reason };
  }
  if (ownership.state === "AMBIGUOUS") {
    return { state: "AMBIGUOUS", reason: ownership.reason };
  }
  if (ownership.state === "UNBOUND") {
    return { state: "UNBOUND", reason: ownership.reason };
  }
  return { state: "IDENTITY_UNAVAILABLE", reason: "not_bound" };
}

function emailInExplicit(
  email: string,
  explicit: ReadonlyArray<string>,
): boolean {
  const n = email.trim().toLowerCase();
  return explicit.some((e) => e.trim().toLowerCase() === n);
}

async function authorizeOwnedRow(input: {
  ownership: P0OwnershipResolution;
  objectId: string;
  objectIdentityId: string | null;
  objectEmail: string;
  bindOnAuthorize: boolean;
  bind: (identityId: string) => Promise<number>;
  recheck: () => Promise<string | null>;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const denied = denyFromOwnership(input.ownership);
  if (denied) return { ...denied, objectId: input.objectId };

  const access = await resolveP0IdentityReadAccess(input.ownership, {
    db: input.db,
  });
  if (!access.ok) {
    return {
      state:
        access.reason === "verified_session_required"
          ? "IDENTITY_UNAVAILABLE"
          : access.reason,
      reason: access.reason,
      objectId: input.objectId,
    };
  }

  if (input.objectIdentityId && input.objectIdentityId === access.identityId) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: input.objectId,
    };
  }

  if (input.objectIdentityId && input.objectIdentityId !== access.identityId) {
    return {
      state: "NOT_OWNED",
      reason: "identity_mismatch_rebind_forbidden",
      objectId: input.objectId,
    };
  }

  // null identityId — Option B only with explicit historical evidence
  if (!emailInExplicit(input.objectEmail, access.explicitHistoricalEmails)) {
    return {
      state: "NOT_OWNED",
      reason: "null_identity_without_explicit_historical_evidence",
      objectId: input.objectId,
    };
  }

  if (!input.bindOnAuthorize) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: input.objectId,
    };
  }

  const updated = await input.bind(access.identityId);
  if (updated === 0) {
    const again = await input.recheck();
    if (again === access.identityId) {
      return {
        state: "AUTHORIZED",
        identityId: access.identityId,
        boundIdentityId: false,
        objectId: input.objectId,
      };
    }
    return {
      state: "NOT_OWNED",
      reason: "concurrent_bind_conflict",
      objectId: input.objectId,
    };
  }

  return {
    state: "AUTHORIZED",
    identityId: access.identityId,
    boundIdentityId: true,
    objectId: input.objectId,
  };
}

export async function authorizeJournalDraftMutation(input: {
  ownership: P0OwnershipResolution;
  draftId: string;
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const db = input.db ?? defaultPrisma;
  const row = await db.journalDraft.findUnique({
    where: { id: input.draftId },
    select: { id: true, identityId: true, email: true },
  });
  if (!row) {
    return { state: "NOT_FOUND", reason: "draft_missing", objectId: input.draftId };
  }
  return authorizeOwnedRow({
    ownership: input.ownership,
    objectId: row.id,
    objectIdentityId: row.identityId,
    objectEmail: row.email,
    bindOnAuthorize: input.bindOnAuthorize !== false,
    db,
    bind: async (identityId) =>
      (
        await db.journalDraft.updateMany({
          where: { id: row.id, identityId: null },
          data: { identityId },
        })
      ).count,
    recheck: async () =>
      (
        await db.journalDraft.findUnique({
          where: { id: row.id },
          select: { identityId: true },
        })
      )?.identityId ?? null,
  });
}

export async function authorizeDiaryBookAccess(input: {
  ownership: P0OwnershipResolution;
  bookId: string;
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const db = input.db ?? defaultPrisma;
  const row = await db.diaryBook.findUnique({
    where: { id: input.bookId },
    select: { id: true, identityId: true, email: true },
  });
  if (!row) {
    return { state: "NOT_FOUND", reason: "book_missing", objectId: input.bookId };
  }
  return authorizeOwnedRow({
    ownership: input.ownership,
    objectId: row.id,
    objectIdentityId: row.identityId,
    objectEmail: row.email,
    bindOnAuthorize: input.bindOnAuthorize !== false,
    db,
    bind: async (identityId) =>
      (
        await db.diaryBook.updateMany({
          where: { id: row.id, identityId: null },
          data: { identityId },
        })
      ).count,
    recheck: async () =>
      (
        await db.diaryBook.findUnique({
          where: { id: row.id },
          select: { identityId: true },
        })
      )?.identityId ?? null,
  });
}

export async function authorizeDiaryBookshelfAccess(input: {
  ownership: P0OwnershipResolution;
  shelfId: string;
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const db = input.db ?? defaultPrisma;
  const row = await db.diaryBookshelfBook.findUnique({
    where: { id: input.shelfId },
    select: { id: true, identityId: true, email: true },
  });
  if (!row) {
    return { state: "NOT_FOUND", reason: "shelf_missing", objectId: input.shelfId };
  }
  return authorizeOwnedRow({
    ownership: input.ownership,
    objectId: row.id,
    objectIdentityId: row.identityId,
    objectEmail: row.email,
    bindOnAuthorize: input.bindOnAuthorize !== false,
    db,
    bind: async (identityId) =>
      (
        await db.diaryBookshelfBook.updateMany({
          where: { id: row.id, identityId: null },
          data: { identityId },
        })
      ).count,
    recheck: async () =>
      (
        await db.diaryBookshelfBook.findUnique({
          where: { id: row.id },
          select: { identityId: true },
        })
      )?.identityId ?? null,
  });
}

export async function authorizeDiaryBindingAccess(input: {
  ownership: P0OwnershipResolution;
  bindingId: string;
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const db = input.db ?? defaultPrisma;
  const row = await db.diaryBookBindingRequest.findUnique({
    where: { id: input.bindingId },
    select: { id: true, identityId: true, email: true, diaryBookId: true },
  });
  if (!row) {
    return {
      state: "NOT_FOUND",
      reason: "binding_missing",
      objectId: input.bindingId,
    };
  }

  // If linked to a DiaryBook, parent ownership must match (cross-domain safety).
  if (row.diaryBookId) {
    const book = await db.diaryBook.findUnique({
      where: { id: row.diaryBookId },
      select: { identityId: true },
    });
    if (
      book?.identityId &&
      input.ownership.state === "BOUND" &&
      input.ownership.identityId &&
      book.identityId !== input.ownership.identityId
    ) {
      return {
        state: "NOT_OWNED",
        reason: "diary_book_parent_identity_mismatch",
        objectId: input.bindingId,
      };
    }
  }

  return authorizeOwnedRow({
    ownership: input.ownership,
    objectId: row.id,
    objectIdentityId: row.identityId,
    objectEmail: row.email,
    bindOnAuthorize: input.bindOnAuthorize !== false,
    db,
    bind: async (identityId) =>
      (
        await db.diaryBookBindingRequest.updateMany({
          where: { id: row.id, identityId: null },
          data: { identityId },
        })
      ).count,
    recheck: async () =>
      (
        await db.diaryBookBindingRequest.findUnique({
          where: { id: row.id },
          select: { identityId: true },
        })
      )?.identityId ?? null,
  });
}

/** Profile must belong to same identity when creating under a profile context. */
export async function assertProfileBelongsToIdentity(input: {
  ownership: P0OwnershipResolution;
  profileId: string;
  db?: PrismaClient;
}): Promise<DiaryAuthResult> {
  const denied = denyFromOwnership(input.ownership);
  if (denied) return denied;
  const db = input.db ?? defaultPrisma;
  const profile = await db.profile.findUnique({
    where: { id: input.profileId },
    select: { id: true, identityId: true, email: true },
  });
  if (!profile) {
    return { state: "NOT_FOUND", reason: "profile_missing", objectId: input.profileId };
  }
  if (profile.identityId && profile.identityId === input.ownership.identityId) {
    return {
      state: "AUTHORIZED",
      identityId: input.ownership.identityId!,
      boundIdentityId: false,
      objectId: profile.id,
    };
  }
  if (profile.identityId && profile.identityId !== input.ownership.identityId) {
    return {
      state: "NOT_OWNED",
      reason: "profile_identity_mismatch",
      objectId: profile.id,
    };
  }
  // null profile identity: require explicit historical email evidence
  const emails = await loadExplicitHistoricalEmails(input.ownership.identityId!, {
    db,
  });
  if (!emailInExplicit(profile.email, emails)) {
    return {
      state: "NOT_OWNED",
      reason: "profile_null_without_explicit_evidence",
      objectId: profile.id,
    };
  }
  return {
    state: "AUTHORIZED",
    identityId: input.ownership.identityId!,
    boundIdentityId: false,
    objectId: profile.id,
  };
}

export function diaryCreateIdentityFields(input: {
  ownership: P0OwnershipResolution;
}): { identityId?: string } {
  const id = dualWriteIdentityIdOrNull({
    dualWriteEnabled:
      isP1DiaryIdentityDualWriteEnabled() ||
      isP1DiaryIdentityMutationAuthorityEnabled(),
    ownership: input.ownership,
  });
  return id ? { identityId: id } : {};
}

export function shouldUseDiaryIdentityRead(): boolean {
  return isP1DiaryIdentityReadAuthorityEnabled();
}

export function shouldUseDiaryIdentityMutation(): boolean {
  return isP1DiaryIdentityMutationAuthorityEnabled();
}

export async function resolveDiaryOwnershipOrNull(): Promise<P0OwnershipResolution | null> {
  if (
    !isP1DiaryIdentityReadAuthorityEnabled() &&
    !isP1DiaryIdentityMutationAuthorityEnabled()
  ) {
    return null;
  }
  return resolveValueIdentityOwnership();
}

/** Mixed-read where: identityId OR (null + explicit historical emails). */
export function diaryIdentityOrExplicitEmailWhere(input: {
  identityId: string;
  explicitHistoricalEmails: string[];
  profileId?: string;
}): {
  OR: Array<Record<string, unknown>>;
  profileId?: string;
} {
  const emails = input.explicitHistoricalEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const or: Array<Record<string, unknown>> = [{ identityId: input.identityId }];
  if (emails.length > 0) {
    or.push({ identityId: null, email: { in: emails } });
  }
  return input.profileId
    ? { OR: or, profileId: input.profileId }
    : { OR: or };
}
