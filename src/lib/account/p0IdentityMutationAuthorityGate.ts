/**
 * AI-X6.7B5 — P0 identity mutation-authority gate.
 * Default OFF. Local/test only when explicitly enabled.
 *
 * Enable: LJD_P0_IDENTITY_MUTATION_AUTHORITY_ENABLED=YES|1
 *
 * Independent from READ_SHADOW / READ_AUTHORITY / DUAL_WRITE.
 */

export const P0_IDENTITY_MUTATION_AUTHORITY_FLAG =
  "LJD_P0_IDENTITY_MUTATION_AUTHORITY_ENABLED" as const;

export function isP0IdentityMutationAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[P0_IDENTITY_MUTATION_AUTHORITY_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
