/**
 * Feature gate for Production journal POST idempotency (4B-4Y).
 * Default OFF — existing POST behavior unchanged until explicitly enabled.
 *
 * Enable: LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED=YES
 * (also accepts "1" for operator convenience)
 */

export const JOURNAL_SAVE_IDEMPOTENCY_FLAG =
  "LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED" as const;

export function isJournalSaveIdempotencyEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[JOURNAL_SAVE_IDEMPOTENCY_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
