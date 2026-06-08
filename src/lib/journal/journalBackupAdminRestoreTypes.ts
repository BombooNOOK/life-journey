export const ADMIN_RESTORE_CONFIRMATION_KEYS = [
  "zipReviewed",
  "targetEmailReviewed",
  "noOverwriteReviewed",
  "newProfileReviewed",
  "skippedItemsReviewed",
] as const;

export type AdminRestoreConfirmationKey = (typeof ADMIN_RESTORE_CONFIRMATION_KEYS)[number];

export type AdminRestoreConfirmations = Record<AdminRestoreConfirmationKey, boolean>;

export type AdminRestorePreviewIssue = {
  code: string;
  message: string;
};

export type AdminRestorePreviewPlan = {
  viewerEmail: string;
  sourceProfileNickname: string;
  restoreProfileNickname: string;
  entryCount: number;
  photoCount: number;
  skippedDiaryBooks: number;
  skippedBookshelfBooks: number;
};

export type AdminRestorePreview = {
  targetEmail: string;
  targetUserExists: boolean;
  sourceProfileId: string;
  sourceProfileNickname: string;
  restoreProfileNickname: string;
  entryCount: number;
  photoCount: number;
  skippedDiaryBooks: number;
  skippedBookshelfBooks: number;
  format: string;
  formatVersion: number;
  zipSizeBytes: number;
  validationOk: boolean;
  warnings: AdminRestorePreviewIssue[];
  profileLimitOk: boolean;
  profileLimit: number;
  profileCount: number;
  hasKanteiHints: boolean;
  plan: AdminRestorePreviewPlan;
};

export function buildAdminRestoreTempZipPathname(): string {
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `admin-restore-temp/${stamp}-${random}.zip`;
}
