/**
 * AI-X6.7B4 — P0 identity-scoped read helpers (Profile / Journal / Settings).
 * Used when LJD_P0_IDENTITY_READ_AUTHORITY_ENABLED is ON.
 */

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import {
  buildP0OwnedProfileWhere,
  buildP0OwnedRowWhere,
  resolveP0IdentityReadAccess,
  type P0IdentityReadAccess,
} from "@/lib/account/p0IdentityReadContract";
import { loadAccountSettingsForP0Ownership } from "@/lib/account/accountSettingsP0Ownership";
import { prisma as defaultPrisma } from "@/lib/db";

export type P0ReadDenied = {
  ok: false;
  code:
    | "IDENTITY_UNAVAILABLE"
    | "UNBOUND"
    | "AMBIGUOUS"
    | "MISMATCH"
    | "NOT_AUTHORIZED"
    | "NOT_FOUND";
  reason: string;
};

export async function listProfilesForP0Identity(input: {
  ownership: P0OwnershipResolution;
  includeArchived?: boolean;
  db?: typeof defaultPrisma;
}): Promise<
  | { ok: true; profiles: Array<{ id: string; nickname: string; identityId: string | null }> }
  | P0ReadDenied
> {
  const access = await resolveP0IdentityReadAccess(input.ownership, {
    db: input.db,
  });
  if (!access.ok) {
    return {
      ok: false,
      code: access.reason === "verified_session_required" ? "IDENTITY_UNAVAILABLE" : access.reason,
      reason: access.reason,
    };
  }
  const db = input.db ?? defaultPrisma;
  const profiles = await db.profile.findMany({
    where: buildP0OwnedProfileWhere({
      identityId: access.identityId,
      explicitHistoricalEmails: access.explicitHistoricalEmails,
      includeArchived: input.includeArchived,
    }),
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, identityId: true },
  });
  return { ok: true, profiles };
}

/**
 * Direct profileId lookup — must belong to resolved identity.
 * Knowing another user's profileId never grants access.
 */
export async function authorizeProfileIdForP0Identity(input: {
  ownership: P0OwnershipResolution;
  profileId: string;
  db?: typeof defaultPrisma;
}): Promise<{ ok: true; profileId: string } | P0ReadDenied> {
  const access = await resolveP0IdentityReadAccess(input.ownership, {
    db: input.db,
  });
  if (!access.ok) {
    return {
      ok: false,
      code: access.reason === "verified_session_required" ? "IDENTITY_UNAVAILABLE" : access.reason,
      reason: access.reason,
    };
  }
  const db = input.db ?? defaultPrisma;
  const profile = await db.profile.findFirst({
    where: {
      id: input.profileId,
      ...buildP0OwnedProfileWhere({
        identityId: access.identityId,
        explicitHistoricalEmails: access.explicitHistoricalEmails,
        includeArchived: false,
      }),
    },
    select: { id: true },
  });
  if (!profile) {
    return { ok: false, code: "NOT_AUTHORIZED", reason: "profile_not_owned" };
  }
  return { ok: true, profileId: profile.id };
}

export async function listJournalEntriesForP0Identity(input: {
  ownership: P0OwnershipResolution;
  profileId?: string;
  createdAtGte?: Date;
  createdAtLt?: Date;
  take?: number;
  orderBy?: "asc" | "desc";
  db?: typeof defaultPrisma;
}): Promise<{ ok: true; entryIds: string[]; entries: Array<{ id: string }> } | P0ReadDenied> {
  const access = await resolveP0IdentityReadAccess(input.ownership, {
    db: input.db,
  });
  if (!access.ok) {
    return {
      ok: false,
      code: access.reason === "verified_session_required" ? "IDENTITY_UNAVAILABLE" : access.reason,
      reason: access.reason,
    };
  }
  if (input.profileId) {
    const authz = await authorizeProfileIdForP0Identity({
      ownership: input.ownership,
      profileId: input.profileId,
      db: input.db,
    });
    if (!authz.ok) return authz;
  }
  const db = input.db ?? defaultPrisma;
  const ownershipWhere = buildP0OwnedRowWhere({
    identityId: access.identityId,
    explicitHistoricalEmails: access.explicitHistoricalEmails,
  });
  const entries = await db.journalEntry.findMany({
    where: {
      AND: [
        ownershipWhere,
        ...(input.profileId ? [{ profileId: input.profileId }] : []),
        ...(input.createdAtGte || input.createdAtLt
          ? [
              {
                createdAt: {
                  ...(input.createdAtGte ? { gte: input.createdAtGte } : {}),
                  ...(input.createdAtLt ? { lt: input.createdAtLt } : {}),
                },
              },
            ]
          : []),
      ],
    },
    orderBy: { createdAt: input.orderBy ?? "desc" },
    take: input.take ?? 500,
    select: { id: true },
  });
  return {
    ok: true,
    entryIds: entries.map((e) => e.id),
    entries,
  };
}

/**
 * Direct JournalEntry id lookup — must match identity ownership.
 */
export async function authorizeJournalEntryIdForP0Identity(input: {
  ownership: P0OwnershipResolution;
  entryId: string;
  db?: typeof defaultPrisma;
}): Promise<{ ok: true; entryId: string } | P0ReadDenied> {
  const access = await resolveP0IdentityReadAccess(input.ownership, {
    db: input.db,
  });
  if (!access.ok) {
    return {
      ok: false,
      code: access.reason === "verified_session_required" ? "IDENTITY_UNAVAILABLE" : access.reason,
      reason: access.reason,
    };
  }
  const db = input.db ?? defaultPrisma;
  const entry = await db.journalEntry.findFirst({
    where: {
      id: input.entryId,
      ...buildP0OwnedRowWhere({
        identityId: access.identityId,
        explicitHistoricalEmails: access.explicitHistoricalEmails,
      }),
    },
    select: { id: true },
  });
  if (!entry) {
    return { ok: false, code: "NOT_AUTHORIZED", reason: "entry_not_owned" };
  }
  return { ok: true, entryId: entry.id };
}

export async function loadAccountSettingsForP0Read(input: {
  ownership: P0OwnershipResolution;
  db?: typeof defaultPrisma;
}) {
  return loadAccountSettingsForP0Ownership(input.ownership, { db: input.db });
}

export function describeP0ReadAccessDenial(access: P0IdentityReadAccess): string {
  if (access.ok) return "ok";
  return access.reason;
}
