/**
 * AI-X6.7B7B — Donguri identity-scoped balance / spend authority.
 *
 * Gate OFF → callers use legacy email/profile paths unchanged.
 * Gate ON → SUM / mutation authorize by AccountIdentity.id (+ profile context).
 *
 * CURRENT AUTH EMAIL ALONE NEVER grants balance or spend.
 */

import type { Prisma, PrismaClient } from "@prisma/client";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma as defaultPrisma } from "@/lib/db";
import {
  classifyValueObjectOwnership,
  resolveValueIdentityOwnership,
  valueDualWriteIdentityIdOrNull,
} from "@/lib/value/valueIdentityOwnership";
import {
  isP1ValueIdentityDualWriteEnabled,
  isP1ValueIdentityMutationAuthorityEnabled,
  isP1ValueIdentityReadAuthorityEnabled,
} from "@/lib/value/valueIdentityGates";

export type DonguriBalanceAuthResult =
  | { ok: true; identityId: string; balance: number }
  | {
      ok: false;
      state: "UNBOUND" | "AMBIGUOUS" | "MISMATCH" | "IDENTITY_UNAVAILABLE";
      balance: number;
      reason: string;
    };

export type DonguriSpendAuthResult =
  | { ok: true; identityId: string; writeIdentityId: string | null }
  | {
      ok: false;
      state:
        | "UNBOUND"
        | "AMBIGUOUS"
        | "MISMATCH"
        | "NOT_OWNED"
        | "IDENTITY_UNAVAILABLE";
      reason: string;
    };

function denyOwnership(
  ownership: P0OwnershipResolution,
): Exclude<DonguriBalanceAuthResult, { ok: true }> | null {
  if (ownership.state === "BOUND" && ownership.identityId) return null;
  if (ownership.state === "AMBIGUOUS") {
    return {
      ok: false,
      state: "AMBIGUOUS",
      balance: 0,
      reason: ownership.reason,
    };
  }
  if (ownership.state === "MISMATCH") {
    return {
      ok: false,
      state: "MISMATCH",
      balance: 0,
      reason: ownership.reason,
    };
  }
  return {
    ok: false,
    state: "UNBOUND",
    balance: 0,
    reason: ownership.reason,
  };
}

export function donguriLedgerWhereForIdentity(input: {
  identityId: string;
  profileId?: string | null;
}): Prisma.LogHouseDonguriLedgerEntryWhereInput {
  const profileId = input.profileId?.trim() || null;
  return profileId
    ? { identityId: input.identityId, profileId }
    : { identityId: input.identityId };
}

export async function sumDonguriBalanceForIdentity(input: {
  identityId: string;
  profileId: string;
  db?: PrismaClient;
}): Promise<number> {
  const db = input.db ?? defaultPrisma;
  const profileId = input.profileId.trim();
  if (!profileId) return 0;
  const agg = await db.logHouseDonguriLedgerEntry.aggregate({
    where: donguriLedgerWhereForIdentity({
      identityId: input.identityId,
      profileId,
    }),
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/**
 * Identity-mode balance. Fail-closed when ownership is not BOUND.
 */
export async function sumDonguriBalanceUnderValueAuthority(input: {
  profileId: string;
  ownership?: P0OwnershipResolution;
  db?: PrismaClient;
}): Promise<DonguriBalanceAuthResult> {
  const ownership =
    input.ownership ?? (await resolveValueIdentityOwnership());
  const denied = denyOwnership(ownership);
  if (denied) return denied;
  const identityId = ownership.identityId!;
  const balance = await sumDonguriBalanceForIdentity({
    identityId,
    profileId: input.profileId,
    db: input.db,
  });
  return { ok: true, identityId, balance };
}

/**
 * Authorize user-initiated spend / grant write under identity mode.
 * Does not authorize by email or by knowing another user's profileId/ledger ids.
 */
export async function authorizeDonguriSpendUnderValueAuthority(input: {
  profileId: string;
  ownership?: P0OwnershipResolution;
  /** Optional: when spending against an existing ledger context row. */
  targetLedgerIdentityId?: string | null;
}): Promise<DonguriSpendAuthResult> {
  const ownership =
    input.ownership ?? (await resolveValueIdentityOwnership());
  if (ownership.state !== "BOUND" || !ownership.identityId) {
    if (ownership.state === "AMBIGUOUS") {
      return { ok: false, state: "AMBIGUOUS", reason: ownership.reason };
    }
    if (ownership.state === "MISMATCH") {
      return { ok: false, state: "MISMATCH", reason: ownership.reason };
    }
    return { ok: false, state: "UNBOUND", reason: ownership.reason };
  }

  if (input.targetLedgerIdentityId !== undefined) {
    const objectState = classifyValueObjectOwnership({
      ownership,
      objectIdentityId: input.targetLedgerIdentityId,
    });
    if (objectState !== "BOUND") {
      return {
        ok: false,
        state: objectState === "NOT_OWNED" ? "NOT_OWNED" : objectState,
        reason: `ledger_object_${objectState.toLowerCase()}`,
      };
    }
  }

  const writeIdentityId = valueDualWriteIdentityIdOrNull({
    dualWriteEnabled: isP1ValueIdentityDualWriteEnabled(),
    ownership,
  });

  return {
    ok: true,
    identityId: ownership.identityId,
    writeIdentityId:
      writeIdentityId ??
      (isP1ValueIdentityMutationAuthorityEnabled()
        ? ownership.identityId
        : null),
  };
}

export function shouldUseDonguriIdentityRead(): boolean {
  return isP1ValueIdentityReadAuthorityEnabled();
}

export function shouldUseDonguriIdentityMutation(): boolean {
  return isP1ValueIdentityMutationAuthorityEnabled();
}

export function donguriCreateIdentityFields(input: {
  ownership: P0OwnershipResolution;
}): { identityId?: string } {
  const id = valueDualWriteIdentityIdOrNull({
    dualWriteEnabled:
      isP1ValueIdentityDualWriteEnabled() ||
      isP1ValueIdentityMutationAuthorityEnabled(),
    ownership: input.ownership,
  });
  return id ? { identityId: id } : {};
}
