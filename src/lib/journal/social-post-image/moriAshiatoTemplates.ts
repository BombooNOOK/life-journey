import type {
  JournalSocialPostPhotoStyle,
  JournalSocialPostTemplateId,
  JournalSocialPostTemplateLayout,
  JournalSocialPostTextStyle,
} from "./templates";

/** 森ログあしあと系（5:4 = 819×1024、16:9縦 = 576×1024） */
export const MORI_ASHIATO_TEMPLATE_IDS = [
  "chiisana_ashiato",
  "kyou_no_ashiato",
  "odekake_ashiato",
  "oishii_ashiato",
  "totteoki_no_ashiato",
  "kyou_no_ashiato_wide",
  "kyou_no_3koma_ashiato",
] as const satisfies readonly JournalSocialPostTemplateId[];

export type MoriAshiatoTemplateId = (typeof MORI_ASHIATO_TEMPLATE_IDS)[number];

export function isMoriAshiatoTemplateId(
  id: string,
): id is MoriAshiatoTemplateId {
  return (MORI_ASHIATO_TEMPLATE_IDS as readonly string[]).includes(id);
}

const TEXT = "#4a3728";

const DESIGN_5X4 = { widthPx: 819, heightPx: 1024 } as const;
const OUTPUT_5X4 = { widthPx: 1080, heightPx: 1350 } as const;
/** ファイル名は 16x9 だが実寸は 9:16（スマホ縦） */
const DESIGN_9X16 = { widthPx: 576, heightPx: 1024 } as const;
const OUTPUT_9X16 = { widthPx: 1080, heightPx: 1920 } as const;

function line(
  x: number,
  y: number,
  opts: Partial<JournalSocialPostTextStyle> = {},
): JournalSocialPostTextStyle {
  return {
    x,
    y,
    fontSize: 22,
    lineHeight: 30,
    fill: TEXT,
    textAnchor: "start",
    maxCharsPerLine: 18,
    maxLines: 1,
    ...opts,
  };
}

function photo(
  x: number,
  y: number,
  width: number,
  height: number,
  opts: Partial<JournalSocialPostPhotoStyle> = {},
): JournalSocialPostPhotoStyle {
  return { x, y, width, height, fit: "cover", ...opts };
}

/**
 * 座標は初版推定値。プレビュー／layout ruler で詰める前提。
 * textMode=ashiato_lines → 日付・タイトル・本文・ひとことを線上に載せる。
 */
export const MORI_ASHIATO_TEMPLATES: Record<
  MoriAshiatoTemplateId,
  JournalSocialPostTemplateLayout
> = {
  chiisana_ashiato: {
    id: "chiisana_ashiato",
    label: "ちいさなあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_chiisana_ashiato_full.png",
    // クマ・うさぎが下端に重なるため、写真枠は少し短め
    photo: photo(110, 155, 600, 430, { borderRadiusPx: 12 }),
    dateScrapbook: line(160, 720, { fontSize: 20, maxCharsPerLine: 20 }),
    title: line(160, 775, { fontSize: 22, fontWeight: 600, maxCharsPerLine: 16 }),
    body: line(160, 830, { fontSize: 20, maxCharsPerLine: 18 }),
    comment: line(160, 885, { fontSize: 20, maxCharsPerLine: 18, maxLines: 2, lineHeight: 28 }),
  },
  kyou_no_ashiato: {
    id: "kyou_no_ashiato",
    label: "今日のあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_kyou_no_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_kyou_no_ashiato_overlay.png",
    photo: photo(168, 255, 496, 400, { borderRadiusPx: 8 }),
    dateScrapbook: line(150, 720, { fontSize: 20, maxCharsPerLine: 20 }),
    title: line(150, 775, { fontSize: 22, fontWeight: 600, maxCharsPerLine: 16 }),
    body: line(150, 830, { fontSize: 20, maxCharsPerLine: 18 }),
    comment: line(150, 885, {
      fontSize: 18,
      maxCharsPerLine: 18,
      maxLines: 2,
      lineHeight: 26,
    }),
  },
  odekake_ashiato: {
    id: "odekake_ashiato",
    label: "おでかけあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_odekake_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_odekake_ashiato_overlay.png",
    photo: photo(140, 236, 560, 432, { borderRadiusPx: 16 }),
    dateScrapbook: line(150, 720, { fontSize: 20, maxCharsPerLine: 20 }),
    title: line(150, 775, { fontSize: 22, fontWeight: 600, maxCharsPerLine: 16 }),
    body: line(150, 830, { fontSize: 20, maxCharsPerLine: 18 }),
    comment: line(150, 885, { fontSize: 20, maxCharsPerLine: 18 }),
  },
  oishii_ashiato: {
    id: "oishii_ashiato",
    label: "おいしいあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_oishii_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_oishii_ashiato_overlay.png",
    photo: photo(168, 224, 488, 472, { borderRadiusPx: 8 }),
    dateScrapbook: line(155, 740, { fontSize: 20, maxCharsPerLine: 20 }),
    title: line(155, 795, { fontSize: 22, fontWeight: 600, maxCharsPerLine: 16 }),
    body: line(155, 850, { fontSize: 20, maxCharsPerLine: 18 }),
    comment: line(155, 905, { fontSize: 20, maxCharsPerLine: 18 }),
  },
  totteoki_no_ashiato: {
    id: "totteoki_no_ashiato",
    label: "とっておきのあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_totteoki_no_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_totteoki_no_ashiato_overlay.png",
    // 写真主役。上部ラベルにタイトル、日付は控えめ
    photo: photo(70, 165, 680, 650, { borderRadiusPx: 4 }),
    title: line(280, 58, {
      fontSize: 24,
      fontWeight: 600,
      textAnchor: "middle",
      x: 410,
      maxCharsPerLine: 14,
    }),
    dateScrapbook: line(410, 980, {
      fontSize: 18,
      textAnchor: "middle",
      maxCharsPerLine: 16,
    }),
    body: line(40, 40, { fontSize: 1, maxCharsPerLine: 1, maxLines: 1, fill: "#00000000" }),
    comment: line(40, 40, { fontSize: 1, maxCharsPerLine: 1, maxLines: 1, fill: "#00000000" }),
  },
  kyou_no_ashiato_wide: {
    id: "kyou_no_ashiato_wide",
    label: "今日のあしあと（ワイド）",
    textMode: "ashiato_lines",
    designSize: DESIGN_9X16,
    outputSize: OUTPUT_9X16,
    backgroundFile: "mori_log_16x9_kyou_no_ashiato_wide_bg.png",
    photoOverlayFile: "mori_log_16x9_kyou_no_ashiato_wide_overlay.png",
    photo: photo(52, 205, 472, 600, { borderRadiusPx: 12 }),
    dateScrapbook: line(288, 130, {
      fontSize: 18,
      textAnchor: "middle",
      maxCharsPerLine: 14,
    }),
    title: line(80, 40, { fontSize: 1, maxCharsPerLine: 1, fill: "#00000000" }),
    body: line(80, 40, { fontSize: 1, maxCharsPerLine: 1, fill: "#00000000" }),
    comment: line(80, 870, {
      fontSize: 20,
      maxCharsPerLine: 16,
      maxLines: 3,
      lineHeight: 28,
    }),
  },
  kyou_no_3koma_ashiato: {
    id: "kyou_no_3koma_ashiato",
    label: "今日の3コマあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_9X16,
    outputSize: OUTPUT_9X16,
    backgroundFile: "mori_log_16x9_kyou_no_3koma_ashiato_bg.png",
    photoOverlayFile: "mori_log_16x9_kyou_no_3koma_ashiato_overlay.png",
    // 現状エントリ写真は1枚のため、3枠すべてに同じ写真を入れる（将来複数枚対応）
    photo: photo(120, 152, 340, 220, { borderRadiusPx: 14 }),
    extraPhotos: [
      photo(120, 416, 340, 224, { borderRadiusPx: 14 }),
      photo(120, 680, 340, 224, { borderRadiusPx: 14 }),
    ],
    dateScrapbook: line(288, 120, {
      fontSize: 16,
      textAnchor: "middle",
      maxCharsPerLine: 14,
    }),
    title: line(80, 40, { fontSize: 1, maxCharsPerLine: 1, fill: "#00000000" }),
    body: line(80, 40, { fontSize: 1, maxCharsPerLine: 1, fill: "#00000000" }),
    comment: line(90, 940, {
      fontSize: 18,
      maxCharsPerLine: 16,
      maxLines: 2,
      lineHeight: 26,
    }),
  },
};
