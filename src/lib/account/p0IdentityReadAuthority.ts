/**
 * AI-X6.7B4 — Bridge: choose legacy email reads vs identity-authority reads.
 * Gate OFF → legacy unchanged. Gate ON → identity-scoped (fail closed).
 */

import { resolveP0IdentityOwnership } from "@/lib/account/p0IdentityOwnership";
import { isP0IdentityReadAuthorityEnabled } from "@/lib/account/p0IdentityReadAuthorityGate";
import {
  authorizeJournalEntryIdForP0Identity,
  authorizeProfileIdForP0Identity,
  listJournalEntriesForP0Identity,
  listProfilesForP0Identity,
} from "@/lib/account/p0IdentityReads";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export type ViewerProfile = {
  id: string;
  nickname: string;
};

/**
 * List profiles under current authority.
 * Legacy: email. Identity: identityId (+ explicit historical null rows).
 */
export async function listViewerProfilesUnderAuthority(
  viewerEmail: string,
): Promise<ViewerProfile[]> {
  if (!isP0IdentityReadAuthorityEnabled()) {
    const email = normalizeEmail(viewerEmail);
    if (!email) return [];
    const rows = await prisma.profile.findMany({
      where: { email, isArchived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, nickname: true },
    });
    return rows;
  }
  const ownership = await resolveP0IdentityOwnership();
  const result = await listProfilesForP0Identity({ ownership });
  if (!result.ok) return [];
  return result.profiles.map((p) => ({ id: p.id, nickname: p.nickname }));
}

export async function profileByIdUnderAuthority(
  profileId: string,
  viewerEmail: string,
): Promise<ViewerProfile | null> {
  if (!isP0IdentityReadAuthorityEnabled()) {
    const email = normalizeEmail(viewerEmail);
    if (!email) return null;
    return prisma.profile.findFirst({
      where: { id: profileId, email, isArchived: false },
      select: { id: true, nickname: true },
    });
  }
  const ownership = await resolveP0IdentityOwnership();
  const authz = await authorizeProfileIdForP0Identity({ ownership, profileId });
  if (!authz.ok) return null;
  return prisma.profile.findFirst({
    where: { id: profileId, isArchived: false },
    select: { id: true, nickname: true },
  });
}

export async function listJournalIdsUnderAuthority(input: {
  viewerEmail: string;
  profileId?: string;
  createdAtGte?: Date;
  createdAtLt?: Date;
  take?: number;
}): Promise<string[]> {
  if (!isP0IdentityReadAuthorityEnabled()) {
    const email = normalizeEmail(input.viewerEmail);
    if (!email) return [];
    const rows = await prisma.journalEntry.findMany({
      where: {
        email,
        ...(input.profileId ? { profileId: input.profileId } : {}),
        ...(input.createdAtGte || input.createdAtLt
          ? {
              createdAt: {
                ...(input.createdAtGte ? { gte: input.createdAtGte } : {}),
                ...(input.createdAtLt ? { lt: input.createdAtLt } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: input.take ?? 500,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  const ownership = await resolveP0IdentityOwnership();
  const result = await listJournalEntriesForP0Identity({
    ownership,
    profileId: input.profileId,
    createdAtGte: input.createdAtGte,
    createdAtLt: input.createdAtLt,
    take: input.take,
  });
  if (!result.ok) return [];
  return result.entryIds;
}

export async function authorizeJournalEntryUnderAuthority(input: {
  viewerEmail: string;
  entryId: string;
}): Promise<boolean> {
  if (!isP0IdentityReadAuthorityEnabled()) {
    const email = normalizeEmail(input.viewerEmail);
    if (!email) return false;
    const row = await prisma.journalEntry.findFirst({
      where: { id: input.entryId, email },
      select: { id: true },
    });
    return Boolean(row);
  }
  const ownership = await resolveP0IdentityOwnership();
  const authz = await authorizeJournalEntryIdForP0Identity({
    ownership,
    entryId: input.entryId,
  });
  return authz.ok;
}
