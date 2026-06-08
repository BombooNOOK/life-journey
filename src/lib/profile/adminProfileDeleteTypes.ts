export const ADMIN_PROFILE_DELETE_BASE_CONFIRMATION_KEYS = [
  "profileReviewed",
  "backupReviewed",
  "journalDataReviewed",
  "noOrderBindingReviewed",
] as const;

export const ADMIN_PROFILE_DELETE_KANTEI_DATA_CONFIRMATION_KEY = "kanteiDataReviewed" as const;

export type AdminProfileDeleteBaseConfirmationKey =
  (typeof ADMIN_PROFILE_DELETE_BASE_CONFIRMATION_KEYS)[number];

export type AdminProfileDeleteConfirmationKey =
  | AdminProfileDeleteBaseConfirmationKey
  | typeof ADMIN_PROFILE_DELETE_KANTEI_DATA_CONFIRMATION_KEY;

/** @deprecated 鑑定作成データなし時の必須キー一覧（後方互換） */
export const ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS = ADMIN_PROFILE_DELETE_BASE_CONFIRMATION_KEYS;

export type AdminProfileDeleteConfirmations = Record<AdminProfileDeleteConfirmationKey, boolean>;

export const ADMIN_PROFILE_DELETE_CONFIRMATION_WORD = "削除する";

export function requiredAdminProfileDeleteConfirmationKeys(
  hasKanteiCreationData: boolean,
): AdminProfileDeleteConfirmationKey[] {
  if (hasKanteiCreationData) {
    return [...ADMIN_PROFILE_DELETE_BASE_CONFIRMATION_KEYS, ADMIN_PROFILE_DELETE_KANTEI_DATA_CONFIRMATION_KEY];
  }
  return [...ADMIN_PROFILE_DELETE_BASE_CONFIRMATION_KEYS];
}

export type AdminProfileListItem = {
  id: string;
  nickname: string;
  createdAt: string;
};

export type AdminProfileDeleteDiaryBindingSummary = {
  id: string;
  diaryBookId: string | null;
  bindingProfileId: string;
  diaryBindingCode: string;
  status: string;
  baseOrderNumber: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfileDeleteKanteiBindingSummary = {
  id: string;
  orderId: string;
  bindingProfileId: string;
  kanteiCode: string;
  status: string;
  baseOrderNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfileDeleteKanteiCreationDataSummary = {
  id: string;
  kanteiCode: string | null;
  profileId: string;
  email: string;
  fullNameDisplay: string;
  birthDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  hasPdfPreviewBlob: boolean;
  hasPdfPrintBlob: boolean;
  hasNumerologyJson: boolean;
};

/** @deprecated AdminProfileDeleteKanteiCreationDataSummary を使用 */
export type AdminProfileDeleteOrderSummary = AdminProfileDeleteKanteiCreationDataSummary;

export type AdminProfileDeleteBindingBlockDetail = {
  kind: "diary" | "kantei";
  requestId: string;
  code: string;
  status: string;
  statusLabel: string;
  baseOrderNumber: string | null;
  hasBaseOrderNumber: boolean;
  diaryBookId?: string | null;
  kanteiCreationDataId?: string | null;
  bindingProfileId: string;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  blockSubCode: string;
  blockMessage: string;
  actionHint: string;
};

export type AdminProfileDeletePreview = {
  targetEmail: string;
  profileId: string;
  profileNickname: string;
  profileCreatedAt: string;
  profileUpdatedAt: string;
  journalEntryCount: number;
  photoCount: number;
  diaryBookCount: number;
  bookshelfBookCount: number;
  kanteiCreationDataCount: number;
  diaryBindingCount: number;
  kanteiBindingCount: number;
  hasBaseOrderNumber: boolean;
  requiresKanteiDataConfirmation: boolean;
  willDeleteKanteiData: boolean;
  canDelete: boolean;
  blockCode: string | null;
  blockMessage: string | null;
  blockingDiaryBinding: AdminProfileDeleteBindingBlockDetail | null;
  blockingKanteiBinding: AdminProfileDeleteBindingBlockDetail | null;
  kanteiCreationDataList: AdminProfileDeleteKanteiCreationDataSummary[];
  diaryBindings: AdminProfileDeleteDiaryBindingSummary[];
  kanteiBindings: AdminProfileDeleteKanteiBindingSummary[];
};

export type AdminProfileDeleteResult = {
  targetEmail: string;
  profileId: string;
  profileNickname: string;
  deletedJournalEntryCount: number;
  deletedPhotoBlobCount: number;
  failedPhotoBlobCount: number;
  deletedDiaryBookCount: number;
  deletedBookshelfBookCount: number;
  deletedDiaryBindingCount: number;
  deletedKanteiBindingCount: number;
  deletedKanteiCreationDataCount: number;
  deletedKanteiPdfBlobCount: number;
  failedKanteiPdfBlobCount: number;
  photoBlobWarnings: string[];
  kanteiPdfBlobWarnings: string[];
};
