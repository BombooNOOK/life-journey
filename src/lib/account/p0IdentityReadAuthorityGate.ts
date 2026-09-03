/**
 * AI-X6.7B4 — P0 identity read-authority gate.
 * Default OFF. Local/test only when explicitly enabled.
 *
 * Enable: LJD_P0_IDENTITY_READ_AUTHORITY_ENABLED=YES|1
 *
 * Independent from read-shadow and dual-write gates.
 * Never enable via Production/Vercel mutation in this phase.
 */

export const P0_IDENTITY_READ_AUTHORITY_FLAG =
  "LJD_P0_IDENTITY_READ_AUTHORITY_ENABLED" as const;

export function isP0IdentityReadAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[P0_IDENTITY_READ_AUTHORITY_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
