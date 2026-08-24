/**
 * Pure actor-key expansion for a stable AccountIdentity (AI-8.2).
 *
 * Does NOT query Prisma. Does NOT wire into Journal / JSO / rollout yet.
 *
 * Lookup set = derived firebase:<UID> + explicit legacy email actor claims only.
 * Current auth email is NEVER added automatically (auth email ≠ historical ownership).
 */

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";

export type LegacyActorClaimInput = {
  actorKey: string;
};

/**
 * Build the actorKey set used for future JSO / rollout lookups.
 * Order: stable firebase key first, then claim actorKeys in input order.
 * Duplicate actorKeys are preserved as given (caller may dedupe later).
 */
export function buildIdentityActorLookupKeys(
  firebaseUid: string,
  legacyClaims: ReadonlyArray<LegacyActorClaimInput>,
): string[] {
  const stable = buildFirebaseActorKey(firebaseUid);
  return [stable, ...legacyClaims.map((c) => c.actorKey)];
}
