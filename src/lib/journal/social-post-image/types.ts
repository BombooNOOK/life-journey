import type { JournalSocialPostPhotoAdjust } from "./photoAdjust";
import type { JournalSocialPostTemplateId } from "./templates";

export const JOURNAL_SOCIAL_POST_IMAGE_SIZE = {
  widthPx: 1080,
  heightPx: 1350,
} as const;

export type JournalSocialPostImageInput = {
  templateId: JournalSocialPostTemplateId;
  /** 上部の大見出し（sns03）／投稿用タイトル（sns02） */
  title: string;
  /** sns02: あしあと本文の自動抜粋 */
  bodyExcerpt: string;
  /** sns03: 緑帯のサブタイトル（未指定時は既定文） */
  subtitle: string;
  todayNumber: number | null;
  monthNumber: number | null;
  yearNumber: number | null;
  moodLabel: string;
  commentExcerpt: string;
  /** 今日のあしあとなど：3択ラベル（ひとことメモ 等） */
  promptLabel?: string;
  /** 3コマなど：全体のおまとめ（今日のひとこと） */
  summary?: string;
  photoBuffer: Buffer | null;
  /**
   * 3コマなど：追加写真（最大2枚）。あしあと本体には保存しない。
   * panelPhotoSources と組み合わせて各コマへ配置する。
   */
  extraPhotoBuffers?: [Buffer | null, Buffer | null];
  /**
   * 各コマ（上・中・下）が使うソース。
   * main = photoBuffer / extra0|extra1 = extraPhotoBuffers。
   * 未指定時は全コマ main（従来どおり）。
   */
  panelPhotoSources?: Array<"main" | "extra0" | "extra1">;
  /** 保存済み正方形写真の SNS 枠内トリミング（あしあとには保存しない） */
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
