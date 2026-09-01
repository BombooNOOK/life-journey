/**
 * Pure shadow comparison: legacy cookie actorKey vs stable resolver result (AI-X6.2).
 *
 * Diagnostic only — never authorizes product reads/writes.
 * Current cookie email matching verified session email is NOT ownership proof.
 * Authorized keys = firebase:<UID> + explicit LegacyActorClaim actorKeys only.
 */

import { isFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import type { ResolveVerifiedViewerActorIdentityResult } from "@/lib/auth/resolveVerifiedViewerActorIdentity";

export type JournalIdentityShadowState =
  | "shadow_disabled"
  | "verified_session_required"
  | "identity_not_bound"
  | "identity_incomplete"
  | "stable_resolved_cookie_is_stable"
  | "stable_resolved_cookie_is_explicit_legacy_claim"
  | "stable_resolved_cookie_not_authorized"
  | "stable_resolved_invalid"
  | "shadow_observation_error";

export type JournalIdentityShadowCookieActorKind =
  | "stable"
  | "explicit_legacy_claim"
  | "unauthorized"
  | "unavailable"
  | "none";

export type JournalIdentityShadowCompareResult = {
  state: JournalIdentityShadowState;
  hasVerifiedSession: boolean;
  identityBound: boolean;
  legacyClaimCount: number;
  cookieActorAuthorized: boolean;
  cookieActorKind: JournalIdentityShadowCookieActorKind;
};

export type CompareLegacyCookieActorInput = {
  /** Normalized cookie-derived actorKey currently used as authority. */
  legacyCookieActorKey: string;
  stableResolution: ResolveVerifiedViewerActorIdentityResult;
};

/**
 * Compare cookie actorKey against stable resolution. Pure; no I/O.
 */
export function compareLegacyCookieActorToStableResolution(
  input: CompareLegacyCookieActorInput,
): JournalIdentityShadowCompareResult {
  const cookie = typeof input.legacyCookieActorKey === "string"
    ? input.legacyCookieActorKey
    : "";
  const resolution = input.stableResolution;

  if (resolution.state === "verified_session_required") {
    return {
      state: "verified_session_required",
      hasVerifiedSession: false,
      identityBound: false,
      legacyClaimCount: 0,
      cookieActorAuthorized: false,
      cookieActorKind: cookie ? "unavailable" : "none",
    };
  }

  if (resolution.state === "identity_not_bound") {
    return {
      state: "identity_not_bound",
      hasVerifiedSession: true,
      identityBound: false,
      legacyClaimCount: 0,
      cookieActorAuthorized: false,
      cookieActorKind: cookie ? "unavailable" : "none",
    };
  }

  if (resolution.state === "identity_incomplete") {
    return {
      state: "identity_incomplete",
      hasVerifiedSession: true,
      identityBound: Boolean(resolution.identityId),
      legacyClaimCount: 0,
      cookieActorAuthorized: false,
      cookieActorKind: cookie ? "unavailable" : "none",
    };
  }

  // resolved
  const { stableActorKey, actorLookupKeys, legacyActorKeys } = resolution;
  if (
    !stableActorKey ||
    !isFirebaseActorKey(stableActorKey) ||
    !Array.isArray(actorLookupKeys) ||
    actorLookupKeys.length === 0 ||
    actorLookupKeys[0] !== stableActorKey
  ) {
    return {
      state: "stable_resolved_invalid",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount: Array.isArray(legacyActorKeys) ? legacyActorKeys.length : 0,
      cookieActorAuthorized: false,
      cookieActorKind: cookie ? "unavailable" : "none",
    };
  }

  const claimSet = new Set(legacyActorKeys);
  const lookupSet = new Set(actorLookupKeys);
  const legacyClaimCount = legacyActorKeys.length;

  if (!cookie) {
    return {
      state: "stable_resolved_cookie_not_authorized",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount,
      cookieActorAuthorized: false,
      cookieActorKind: "none",
    };
  }

  if (cookie === stableActorKey) {
    return {
      state: "stable_resolved_cookie_is_stable",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount,
      cookieActorAuthorized: true,
      cookieActorKind: "stable",
    };
  }

  if (claimSet.has(cookie)) {
    return {
      state: "stable_resolved_cookie_is_explicit_legacy_claim",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount,
      cookieActorAuthorized: true,
      cookieActorKind: "explicit_legacy_claim",
    };
  }

  // Cookie matches verified email metadata alone is NOT authorization.
  // Only membership in actorLookupKeys (stable + explicit claims) counts.
  if (!lookupSet.has(cookie)) {
    return {
      state: "stable_resolved_cookie_not_authorized",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount,
      cookieActorAuthorized: false,
      cookieActorKind: "unauthorized",
    };
  }

  // In lookup set but neither stable nor claim — should not happen; fail closed.
  return {
    state: "stable_resolved_invalid",
    hasVerifiedSession: true,
    identityBound: true,
    legacyClaimCount,
    cookieActorAuthorized: false,
    cookieActorKind: "unavailable",
  };
}
