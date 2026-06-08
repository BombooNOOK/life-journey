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

export type AdminProfileDeleteBindingBlockDetail = {
  kind: "diary" | "kantei";
  requestId: string;
  code: string;
  status: string;
  statusLabel: string;
  baseOrderNumber: string | null;
  hasBaseOrderNumber: boolean;
  diaryBookId?: string | null;
  orderId?: string | null;
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
  blockingDiaryBinding: AdminProfileDeleteBindingBlockDetail | null;
  blockingKanteiBinding: AdminProfileDeleteBindingBlockDetail | null;
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
  photoBlobWarnings: string[];
};
