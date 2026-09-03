/**
 * AI-X6.7B4 — Canonical P0 identity-read contract + mixed-backfill rule.
 *
 * Authorization = identityId-based.
 * profileId may narrow results; never elevates ownership.
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT HISTORICAL OWNERSHIP.
 *
 * Mixed-backfill transition (chosen: Option B):
 *   identityId = resolvedIdentityId
 *   OR (identityId IS NULL AND email ∈ explicitHistoricalEmails)
 *
 * explicitHistoricalEmails come ONLY from:
 *   - AccountSettings.email where settings.identityId = resolvedIdentityId
 *   - explicit LegacyActorClaim.actorKey for that identity
 *
 * Never from current authenticated email alone.
 */

import type { Prisma } from "@prisma/client";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma as defaultPrisma } from "@/lib/db";

export type P0IdentityReadAccess =
  | { ok: true; identityId: string; explicitHistoricalEmails: string[] }
  | {
      ok: false;
      reason:
        | "UNBOUND"
        | "AMBIGUOUS"
        | "MISMATCH"
        | "IDENTITY_UNAVAILABLE"
        | "verified_session_required";
    };

export function accessFromP0Ownership(
  ownership: P0OwnershipResolution,
): P0IdentityReadAccess {
  if (ownership.state === "BOUND" && ownership.identityId) {
    return {
      ok: true,
      identityId: ownership.identityId,
      // Caller should enrich with loadExplicitHistoricalEmails
      explicitHistoricalEmails: [...ownership.legacyActorKeys],
    };
  }
  if (ownership.state === "MISMATCH") {
    return { ok: false, reason: "MISMATCH" };
  }
  if (ownership.state === "AMBIGUOUS") {
    return { ok: false, reason: "AMBIGUOUS" };
  }
  if (ownership.state === "UNBOUND") {
    return { ok: false, reason: "UNBOUND" };
  }
  return { ok: false, reason: "IDENTITY_UNAVAILABLE" };
}

/**
 * Load emails that are already explicitly bound to this identity
 * (settings email + legacy claims). Never invent from session email alone.
 */
export async function loadExplicitHistoricalEmails(
  identityId: string,
  deps: { db?: typeof defaultPrisma } = {},
): Promise<string[]> {
  const db = deps.db ?? defaultPrisma;
  const [settings, claims] = await Promise.all([
    db.accountSettings.findFirst({
      where: { identityId },
      select: { email: true },
    }),
    db.accountIdentityLegacyActorClaim.findMany({
      where: { identityId },
      select: { actorKey: true },
    }),
  ]);
  const out = new Set<string>();
  if (settings?.email) out.add(settings.email.trim().toLowerCase());
  for (const c of claims) {
    if (c.actorKey) out.add(c.actorKey.trim().toLowerCase());
  }
  return [...out];
}

export async function resolveP0IdentityReadAccess(
  ownership: P0OwnershipResolution,
  deps: { db?: typeof defaultPrisma } = {},
): Promise<P0IdentityReadAccess> {
  const base = accessFromP0Ownership(ownership);
  if (!base.ok) return base;
  const emails = await loadExplicitHistoricalEmails(base.identityId, deps);
  // Merge claim keys already on ownership
  for (const e of base.explicitHistoricalEmails) {
    if (e) emails.push(e.trim().toLowerCase());
  }
  return {
    ok: true,
    identityId: base.identityId,
    explicitHistoricalEmails: [...new Set(emails)],
  };
}

/**
 * Prisma where for identity-owned rows during hybrid transition (Option B).
 * Does NOT include current auth email unless it appears in explicitHistoricalEmails.
 */
export function buildP0OwnedRowWhere(input: {
  identityId: string;
  explicitHistoricalEmails: ReadonlyArray<string>;
}): Prisma.JournalEntryWhereInput {
  const emails = input.explicitHistoricalEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) {
    return { identityId: input.identityId };
  }
  return {
    OR: [
      { identityId: input.identityId },
      { identityId: null, email: { in: emails } },
    ],
  };
}

export function buildP0OwnedProfileWhere(input: {
  identityId: string;
  explicitHistoricalEmails: ReadonlyArray<string>;
  includeArchived?: boolean;
}): Prisma.ProfileWhereInput {
  const ownership = buildP0OwnedRowWhere(input) as Prisma.ProfileWhereInput;
  if (input.includeArchived) return ownership;
  return { AND: [ownership, { isArchived: false }] };
}
