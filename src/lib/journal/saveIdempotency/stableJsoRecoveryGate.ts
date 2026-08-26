/**
 * Server-only gate for claim-backed JournalSaveOperation recovery (AI-X6.4).
 * Default OFF — recovery remains cookie-email actorKey until explicitly enabled.
 *
 * Enable: LJD_STABLE_JSO_RECOVERY_ENABLED=YES|1
 *
 * Do NOT enable in Vercel Preview/Production until X6.6 (native) + rollout prep.
 */

export const STABLE_JSO_RECOVERY_FLAG = "LJD_STABLE_JSO_RECOVERY_ENABLED" as const;

export function isStableJsoRecoveryEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[STABLE_JSO_RECOVERY_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
