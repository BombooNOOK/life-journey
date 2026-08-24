/**
 * Server-only gate for verified AccountIdentity self-binding (AI-8.3a).
 * Default OFF — no identity writes until explicitly enabled.
 *
 * Requires BOTH:
 *   LJD_IDENTITY_BINDING_ENABLED=YES|1
 *   LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 *
 * Binding still needs a valid verified lj_session; legacy cookies are never enough.
 */

export const IDENTITY_BINDING_FLAG = "LJD_IDENTITY_BINDING_ENABLED" as const;

export function isIdentityBindingEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[IDENTITY_BINDING_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
