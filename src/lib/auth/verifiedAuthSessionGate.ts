/**
 * Feature gate for Firebase verified session foundation (AI-8.1a).
 * Default OFF — legacy /api/auth/session and cookie identity unchanged.
 *
 * Enable: LJD_VERIFIED_AUTH_SESSION_ENABLED=YES
 * (also accepts "1" for operator convenience)
 */

export const VERIFIED_AUTH_SESSION_FLAG = "LJD_VERIFIED_AUTH_SESSION_ENABLED" as const;

export function isVerifiedAuthSessionEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[VERIFIED_AUTH_SESSION_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
