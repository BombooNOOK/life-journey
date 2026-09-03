/**
 * AI-X6.7B7D — Canonical lifecycle subject = AccountIdentity.id
 * Resolved from verified Firebase UID. Current email = metadata only.
 * Destructive ops: anything except BOUND → fail closed.
 */

import {
  resolveP0IdentityOwnership,
  type P0OwnershipResolution,
  type P0OwnershipResolverDeps,
} from "@/lib/account/p0IdentityOwnership";
import {
  loadExplicitHistoricalEmails,
  resolveP0IdentityReadAccess,
} from "@/lib/account/p0IdentityReadContract";
import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";

export type LifecycleSubject =
  | {
      state: "BOUND";
      identityId: string;
      firebaseUid: string;
      stableActorKey: string;
      explicitHistoricalEmails: string[];
      legacyActorKeys: string[];
      verifiedEmailMetadata: string;
    }
  | {
      state: "UNBOUND" | "AMBIGUOUS" | "MISMATCH";
      reason: string;
      firebaseUid: string | null;
      verifiedEmailMetadata: string;
    };

export async function resolveLifecycleSubject(
  deps: P0OwnershipResolverDeps = {},
): Promise<LifecycleSubject> {
  const ownership = await resolveP0IdentityOwnership(deps);
  return classifyLifecycleSubject(ownership, deps);
}

export async function classifyLifecycleSubject(
  ownership: P0OwnershipResolution,
  deps: P0OwnershipResolverDeps = {},
): Promise<LifecycleSubject> {
  if (ownership.state === "BOUND" && ownership.identityId && ownership.firebaseUid) {
    const access = await resolveP0IdentityReadAccess(ownership, { db: deps.db as never });
    const emails = access.ok
      ? access.explicitHistoricalEmails
      : await loadExplicitHistoricalEmails(ownership.identityId, {
          db: deps.db as never,
        });
    return {
      state: "BOUND",
      identityId: ownership.identityId,
      firebaseUid: ownership.firebaseUid,
      stableActorKey: buildFirebaseActorKey(ownership.firebaseUid),
      explicitHistoricalEmails: emails,
      legacyActorKeys: ownership.legacyActorKeys,
      verifiedEmailMetadata: ownership.verifiedEmailMetadata,
    };
  }
  if (ownership.state === "AMBIGUOUS") {
    return {
      state: "AMBIGUOUS",
      reason: ownership.reason,
      firebaseUid: ownership.firebaseUid,
      verifiedEmailMetadata: ownership.verifiedEmailMetadata,
    };
  }
  if (ownership.state === "MISMATCH") {
    return {
      state: "MISMATCH",
      reason: ownership.reason,
      firebaseUid: ownership.firebaseUid,
      verifiedEmailMetadata: ownership.verifiedEmailMetadata,
    };
  }
  return {
    state: "UNBOUND",
    reason: ownership.reason,
    firebaseUid: ownership.firebaseUid,
    verifiedEmailMetadata: ownership.verifiedEmailMetadata,
  };
}

/** Fail-closed guard for destructive lifecycle ops. */
export function requireBoundLifecycleSubject(
  subject: LifecycleSubject,
): Extract<LifecycleSubject, { state: "BOUND" }> | null {
  if (subject.state === "BOUND") return subject;
  return null;
}

/** Prisma where for identity-owned rows (Option B legacy null + explicit emails). */
export function lifecycleOwnedWhere(input: {
  identityId: string;
  explicitHistoricalEmails: readonly string[];
  profileId?: string;
}): Record<string, unknown> {
  const emails = input.explicitHistoricalEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const or: Array<Record<string, unknown>> = [{ identityId: input.identityId }];
  if (emails.length > 0) {
    or.push({ identityId: null, email: { in: emails } });
  }
  if (input.profileId) {
    return { AND: [{ OR: or }, { profileId: input.profileId }] };
  }
  return { OR: or };
}

export function jsoActorKeysForSubject(
  subject: Extract<LifecycleSubject, { state: "BOUND" }>,
): string[] {
  const keys = new Set<string>();
  keys.add(subject.stableActorKey);
  for (const k of subject.legacyActorKeys) {
    if (k.trim()) keys.add(k.trim().toLowerCase());
  }
  for (const e of subject.explicitHistoricalEmails) {
    if (e.trim()) keys.add(e.trim().toLowerCase());
  }
  return [...keys];
}
