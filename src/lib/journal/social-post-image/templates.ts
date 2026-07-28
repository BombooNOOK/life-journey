import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";
import {
  MORI_ASHIATO_TEMPLATE_IDS,
  MORI_ASHIATO_TEMPLATES,
  isMoriAshiatoTemplateId,
} from "./moriAshiatoTemplates";

/** テンプレ PNG の元サイズ（4:5）— レイアウト未指定時の既定 */
export const JOURNAL_SOCIAL_POST_TEMPLATE_SIZE = {
  widthPx: 819,
  heightPx: 1024,
} as const;

export type JournalSocialPostTemplateId =
  | "sns02"
  | "sns03"
  | "chiisana_ashiato"
  | "kyou_no_ashiato"
  | "odekake_ashiato"
  | "oishii_ashiato"
  | "totteoki_no_ashiato"
  | "kyou_no_ashiato_wide"
  | "kyou_no_3koma_ashiato";

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

export type JournalSocialPostTextMode = "sns02" | "sns03" | "ashiato_lines";

export type JournalSocialPostTemplateLayout = {
  id: JournalSocialPostTemplateId;
  label: string;
  /** 伴走キャラ未指定・未対応時の下地 */
  backgroundFile: string;
  /** 伴走キャラ slug ごとの下地（sns02 など） */
  backgroundFilesByCompanion?: Partial<Record<string, string>>;
  /** 写真の上に重ねる透明 PNG（付箋など） */
  photoOverlayFile?: string;
  /** 設計キャンバス（未指定時は JOURNAL_SOCIAL_POST_TEMPLATE_SIZE） */
  designSize?: { widthPx: number; heightPx: number };
  /** 書き出しサイズ（未指定時は 1080×1350） */
  outputSize?: { widthPx: number; heightPx: number };
  /** 文字の載せ方。未指定時は id から推定 */
  textMode?: JournalSocialPostTextMode;
  photo: JournalSocialPostPhotoStyle;
  /** 2枠目以降（3コマなど）。各枠の幾何。画像ソースは composite の panelPhotoSources で指定 */
  extraPhotos?: JournalSocialPostPhotoStyle[];
  title: JournalSocialPostTextStyle;
  body: JournalSocialPostTextStyle;
  /** sns03: 上部の緑帯サブタイトル */
  subtitle?: JournalSocialPostTextStyle;
  /** 日・月・年の3つのすうじ（テンプレ上の丸位置） */
  numberSlots?: [
    JournalSocialPostTextStyle,
    JournalSocialPostTextStyle,
    JournalSocialPostTextStyle,
  ];
  mood?: JournalSocialPostTextStyle;
  comment: JournalSocialPostTextStyle;
  /** 今日のあしあとなど：3択で選んだラベル */
  promptLabel?: JournalSocialPostTextStyle;
  /** 3コマなど：全体のおまとめ（今日のひとこと） */
  summary?: JournalSocialPostTextStyle;
  /** sns02: リボン上の年 */
  dateRibbonYear?: JournalSocialPostTextStyle;
  /** sns02: リボン上の月.日 */
  dateRibbonMonthDay?: JournalSocialPostTextStyle;
  /** sns03 / あしあと線: 日付行 */
  dateScrapbook?: JournalSocialPostTextStyle;
  /** 伴走キャラの顔アイコン（丸） */
  companionFace?: JournalSocialPostCompanionFaceStyle;
};

export function resolveJournalSocialPostDesignSize(
  layout: JournalSocialPostTemplateLayout,
): { widthPx: number; heightPx: number } {
  return layout.designSize ?? JOURNAL_SOCIAL_POST_TEMPLATE_SIZE;
}

export function resolveJournalSocialPostOutputSize(
  layout: JournalSocialPostTemplateLayout,
): { widthPx: number; heightPx: number } {
  return layout.outputSize ?? { widthPx: 1080, heightPx: 1350 };
}

export function resolveJournalSocialPostTextMode(
  layout: JournalSocialPostTemplateLayout,
): JournalSocialPostTextMode {
  if (layout.textMode) return layout.textMode;
  if (layout.id === "sns03") return "sns03";
  if (isMoriAshiatoTemplateId(layout.id)) return "ashiato_lines";
  return "sns02";
}

const TEXT_PRIMARY = "#4a3728";

/** sns02 本文：角丸エリア中央の左揃えブロック */
const SNS02_BODY_TEXT_BLOCK = {
  centerX: 410,
  widthPx: 560,
} as const;

const SNS02_BODY_TEXT_LEFT_X =
  SNS02_BODY_TEXT_BLOCK.centerX - SNS02_BODY_TEXT_BLOCK.widthPx / 2;

const LEGACY_TEMPLATES: Record<"sns02" | "sns03", JournalSocialPostTemplateLayout> = {
  sns02: {
    id: "sns02",
    label: "ひだまりフォト（横長）",
    textMode: "sns02",
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
    textMode: "sns03",
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

export const JOURNAL_SOCIAL_POST_TEMPLATES: Record<
  JournalSocialPostTemplateId,
  JournalSocialPostTemplateLayout
> = {
  ...MORI_ASHIATO_TEMPLATES,
  ...LEGACY_TEMPLATES,
};

export function normalizeJournalSocialPostTemplateId(
  raw: string | null | undefined,
): JournalSocialPostTemplateId {
  if (!raw) return "sns02";
  if (raw in JOURNAL_SOCIAL_POST_TEMPLATES) {
    return raw as JournalSocialPostTemplateId;
  }
  return "sns02";
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

/** UI 並び：あしあと系を先に、既存 sns は後ろ */
export const JOURNAL_SOCIAL_POST_TEMPLATE_IDS = [
  ...MORI_ASHIATO_TEMPLATE_IDS,
  "sns02",
  "sns03",
] as const satisfies readonly JournalSocialPostTemplateId[];

export { isMoriAshiatoTemplateId };
