import type { CompanionType } from "@/lib/journal/meta";

export const DAILY_NUMBER_TODAY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type DailyNumberTodayValue = (typeof DAILY_NUMBER_TODAY_VALUES)[number];

export const DAILY_NUMBER_LIFE_PATH_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33,
] as const;
export type DailyNumberLifePathValue = (typeof DAILY_NUMBER_LIFE_PATH_VALUES)[number];

export const DAILY_NUMBER_MESSAGE_TYPES = [
  "base",
  "ugoku",
  "tsunagaru",
  "totonoeru",
  "mitsumeru",
  "yasumu",
] as const;
export type DailyNumberMessageType = (typeof DAILY_NUMBER_MESSAGE_TYPES)[number];

export type DailyNumberCharacter = CompanionType;

export const DAILY_NUMBER_COVER_SEASONS = [
  "base",
  "spring",
  "summer",
  "autumn",
  "winter",
] as const;
export type DailyNumberCoverSeason = (typeof DAILY_NUMBER_COVER_SEASONS)[number];

export const DAILY_NUMBER_SPECIAL_SEASONS = [
  "new_year",
  "new_life",
  "obon",
  "autumn_night",
  "christmas",
  "year_end",
] as const;
export type DailyNumberSpecialSeason = (typeof DAILY_NUMBER_SPECIAL_SEASONS)[number];

export const DAILY_NUMBER_COVER_VARIANTS = ["A", "B", "C"] as const;
export type DailyNumberCoverVariant = (typeof DAILY_NUMBER_COVER_VARIANTS)[number];

/** 表紙文の1バリアント（CSV 1行）。season / specialSeason は将来の季節・特別シーズン用。 */
export type TodayNumberCoverVariantRecord = {
  todayNumber: DailyNumberTodayValue;
  season: DailyNumberCoverSeason;
  specialSeason?: DailyNumberSpecialSeason;
  variant: DailyNumberCoverVariant;
  title: string;
  summaryMessage: string;
  colorName: string;
  themeKeywords: string[];
  toneNotes: string[];
  avoidNotes: string[];
};

/** 合成・payload に載る解決済み表紙（選択結果） */
export type TodayNumberMaster = TodayNumberCoverVariantRecord;

export type TodayNumberCoverSelection = {
  todayNumber: DailyNumberTodayValue;
  variant?: DailyNumberCoverVariant;
  /** 将来: 日付から判定。未指定時は fallback のみ */
  season?: DailyNumberCoverSeason;
  specialSeason?: DailyNumberSpecialSeason;
};

export type PersonalNumberMaster = {
  lifePathNumber: DailyNumberLifePathValue;
  displayName: string;
  subtitle: string;
  coreTheme: string;
  toneNotes: string[];
  avoidNotes: string[];
};

export type DailyNumberMessage = {
  todayNumber: DailyNumberTodayValue;
  lifePathNumber: DailyNumberLifePathValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  variant?: DailyNumberCoverVariant;
  subTheme?: string;
  displayName: string;
  subtitle: string;
  body: string;
  colorName: string;
  actions: [string, string];
  charmPhrase?: string;
  notes?: string;
};

export type DailyNumberPageBlock = DailyNumberMessage;

export type DailyNumberPagePreview = {
  pageIndex: number;
  blocks: DailyNumberPageBlock[];
};

export type DailyNumberClosingVariant = import("./closingVariant").DailyNumberClosingVariant;

export type DailyNumberGeneratedPayload = {
  postType: "daily_number";
  scheduledDate: string;
  todayNumber: DailyNumberTodayValue;
  character: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  /** 作成画面での選択（A/B/C/ランダム） */
  variantMode: import("./variantMode").DailyNumberVariantMode;
  /** 表紙・個別ページで実際に使用する variant（1投稿内で統一） */
  variant: DailyNumberCoverVariant;
  /** ラストページ（4種からランダム選択・投稿単位で固定） */
  closingVariant: DailyNumberClosingVariant;
  seriesTitle: string;
  cover: TodayNumberMaster;
  pages: DailyNumberPagePreview[];
  generatedAt: string;
};

export type DailyNumberLookupResult =
  | {
      ok: true;
      payload: DailyNumberGeneratedPayload;
      canvaCopyText: string;
      captionText: string;
      /** 個別文案が選択キャラの入稿データか、フクロウ先生へのフォールバックか */
      messageSource: import("./messagePublishPolicy").DailyNumberMessageSource;
      /** キャラ別文案が揃っているため保存・ZIP可能 */
      publishReady: boolean;
    }
  | {
      ok: false;
      reason: "data_not_ready";
      todayNumber: number | null;
      character: DailyNumberCharacter;
      messageType: DailyNumberMessageType;
    };

export type DailyNumberDraftFormValues = {
  scheduledDate: string;
  companionType: DailyNumberCharacter;
  messageType: DailyNumberMessageType;
  coverVariantMode: import("./variantMode").DailyNumberVariantMode;
  /** ランダム選択時に投稿単位で固定する resolved variant */
  resolvedVariant?: DailyNumberCoverVariant;
  /** ラストページのランダム選択結果（投稿単位で固定） */
  resolvedClosingVariant?: DailyNumberClosingVariant;
  status: import("@/lib/admin/post-atelier/types").SocialPostDraftStatus;
  internalMemo: string;
};
