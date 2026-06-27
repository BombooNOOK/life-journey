export const JOURNAL_SOCIAL_POST_IMAGE_SIZE = {
  widthPx: 1080,
  heightPx: 1350,
} as const;

export type JournalSocialPostImageInput = {
  title: string;
  dateLabel: string;
  bodyExcerpt: string;
  todayNumber: number | null;
  moodLabel: string;
  commentExcerpt: string;
  companionLabel: string;
  photoBuffer: Buffer | null;
};

export type JournalSocialPostImageResult = {
  buffer: Buffer;
  basename: string;
};
