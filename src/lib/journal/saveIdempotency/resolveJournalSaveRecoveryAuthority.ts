/**
 * Resolve which actorKeys may be used for JSO recovery lookup (AI-X6.4).
 *
 * FLAG OFF → single legacy cookie-email actorKey (no resolver I/O).
 * FLAG ON  → require resolved identity; use actorLookupKeys only
 *            (firebase:<UID> + explicit LegacyActorClaim actorKeys).
 *            Never append current email. Never fall back to cookie email.
 *
 * Server-side only.
 */

import {
  resolveVerifiedViewerActorIdentity,
  type ResolveVerifiedViewerActorIdentityDeps,
} from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import { normalizeEmail } from "@/lib/auth/viewer";
import type { StableJsoWriteRejectReason } from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";
import { isStableJsoRecoveryEnabled } from "@/lib/journal/saveIdempotency/stableJsoRecoveryGate";

export type JournalSaveRecoveryAuthority =
  | {
      mode: "legacy";
      actorKeys: string[];
    }
  | {
      mode: "stable";
      actorKeys: string[];
      firebaseUid: string;
      identityId: string;
    }
  | {
      mode: "stable_rejected";
      reason: StableJsoWriteRejectReason;
    };

export type ResolveJournalSaveRecoveryAuthorityDeps =
  ResolveVerifiedViewerActorIdentityDeps & {
    isStableRecoveryEnabled?: () => boolean;
  };

/**
 * Decide authorized actorKey set for save-operation recovery.
 * SELECT-only identity resolution when stable recovery is enabled.
 */
export async function resolveJournalSaveRecoveryAuthority(
  viewerEmail: string,
  deps: ResolveJournalSaveRecoveryAuthorityDeps = {},
): Promise<JournalSaveRecoveryAuthority> {
  const legacyActorKey = normalizeEmail(viewerEmail);
  const isStableRecoveryEnabled =
    deps.isStableRecoveryEnabled ?? (() => isStableJsoRecoveryEnabled());

  if (!isStableRecoveryEnabled()) {
    return {
      mode: "legacy",
      actorKeys: legacyActorKey ? [legacyActorKey] : [],
    };
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

  // resolved — use resolver lookup keys only (stable + explicit claims).
  const actorKeys = Array.isArray(resolution.actorLookupKeys)
    ? resolution.actorLookupKeys.filter(
        (k): k is string => typeof k === "string" && k.length > 0,
      )
    : [];

  if (actorKeys.length === 0 || actorKeys[0] !== resolution.stableActorKey) {
    return { mode: "stable_rejected", reason: "stable_identity_unavailable" };
  }

  // Defense: current verified email must not appear unless explicitly claimed.
  const verifiedEmail = resolution.verifiedEmailMetadata;
  if (
    verifiedEmail &&
    !resolution.legacyActorKeys.includes(verifiedEmail) &&
    actorKeys.includes(verifiedEmail)
  ) {
    return { mode: "stable_rejected", reason: "stable_identity_unavailable" };
  }

  return {
    mode: "stable",
    actorKeys,
    firebaseUid: resolution.firebaseUid,
    identityId: resolution.identityId,
  };
}
