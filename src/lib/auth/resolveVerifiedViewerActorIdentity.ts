/**
 * Stable actor resolver foundation (AI-X6.1).
 *
 * READ ONLY. Does NOT write AccountIdentity / Email / LegacyActorClaim.
 * Does NOT auto-bind unbound UIDs.
 * Does NOT wire Journal / JSO / product ownership authority yet (Gate X6 OPEN).
 *
 * Historical actorKeys come ONLY from explicit AccountIdentityLegacyActorClaim
 * rows. Current verified Firebase email is metadata and MUST NEVER be added
 * to actorLookupKeys unless that exact key exists as an explicit claim.
 *
 * Server-side only (Prisma + verified session). Do not import from client bundles.
 */

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { buildIdentityActorLookupKeys } from "@/lib/auth/identityActorLookupKeys";
import {
  getVerifiedViewerSession,
  type VerifiedViewerSession,
} from "@/lib/auth/verifiedSession";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma as defaultPrisma } from "@/lib/db";

export type VerifiedViewerActorIdentityState =
  | "verified_session_required"
  | "identity_not_bound"
  | "identity_incomplete"
  | "resolved";

export type ResolvedVerifiedViewerActorIdentity = {
  state: "resolved";
  firebaseUid: string;
  identityId: string;
  /** Canonical durable ownership key: firebase:<UID> */
  stableActorKey: string;
  /**
   * Lookup set for future ownership resolution:
   * [firebase:<UID>, ...explicit legacy claim actorKeys]
   * Current auth email is never implied.
   */
  actorLookupKeys: string[];
  /** Explicit claim actorKeys only (DB authorization records). */
  legacyActorKeys: string[];
  /** Mutable auth metadata — display only; not ownership authority. */
  verifiedEmailMetadata: string;
};

export type ResolveVerifiedViewerActorIdentityResult =
  | { state: "verified_session_required" }
  | {
      state: "identity_not_bound";
      firebaseUid: string;
      verifiedEmailMetadata: string;
    }
  | {
      state: "identity_incomplete";
      firebaseUid: string;
      identityId?: string;
      verifiedEmailMetadata: string;
      reason: string;
    }
  | ResolvedVerifiedViewerActorIdentity;

/** Minimal Prisma surface: SELECT-only. */
export type ActorIdentityResolverDb = {
  accountIdentity: {
    findUnique: typeof defaultPrisma.accountIdentity.findUnique;
  };
};

export type ResolveVerifiedViewerActorIdentityDeps = {
  getSession?: () => Promise<VerifiedViewerSession | null>;
  db?: ActorIdentityResolverDb;
};

function dedupePreserveOrder(keys: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Resolve verified Firebase session → AccountIdentity → explicit legacy claims
 * → stable actor lookup keys. Never creates rows. Never infers claims from email.
 */
export async function resolveVerifiedViewerActorIdentity(
  deps: ResolveVerifiedViewerActorIdentityDeps = {},
): Promise<ResolveVerifiedViewerActorIdentityResult> {
  const getSession = deps.getSession ?? getVerifiedViewerSession;
  const db = deps.db ?? defaultPrisma;

  const session = await getSession();
  if (!session?.uid) {
    return { state: "verified_session_required" };
  }

  const firebaseUid = session.uid;
  if (typeof firebaseUid !== "string" || firebaseUid.length === 0) {
    return { state: "verified_session_required" };
  }

  const verifiedEmailMetadata = normalizeEmail(
    typeof session.email === "string" ? session.email : "",
  );

  const identity = await db.accountIdentity.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      firebaseUid: true,
      legacyActorClaims: {
        select: { actorKey: true },
        orderBy: { claimedAt: "asc" },
      },
    },
  });

  if (!identity) {
    return {
      state: "identity_not_bound",
      firebaseUid,
      verifiedEmailMetadata,
    };
  }

  if (
    typeof identity.id !== "string" ||
    identity.id.length === 0 ||
    identity.firebaseUid !== firebaseUid
  ) {
    return {
      state: "identity_incomplete",
      firebaseUid,
      identityId: typeof identity.id === "string" ? identity.id : undefined,
      verifiedEmailMetadata,
      reason: "identity_row_invalid",
    };
  }

  const claimRows = Array.isArray(identity.legacyActorClaims)
    ? identity.legacyActorClaims
    : [];
  const legacyActorKeys = dedupePreserveOrder(
    claimRows.map((c) => (typeof c?.actorKey === "string" ? c.actorKey : "")),
  );

  const stableActorKey = buildFirebaseActorKey(firebaseUid);
  const actorLookupKeys = buildIdentityActorLookupKeys(
    firebaseUid,
    legacyActorKeys.map((actorKey) => ({ actorKey })),
  );

  // Defense: never let current email enter the set unless it was an explicit claim.
  if (
    verifiedEmailMetadata &&
    !legacyActorKeys.includes(verifiedEmailMetadata) &&
    actorLookupKeys.includes(verifiedEmailMetadata)
  ) {
    return {
      state: "identity_incomplete",
      firebaseUid,
      identityId: identity.id,
      verifiedEmailMetadata,
      reason: "implicit_email_authority_detected",
    };
  }

  return {
    state: "resolved",
    firebaseUid,
    identityId: identity.id,
    stableActorKey,
    actorLookupKeys,
    legacyActorKeys,
    verifiedEmailMetadata,
  };
}
