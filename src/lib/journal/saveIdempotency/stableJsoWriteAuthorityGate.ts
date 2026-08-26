/**
 * Server-only gate for stable JournalSaveOperation write authority (AI-X6.3).
 * Default OFF — new JSO writes keep legacy email actorKey until explicitly enabled.
 *
 * Enable: LJD_STABLE_JSO_WRITE_AUTHORITY_ENABLED=YES|1
 *
 * Do NOT enable in Vercel Preview/Production until X6.4 recovery is also ON
 * and X6.6 native pending-intent identity is ready. write-ON/recovery-OFF is
 * unsafe (see assessStableJsoFlagCombination).
 */

export const STABLE_JSO_WRITE_AUTHORITY_FLAG =
  "LJD_STABLE_JSO_WRITE_AUTHORITY_ENABLED" as const;

export function isStableJsoWriteAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[STABLE_JSO_WRITE_AUTHORITY_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
