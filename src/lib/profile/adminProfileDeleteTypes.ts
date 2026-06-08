export const ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS = [
  "profileReviewed",
  "backupReviewed",
  "journalDataReviewed",
  "noOrderBindingReviewed",
] as const;

export type AdminProfileDeleteConfirmationKey =
  (typeof ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS)[number];

export type AdminProfileDeleteConfirmations = Record<AdminProfileDeleteConfirmationKey, boolean>;

export const ADMIN_PROFILE_DELETE_CONFIRMATION_WORD = "削除する";

export type AdminProfileListItem = {
  id: string;
  nickname: string;
  createdAt: string;
};

export type AdminProfileDeletePreview = {
  targetEmail: string;
  profileId: string;
  profileNickname: string;
  journalEntryCount: number;
  photoCount: number;
  diaryBookCount: number;
  bookshelfBookCount: number;
  orderCount: number;
  diaryBindingCount: number;
  kanteiBindingCount: number;
  hasBaseOrderNumber: boolean;
  canDelete: boolean;
  blockCode: string | null;
  blockMessage: string | null;
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
  photoBlobWarnings: string[];
};
