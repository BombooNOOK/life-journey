import type { JournalSocialPostPhotoAdjust } from "./photoAdjust";
import type { JournalSocialPostTemplateId } from "./templates";

export const JOURNAL_SOCIAL_POST_IMAGE_SIZE = {
  widthPx: 1080,
  heightPx: 1350,
} as const;

export type JournalSocialPostImageInput = {
  templateId: JournalSocialPostTemplateId;
  title: string;
  bodyExcerpt: string;
  todayNumber: number | null;
  monthNumber: number | null;
  yearNumber: number | null;
  moodLabel: string;
  commentExcerpt: string;
  photoBuffer: Buffer | null;
  /** 保存済み正方形写真の SNS 枠内トリミング（日記には保存しない） */
  photoAdjust?: JournalSocialPostPhotoAdjust;
  companionType: string;
  /** sns02 リボン用 */
  dateRibbonYear: string;
  dateRibbonMonthDay: string;
  /** sns03 方眼紙用 */
  dateScrapbook: string;
};

export type JournalSocialPostImageResult = {
  buffer: Buffer;
  basename: string;
};
