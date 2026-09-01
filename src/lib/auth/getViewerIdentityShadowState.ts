/**
 * Server helper: observe legacy lj_user_email vs verified lj_session (AI-8.1c).
 *
 * Read-only. Does not mutate cookies, DB, or API authority.
 */

import { cookies } from "next/headers";

import {
  resolveIdentityShadowState,
  type IdentityShadowResult,
} from "@/lib/auth/identityShadowState";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";
import { LJ_SESSION_COOKIE_NAME } from "@/lib/auth/verifiedSessionConstants";
import { getVerifiedViewerSession } from "@/lib/auth/verifiedSession";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export type { IdentityShadowResult, IdentityShadowState } from "@/lib/auth/identityShadowState";

/**
 * Compare legacy cookie identity with verified Firebase session for this request.
 * Never uses body/query email. Never rewrites cookies.
 */
export async function getViewerIdentityShadowState(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<IdentityShadowResult> {
  const verifiedAuthEnabled = isVerifiedAuthSessionEnabled(env);
  const legacyEmail = await getViewerEmailFromCookie();

  const store = await cookies();
  const verifiedSessionCookiePresent = Boolean(store.get(LJ_SESSION_COOKIE_NAME)?.value);

  // Only attempt verify when foundation flag is ON (fail-closed observation).
  const verifiedSession = verifiedAuthEnabled ? await getVerifiedViewerSession() : null;

  return resolveIdentityShadowState({
    verifiedAuthEnabled,
    legacyEmail,
    verifiedSession,
    verifiedSessionCookiePresent,
  });
}
