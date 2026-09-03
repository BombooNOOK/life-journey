/**
 * AI-X6.7B7A — P1A diary-history identity gates.
 * Default OFF. Local/test only when explicitly enabled.
 */

export const P1_DIARY_IDENTITY_READ_AUTHORITY_FLAG =
  "LJD_P1_DIARY_IDENTITY_READ_AUTHORITY_ENABLED" as const;

export const P1_DIARY_IDENTITY_MUTATION_AUTHORITY_FLAG =
  "LJD_P1_DIARY_IDENTITY_MUTATION_AUTHORITY_ENABLED" as const;

export const P1_DIARY_IDENTITY_DUAL_WRITE_FLAG =
  "LJD_P1_DIARY_IDENTITY_DUAL_WRITE_ENABLED" as const;

function flagOn(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  name: string,
): boolean {
  const v = (env[name] ?? "").trim();
  return v === "YES" || v === "1";
}

export function isP1DiaryIdentityReadAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_DIARY_IDENTITY_READ_AUTHORITY_FLAG);
}

export function isP1DiaryIdentityMutationAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_DIARY_IDENTITY_MUTATION_AUTHORITY_FLAG);
}

export function isP1DiaryIdentityDualWriteEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, P1_DIARY_IDENTITY_DUAL_WRITE_FLAG);
}
