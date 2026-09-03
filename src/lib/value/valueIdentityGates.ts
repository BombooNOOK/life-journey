/**
 * AI-X6.7B7B — P1A value/commerce identity gates.
 * Default OFF. Local/test only when explicitly enabled.
 * Never enable via Production/Vercel mutation in this phase.
 */

export const P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG =
  "LJD_P1_VALUE_IDENTITY_READ_AUTHORITY_ENABLED" as const;

export const P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG =
  "LJD_P1_VALUE_IDENTITY_MUTATION_AUTHORITY_ENABLED" as const;

export const P1_VALUE_IDENTITY_DUAL_WRITE_FLAG =
  "LJD_P1_VALUE_IDENTITY_DUAL_WRITE_ENABLED" as const;

function flagOn(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  name: string,
): boolean {
  const v = (env[name] ?? "").trim();
  return v === "YES" || v === "1";
}

export function isP1ValueIdentityReadAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG);
}

export function isP1ValueIdentityMutationAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG);
}

export function isP1ValueIdentityDualWriteEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_VALUE_IDENTITY_DUAL_WRITE_FLAG);
}
