/**
 * AI-X6.7B5 — Canonical P0 mutation authority contract.
 *
 * AUTHORIZED | UNBOUND | AMBIGUOUS | MISMATCH | NOT_FOUND | NOT_OWNED
 *
 * Authority = identityId. CURRENT AUTH EMAIL ALONE NEVER authorizes mutation.
 *
 * Legacy NULL identityId rows (Option B):
 *   authorize + atomically bind identityId when ownership evidence is unique
 *   (settings-bound email / explicit LegacyActorClaim).
 *   Never use current auth email alone. Never rebind a different non-null identityId.
 *
 * IDENTITY_REBIND_ALLOWED = NO
 */

import type { PrismaClient } from "@prisma/client";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import {
  resolveP0IdentityReadAccess,
} from "@/lib/account/p0IdentityReadContract";
import { prisma as defaultPrisma } from "@/lib/db";

export type P0MutationAuthState =
  | "AUTHORIZED"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "MISMATCH"
  | "NOT_FOUND"
  | "NOT_OWNED"
  | "IDENTITY_UNAVAILABLE";

export type P0MutationAuthResult =
  | {
      state: "AUTHORIZED";
      identityId: string;
      /** True when this call bound a previously-null identityId */
      boundIdentityId: boolean;
      objectId: string;
    }
  | {
      state: Exclude<P0MutationAuthState, "AUTHORIZED">;
      reason: string;
      objectId?: string;
    };

function denyFromOwnership(
  ownership: P0OwnershipResolution,
): P0MutationAuthResult | null {
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

/**
 * Authorize mutation of an existing JournalEntry.
 * Option B: null identityId + explicit historical email → bind in transaction.
 */
export async function authorizeJournalEntryMutation(input: {
  ownership: P0OwnershipResolution;
  entryId: string;
  /** When true, bind null→identityId in a transaction (default true for mutations). */
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<P0MutationAuthResult> {
  const denied = denyFromOwnership(input.ownership);
  if (denied) return denied;

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
      objectId: input.entryId,
    };
  }

  const db = input.db ?? defaultPrisma;
  const bind = input.bindOnAuthorize !== false;

  const entry = await db.journalEntry.findUnique({
    where: { id: input.entryId },
    select: { id: true, identityId: true, email: true },
  });
  if (!entry) {
    return { state: "NOT_FOUND", reason: "entry_missing", objectId: input.entryId };
  }

  if (entry.identityId && entry.identityId === access.identityId) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: entry.id,
    };
  }

  if (entry.identityId && entry.identityId !== access.identityId) {
    return {
      state: "NOT_OWNED",
      reason: "identity_mismatch_rebind_forbidden",
      objectId: entry.id,
    };
  }

  // identityId IS NULL — Option B only with explicit historical evidence
  if (!emailInExplicit(entry.email, access.explicitHistoricalEmails)) {
    return {
      state: "NOT_OWNED",
      reason: "null_identity_without_explicit_historical_evidence",
      objectId: entry.id,
    };
  }

  if (!bind) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: entry.id,
    };
  }

  // Atomic bind: only update if still null (concurrency-safe). Never overwrite non-null.
  const updated = await db.journalEntry.updateMany({
    where: { id: entry.id, identityId: null },
    data: { identityId: access.identityId },
  });
  if (updated.count === 0) {
    // Concurrent bind or race — re-check
    const again = await db.journalEntry.findUnique({
      where: { id: entry.id },
      select: { identityId: true },
    });
    if (again?.identityId === access.identityId) {
      return {
        state: "AUTHORIZED",
        identityId: access.identityId,
        boundIdentityId: false,
        objectId: entry.id,
      };
    }
    return {
      state: "NOT_OWNED",
      reason: "concurrent_bind_conflict",
      objectId: entry.id,
    };
  }

  return {
    state: "AUTHORIZED",
    identityId: access.identityId,
    boundIdentityId: true,
    objectId: entry.id,
  };
}

/**
 * Authorize mutation of an existing Profile (update/archive).
 * Option B bind for null identityId with explicit evidence.
 */
export async function authorizeProfileMutation(input: {
  ownership: P0OwnershipResolution;
  profileId: string;
  bindOnAuthorize?: boolean;
  allowArchived?: boolean;
  db?: PrismaClient;
}): Promise<P0MutationAuthResult> {
  const denied = denyFromOwnership(input.ownership);
  if (denied) return denied;

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
      objectId: input.profileId,
    };
  }

  const db = input.db ?? defaultPrisma;
  const bind = input.bindOnAuthorize !== false;

  const profile = await db.profile.findUnique({
    where: { id: input.profileId },
    select: { id: true, identityId: true, email: true, isArchived: true },
  });
  if (!profile) {
    return {
      state: "NOT_FOUND",
      reason: "profile_missing",
      objectId: input.profileId,
    };
  }
  if (profile.isArchived && !input.allowArchived) {
    return {
      state: "NOT_OWNED",
      reason: "profile_archived",
      objectId: profile.id,
    };
  }

  if (profile.identityId && profile.identityId === access.identityId) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: profile.id,
    };
  }
  if (profile.identityId && profile.identityId !== access.identityId) {
    return {
      state: "NOT_OWNED",
      reason: "identity_mismatch_rebind_forbidden",
      objectId: profile.id,
    };
  }

  if (!emailInExplicit(profile.email, access.explicitHistoricalEmails)) {
    return {
      state: "NOT_OWNED",
      reason: "null_identity_without_explicit_historical_evidence",
      objectId: profile.id,
    };
  }

  if (!bind) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      boundIdentityId: false,
      objectId: profile.id,
    };
  }

  const updated = await db.profile.updateMany({
    where: { id: profile.id, identityId: null },
    data: { identityId: access.identityId },
  });
  if (updated.count === 0) {
    const again = await db.profile.findUnique({
      where: { id: profile.id },
      select: { identityId: true },
    });
    if (again?.identityId === access.identityId) {
      return {
        state: "AUTHORIZED",
        identityId: access.identityId,
        boundIdentityId: false,
        objectId: profile.id,
      };
    }
    return {
      state: "NOT_OWNED",
      reason: "concurrent_bind_conflict",
      objectId: profile.id,
    };
  }

  return {
    state: "AUTHORIZED",
    identityId: access.identityId,
    boundIdentityId: true,
    objectId: profile.id,
  };
}

/**
 * Authorize creating a JournalEntry under a profileId context.
 * Profile must be owned (or explicitly legacy-owned); never email alone.
 */
export async function authorizeJournalCreateUnderProfile(input: {
  ownership: P0OwnershipResolution;
  profileId: string;
  db?: PrismaClient;
}): Promise<P0MutationAuthResult> {
  return authorizeProfileMutation({
    ownership: input.ownership,
    profileId: input.profileId,
    bindOnAuthorize: true,
    db: input.db,
  });
}

/**
 * Authorize AccountSettings mutation by identityId.
 * Never updates a settings row bound to a different identity.
 */
export async function authorizeAccountSettingsMutation(input: {
  ownership: P0OwnershipResolution;
  /** Preferred: mutate by identity. Email metadata for create-compat only. */
  contactEmail?: string;
  db?: PrismaClient;
}): Promise<
  | {
      state: "AUTHORIZED";
      identityId: string;
      settingsId: string;
      mode: "identity" | "create_needed";
    }
  | P0MutationAuthResult
> {
  const denied = denyFromOwnership(input.ownership);
  if (denied) return denied;

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
    };
  }

  const db = input.db ?? defaultPrisma;
  const byIdentity = await db.accountSettings.findFirst({
    where: { identityId: access.identityId },
    select: { id: true, email: true, identityId: true },
  });
  if (byIdentity) {
    return {
      state: "AUTHORIZED",
      identityId: access.identityId,
      settingsId: byIdentity.id,
      mode: "identity",
    };
  }

  // No settings for identity yet — check contact email row does not belong elsewhere
  const contact = (input.contactEmail ?? input.ownership.verifiedEmailMetadata)
    .trim()
    .toLowerCase();
  if (contact) {
    const byEmail = await db.accountSettings.findUnique({
      where: { email: contact },
      select: { id: true, identityId: true },
    });
    if (byEmail?.identityId && byEmail.identityId !== access.identityId) {
      return {
        state: "MISMATCH",
        reason: "email_settings_bound_elsewhere",
        objectId: byEmail.id,
      };
    }
    if (byEmail && !byEmail.identityId) {
      // Bind null settings row to identity (Option B for settings)
      await db.accountSettings.updateMany({
        where: { id: byEmail.id, identityId: null },
        data: { identityId: access.identityId },
      });
      return {
        state: "AUTHORIZED",
        identityId: access.identityId,
        settingsId: byEmail.id,
        mode: "identity",
      };
    }
  }

  return {
    state: "AUTHORIZED",
    identityId: access.identityId,
    settingsId: "",
    mode: "create_needed",
  };
}

export const IDENTITY_REBIND_ALLOWED = false as const;
