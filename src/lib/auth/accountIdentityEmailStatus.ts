/**
 * AccountIdentityEmail.status values (AI-8.2).
 * Stored as String in Prisma (no enum) — matches existing schema style.
 */

export const ACCOUNT_IDENTITY_EMAIL_STATUS = {
  primary: "primary",
  retired: "retired",
} as const;

export type AccountIdentityEmailStatus =
  (typeof ACCOUNT_IDENTITY_EMAIL_STATUS)[keyof typeof ACCOUNT_IDENTITY_EMAIL_STATUS];

export function isAccountIdentityEmailStatus(
  value: string,
): value is AccountIdentityEmailStatus {
  return (
    value === ACCOUNT_IDENTITY_EMAIL_STATUS.primary ||
    value === ACCOUNT_IDENTITY_EMAIL_STATUS.retired
  );
}
