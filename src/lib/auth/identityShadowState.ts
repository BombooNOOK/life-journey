/**
 * Legacy vs verified identity shadow consistency (AI-8.1c).
 *
 * Pure observation only — does NOT change API authority, remap, or cookies.
 * Match compares normalized emails only; UID is retained as verified identity.
 */

import { normalizeEmail } from "@/lib/auth/viewer";

export type IdentityShadowState =
  | "disabled"
  | "empty"
  | "legacy_only"
  | "verified_only"
  | "match"
  | "email_mismatch"
  | "verified_invalid";

export type IdentityShadowResult = {
  state: IdentityShadowState;
  /** Present only when verified session decoded successfully. Not for public logs. */
  verifiedUid?: string;
  legacyEmailPresent: boolean;
  verifiedSessionPresent: boolean;
  verifiedSessionCookiePresent: boolean;
};

export type ResolveIdentityShadowInput = {
  verifiedAuthEnabled: boolean;
  /** Raw or normalized legacy cookie email; compared via normalizeEmail. */
  legacyEmail: string | null;
  /** Decoded verified session, or null if absent/invalid. */
  verifiedSession: { uid: string; email: string } | null;
  /** Whether the lj_session cookie byte-string is present (even if invalid). */
  verifiedSessionCookiePresent: boolean;
};

/**
 * Resolve shadow consistency without side effects.
 * email_mismatch does NOT assert that an email-change occurred.
 */
export function resolveIdentityShadowState(
  input: ResolveIdentityShadowInput,
): IdentityShadowResult {
  if (!input.verifiedAuthEnabled) {
    return {
      state: "disabled",
      legacyEmailPresent: Boolean(normalizeEmail(input.legacyEmail)),
      verifiedSessionPresent: false,
      verifiedSessionCookiePresent: input.verifiedSessionCookiePresent,
    };
  }

  const legacyEmail = normalizeEmail(input.legacyEmail);
  const legacyEmailPresent = Boolean(legacyEmail);
  const verified = input.verifiedSession;
  const verifiedSessionPresent = Boolean(verified?.uid && normalizeEmail(verified.email));
  const cookiePresent = input.verifiedSessionCookiePresent;

  if (cookiePresent && !verifiedSessionPresent) {
    return {
      state: "verified_invalid",
      legacyEmailPresent,
      verifiedSessionPresent: false,
      verifiedSessionCookiePresent: true,
    };
  }

  if (!legacyEmailPresent && !verifiedSessionPresent) {
    return {
      state: "empty",
      legacyEmailPresent: false,
      verifiedSessionPresent: false,
      verifiedSessionCookiePresent: false,
    };
  }

  if (legacyEmailPresent && !verifiedSessionPresent) {
    return {
      state: "legacy_only",
      legacyEmailPresent: true,
      verifiedSessionPresent: false,
      verifiedSessionCookiePresent: false,
    };
  }

  if (!legacyEmailPresent && verifiedSessionPresent && verified) {
    return {
      state: "verified_only",
      verifiedUid: verified.uid,
      legacyEmailPresent: false,
      verifiedSessionPresent: true,
      verifiedSessionCookiePresent: cookiePresent,
    };
  }

  // Both present — compare normalized emails only (not UID).
  const verifiedEmail = normalizeEmail(verified!.email);
  if (legacyEmail === verifiedEmail) {
    return {
      state: "match",
      verifiedUid: verified!.uid,
      legacyEmailPresent: true,
      verifiedSessionPresent: true,
      verifiedSessionCookiePresent: cookiePresent,
    };
  }

  return {
    state: "email_mismatch",
    verifiedUid: verified!.uid,
    legacyEmailPresent: true,
    verifiedSessionPresent: true,
    verifiedSessionCookiePresent: cookiePresent,
  };
}

/** Public/diagnostic projection — no raw UID/email. */
export function toPublicIdentityShadowReport(result: IdentityShadowResult): {
  state: IdentityShadowState;
  legacyPresent: boolean;
  verifiedPresent: boolean;
} {
  return {
    state: result.state,
    legacyPresent: result.legacyEmailPresent,
    verifiedPresent: result.verifiedSessionPresent,
  };
}
