/**
 * AI-X6.7B3 — P0 identity ownership dual-write gate.
 * Default OFF. Local/test only when explicitly enabled.
 *
 * Enable: LJD_P0_IDENTITY_DUAL_WRITE_ENABLED=YES|1
 *
 * Never enable via Production/Vercel mutation in this phase.
 */

export const P0_IDENTITY_DUAL_WRITE_FLAG =
  "LJD_P0_IDENTITY_DUAL_WRITE_ENABLED" as const;

export function isP0IdentityDualWriteEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[P0_IDENTITY_DUAL_WRITE_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
