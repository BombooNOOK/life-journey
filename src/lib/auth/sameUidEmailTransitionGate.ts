/**
 * Server-only gate for same-UID AccountIdentityEmail transition (AI-X6.7C1.5A2-I2).
 * Default OFF — no email lifecycle mutation until explicitly enabled.
 *
 * Enable: LJD_SAME_UID_EMAIL_TRANSITION_ENABLED=YES|1
 * Requires also verified session + identity binding (checked by caller).
 * Never expose via NEXT_PUBLIC_*.
 */

export const SAME_UID_EMAIL_TRANSITION_FLAG =
  "LJD_SAME_UID_EMAIL_TRANSITION_ENABLED" as const;

export function isSameUidEmailTransitionEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[SAME_UID_EMAIL_TRANSITION_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
