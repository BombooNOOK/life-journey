import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";

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
  /** 時計回りが正。textAnchor の基準点 (x,y) を中心に回転 */
  rotateDeg?: number;
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
  /** 時計回りが正（sharp.rotate と同じ）。スロット左上を固定して回転 */
  rotateDeg?: number;
  /** スロット左上 (x,y) を基準に描画サイズを拡縮（1 = 等倍） */
  displayScale?: number;
};

export function resolveJournalSocialPostPhotoRenderSize(
  photo: Pick<JournalSocialPostPhotoStyle, "width" | "height" | "displayScale">,
): { width: number; height: number } {
  const scale = photo.displayScale ?? 1;
  if (scale === 1) {
    return { width: photo.width, height: photo.height };
  }
  return {
    width: Math.round(photo.width * scale),
    height: Math.round(photo.height * scale),
  };
}

export type JournalSocialPostCompanionFaceStyle = {
  x: number;
  y: number;
  sizePx: number;
  textAnchor?: "start" | "middle";
};

export type JournalSocialPostTemplateLayout = {
  id: JournalSocialPostTemplateId;
  label: string;
  /** 伴走キャラ未指定・未対応時の下地 */
  backgroundFile: string;
  /** 伴走キャラ slug ごとの下地（sns02 など） */
  backgroundFilesByCompanion?: Partial<Record<string, string>>;
  /** 写真の上に重ねる透明 PNG（付箋など） */
  photoOverlayFile?: string;
  photo: JournalSocialPostPhotoStyle;
  title: JournalSocialPostTextStyle;
  body: JournalSocialPostTextStyle;
  /** sns03: 上部の緑帯サブタイトル */
  subtitle?: JournalSocialPostTextStyle;
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

/** sns02 本文：角丸エリア中央の左揃えブロック */
const SNS02_BODY_TEXT_BLOCK = {
  centerX: 410,
  widthPx: 560,
} as const;

const SNS02_BODY_TEXT_LEFT_X =
  SNS02_BODY_TEXT_BLOCK.centerX - SNS02_BODY_TEXT_BLOCK.widthPx / 2;

export const JOURNAL_SOCIAL_POST_TEMPLATES: Record<
  JournalSocialPostTemplateId,
  JournalSocialPostTemplateLayout
> = {
  sns02: {
    id: "sns02",
    label: "ひだまりフォト（横長）",
    backgroundFile: "sns02-template-base-drfukuro.png",
    backgroundFilesByCompanion: {
      drfukuro: "sns02-template-base-drfukuro.png",
      harinezumi: "sns02-template-base-harinezumi.png",
      namakemono: "sns02-template-base-namakemono.png",
      risu: "sns02-template-base-risu.png",
      kerosion: "sns02-template-base-kerosion.png",
    },
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
      x: SNS02_BODY_TEXT_LEFT_X,
      y: 640,
      fontSize: 22,
      lineHeight: 32,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
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
    label: "森のスクラップ（スクエア）",
    backgroundFile: "sns03-template-base-drfukuro.png",
    backgroundFilesByCompanion: {
      drfukuro: "sns03-template-base-drfukuro.png",
      harinezumi: "sns03-template-base-harinezumi.png",
      namakemono: "sns03-template-base-namakemono.png",
      risu: "sns03-template-base-risu.png",
      kerosion: "sns03-template-base-kerosion.png",
    },
    photo: {
      x: 68,
      y: 302,
      width: 400,
      height: 400,
      fit: "cover",
      rotateDeg: -5.2,
      displayScale: 1.01,
    },
    dateScrapbook: {
      x: 625,
      y: 395,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      rotateDeg: 4,
      maxCharsPerLine: 16,
      maxLines: 1,
    },
    title: {
      x: 410,
      y: 130,
      fontSize: 48,
      lineHeight: 56,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 10,
      maxLines: 1,
    },
    subtitle: {
      x: 410,
      y: 190,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 18,
      maxLines: 1,
    },
    body: {
      x: 50,
      y: 780,
      fontSize: 20,
      lineHeight: 30,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 16,
      maxLines: 6,
    },
    numberSlots: [
      {
        x: 555,
        y: 470,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 638,
        y: 476,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
      {
        x: 710,
        y: 480,
        fontSize: 26,
        fontWeight: 600,
        fill: TEXT_PRIMARY,
        textAnchor: "middle",
      },
    ],
    mood: {
      x: 615,
      y: 620,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: 600,
      fill: TEXT_PRIMARY,
      textAnchor: "middle",
      maxCharsPerLine: 6,
      maxLines: 2,
    },
    comment: {
      x: 435,
      y: 850,
      fontSize: 18,
      lineHeight: 28,
      fill: TEXT_PRIMARY,
      textAnchor: "start",
      maxCharsPerLine: 13,
      maxLines: 4,
    },
  },
};

export function normalizeJournalSocialPostTemplateId(
  raw: string | null | undefined,
): JournalSocialPostTemplateId {
  return raw === "sns03" ? "sns03" : "sns02";
}

export function resolveJournalSocialPostBackgroundFile(
  templateId: JournalSocialPostTemplateId,
  companionType: string,
): string {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const slug = companionTypeToTemplateSlug(companionType);
  const companionFile = layout.backgroundFilesByCompanion?.[slug];
  return companionFile ?? layout.backgroundFile;
}

export const JOURNAL_SOCIAL_POST_TEMPLATE_IDS = ["sns02", "sns03"] as const;
