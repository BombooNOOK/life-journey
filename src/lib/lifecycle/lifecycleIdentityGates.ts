/**
 * AI-X6.7B7D — Identity lifecycle security gates.
 * Default OFF. Local/test only.
 */

export const LJD_IDENTITY_EXPORT_AUTHORITY_FLAG =
  "LJD_IDENTITY_EXPORT_AUTHORITY_ENABLED" as const;
export const LJD_IDENTITY_RESTORE_AUTHORITY_FLAG =
  "LJD_IDENTITY_RESTORE_AUTHORITY_ENABLED" as const;
export const LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG =
  "LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_ENABLED" as const;
export const LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG =
  "LJD_IDENTITY_SUPPORT_AUTHORITY_ENABLED" as const;

function flagOn(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  name: string,
): boolean {
  const v = (env[name] ?? "").trim();
  return v === "YES" || v === "1";
}

export function isIdentityExportAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, LJD_IDENTITY_EXPORT_AUTHORITY_FLAG);
}

export function isIdentityRestoreAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, LJD_IDENTITY_RESTORE_AUTHORITY_FLAG);
}

export function isIdentityAccountDeleteAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG);
}

export function isIdentitySupportAuthorityEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return flagOn(env, LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG);
}
