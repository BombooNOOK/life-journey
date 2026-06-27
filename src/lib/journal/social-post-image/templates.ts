/** テンプレ PNG の元サイズ（4:5） */
export const JOURNAL_SOCIAL_POST_TEMPLATE_SIZE = {
  widthPx: 819,
  heightPx: 1024,
} as const;

export type JournalSocialPostTemplateId = "sns02" | "sns03";

export type JournalSocialPostTextStyle = {
  x: number;
  y: number;
  fontSize: number;
  lineHeight?: number;
  fontWeight?: 400 | 600;
  fill?: string;
  textAnchor?: "start" | "middle" | "end";
  maxCharsPerLine?: number;
  maxLines?: number;
};

export type JournalSocialPostPhotoStyle = {
  x: number;
  y: number;
  width: number;
  height: number;
  fit: "cover" | "contain";
  /** 角丸（px）。テンプレの写真枠に合わせる */
  borderRadiusPx?: number;
};

export type JournalSocialPostCompanionFaceStyle = {
  x: number;
  y: number;
  sizePx: number;
  textAnchor?: "start" | "middle";
};

export type JournalSocialPostTemplateLayout = {
  id: JournalSocialPostTemplateId;
  label: string;
  backgroundFile: string;
  /** 写真の上に重ねる透明 PNG（付箋など） */
  photoOverlayFile?: string;
  photo: JournalSocialPostPhotoStyle;
  title: JournalSocialPostTextStyle;
  body: JournalSocialPostTextStyle;
  /** 日・月・年の3つのすうじ（テンプレ上の丸位置） */
  numberSlots: [JournalSocialPostTextStyle, JournalSocialPostTextStyle, JournalSocialPostTextStyle];
  mood: JournalSocialPostTextStyle;
  comment: JournalSocialPostTextStyle;
  /** sns02: リボン上の年 */
  dateRibbonYear?: JournalSocialPostTextStyle;
  /** sns02: リボン上の月.日 */
  dateRibbonMonthDay?: JournalSocialPostTextStyle;
  /** sns03: 方眼紙上の日付行 */
  dateScrapbook?: JournalSocialPostTextStyle;
  /** 伴走キャラの顔アイコン（丸） */
  companionFace?: JournalSocialPostCompanionFaceStyle;
};

const TEXT_PRIMARY = "#4a3728";
const TEXT_SECONDARY = "#5c4a38";

export const JOURNAL_SOCIAL_POST_TEMPLATES: Record<
  JournalSocialPostTemplateId,
  JournalSocialPostTemplateLayout
> = {
  sns02: {
    id: "sns02",
    label: "角丸横長",
    backgroundFile: "sns02-template-base.png",
    photoOverlayFile: "sns02-template-photo-overlay.png",
    photo: { x: 42, y: 46, width: 733, height: 469, fit: "cover", borderRadiusPx: 24 },
    dateRibbonYear: {
      x: 710,
      y: 50,
      fontSize: 20,
      fontWeight: 600,
      fill: "#ffffff",
      textAnchor: "middle",
    },
    dateRibbonMonthDay: {
      x: 710,
      y: 100,
      fontSize: 44,
      fontWeight: 600,
      fill: "#ffffff",
      textAnchor: "middle",
    },
    title: {
      x: 410,
      y: 570,
      fontSize: 34,
      lineHeight: 44,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 14,
      maxLines: 1,
    },
    body: {
      x: 410,
      y: 640,
      fontSize: 22,
      lineHeight: 32,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 24,
      maxLines: 2,
    },
    numberSlots: [
      {
        x: 130,
        y: 780,
        fontSize: 30,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 225,
        y: 780,
        fontSize: 30,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 320,
        y: 780,
        fontSize: 30,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
    ],
    mood: {
      x: 520,
      y: 780,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 11,
      maxLines: 1,
    },
    comment: {
      x: 250,
      y: 890,
      fontSize: 20,
      lineHeight: 30,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 17,
      maxLines: 2,
    },
    companionFace: {
      x: 470,
      y: 770,
      sizePx: 48,
      textAnchor: "middle",
    },
  },
  sns03: {
    id: "sns03",
    label: "スクエア（ポラロイド）",
    backgroundFile: "sns03-template-blank.png",
    photo: { x: 82, y: 318, width: 400, height: 400, fit: "cover" },
    dateScrapbook: {
      x: 555,
      y: 312,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 16,
      maxLines: 1,
    },
    title: {
      x: 410,
      y: 168,
      fontSize: 32,
      lineHeight: 42,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 14,
      maxLines: 1,
    },
    body: {
      x: 108,
      y: 592,
      fontSize: 20,
      lineHeight: 30,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 18,
      maxLines: 4,
    },
    numberSlots: [
      {
        x: 518,
        y: 398,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 588,
        y: 398,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 658,
        y: 398,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
    ],
    mood: {
      x: 555,
      y: 468,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 12,
      maxLines: 1,
    },
    comment: {
      x: 448,
      y: 848,
      fontSize: 18,
      lineHeight: 28,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 14,
      maxLines: 2,
    },
  },
};

export function normalizeJournalSocialPostTemplateId(
  raw: string | null | undefined,
): JournalSocialPostTemplateId {
  return raw === "sns03" ? "sns03" : "sns02";
}

export const JOURNAL_SOCIAL_POST_TEMPLATE_IDS = ["sns02", "sns03"] as const;
