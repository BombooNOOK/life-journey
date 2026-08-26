/**
 * Resolve the actorKey used for NEW JournalSaveOperation writes (AI-X6.3).
 *
 * FLAG OFF → legacy normalizeEmail(cookie viewer email). No resolver I/O.
 * FLAG ON  → require resolved AccountIdentity; actorKey = firebase:<UID>.
 *            Fail closed. Never silently fall back to email (would split
 *            the same saveOperationId across actor scopes).
 *
 * Legacy claims never select the new-write key.
 * Historical lookup expansion is NOT done here (X6.4).
 *
 * Server-side only.
 */

import { buildFirebaseActorKey, isFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  resolveVerifiedViewerActorIdentity,
  type ResolveVerifiedViewerActorIdentityDeps,
} from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import { normalizeEmail } from "@/lib/auth/viewer";
import { isStableJsoWriteAuthorityEnabled } from "@/lib/journal/saveIdempotency/stableJsoWriteAuthorityGate";

export type StableJsoWriteRejectReason =
  | "verified_session_required"
  | "identity_not_bound"
  | "identity_incomplete"
  | "stable_identity_unavailable";

export type JournalSaveWriteActorResolution =
  | {
      mode: "legacy";
      actorKey: string;
    }
  | {
      mode: "stable";
      actorKey: string;
      firebaseUid: string;
      identityId: string;
    }
  | {
      mode: "stable_rejected";
      reason: StableJsoWriteRejectReason;
    };

export type ResolveJournalSaveWriteActorKeyDeps =
  ResolveVerifiedViewerActorIdentityDeps & {
    isStableWriteEnabled?: () => boolean;
  };

/**
 * Decide the JSO / rollout actorKey for a save or capability request.
 * Does not write identity or product rows.
 */
export async function resolveJournalSaveWriteActorKey(
  viewerEmail: string,
  deps: ResolveJournalSaveWriteActorKeyDeps = {},
): Promise<JournalSaveWriteActorResolution> {
  const legacyActorKey = normalizeEmail(viewerEmail);
  const isStableWriteEnabled =
    deps.isStableWriteEnabled ?? (() => isStableJsoWriteAuthorityEnabled());

  if (!isStableWriteEnabled()) {
    return { mode: "legacy", actorKey: legacyActorKey };
  }

  let resolution;
  try {
    resolution = await resolveVerifiedViewerActorIdentity({
      getSession: deps.getSession,
      db: deps.db,
    });
  } catch {
    return { mode: "stable_rejected", reason: "stable_identity_unavailable" };
  }

  if (resolution.state === "verified_session_required") {
    return { mode: "stable_rejected", reason: "verified_session_required" };
  }
  if (resolution.state === "identity_not_bound") {
    return { mode: "stable_rejected", reason: "identity_not_bound" };
  }
  if (resolution.state === "identity_incomplete") {
    return { mode: "stable_rejected", reason: "identity_incomplete" };
  }

  // resolved — use stable key only; never pick a legacy claim for new writes.
  const expectedStable = buildFirebaseActorKey(resolution.firebaseUid);
  if (
    !resolution.stableActorKey ||
    !isFirebaseActorKey(resolution.stableActorKey) ||
    resolution.stableActorKey !== expectedStable
  ) {
    return { mode: "stable_rejected", reason: "stable_identity_unavailable" };
  }

  return {
    mode: "stable",
    actorKey: resolution.stableActorKey,
    firebaseUid: resolution.firebaseUid,
    identityId: resolution.identityId,
  };
}

/** Public HTTP mapping for stable-write rejection (no UID/email). */
export function stableJsoWriteRejectHttp(reason: StableJsoWriteRejectReason): {
  status: number;
  body: {
    error: string;
    code: "STABLE_IDENTITY_REQUIRED";
    state: StableJsoWriteRejectReason;
  };
} {
  const status =
    reason === "verified_session_required"
      ? 401
      : reason === "stable_identity_unavailable"
        ? 503
        : 409;

  return {
    status,
    body: {
      error: "安定したアカウント識別子を確認できませんでした。",
      code: "STABLE_IDENTITY_REQUIRED",
      state: reason,
    },
  };
}
