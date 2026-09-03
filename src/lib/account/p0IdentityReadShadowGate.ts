/**
 * AI-X6.7B3 — P0 product read-shadow diagnostics gate.
 * Default OFF. Observe only; never changes user-visible reads.
 *
 * Enable: LJD_P0_IDENTITY_READ_SHADOW_ENABLED=YES|1
 */

export const P0_IDENTITY_READ_SHADOW_FLAG =
  "LJD_P0_IDENTITY_READ_SHADOW_ENABLED" as const;

export function isP0IdentityReadShadowEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[P0_IDENTITY_READ_SHADOW_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
