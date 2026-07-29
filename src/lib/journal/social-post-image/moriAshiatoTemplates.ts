import type {
  JournalSocialPostTemplateId,
  JournalSocialPostTemplateLayout,
} from "./templates";
import { MORI_ASHIATO_LAYOUTS } from "./moriAshiatoLayoutData";

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

/** デザイン一覧サムネのキャッシュバスト */
const MORI_LOG_PICKER_PREVIEW_ASSET_VERSION = "1";

/**
 * 選び用サムネファイル名（scripts/compose-mori-log-picker-previews.ts と揃える）
 * 例: mori_log_5x4_kyou_no_ashiato_bg.png → mori_log_5x4_kyou_no_ashiato_picker_preview.png
 */
export function moriLogPickerPreviewFileName(templateId: MoriAshiatoTemplateId): string {
  const bg = MORI_ASHIATO_TEMPLATES[templateId].backgroundFile;
  if (bg.endsWith("_full.png")) {
    return bg.replace(/_full\.png$/, "_picker_preview.jpg");
  }
  if (bg.endsWith("_bg.png")) {
    return bg.replace(/_bg\.png$/, "_picker_preview.jpg");
  }
  return `mori_log_picker_${templateId}.jpg`;
}

export function moriLogPickerPreviewPath(templateId: MoriAshiatoTemplateId): string {
  return `/images/journal-social-post/${moriLogPickerPreviewFileName(templateId)}?v=${MORI_LOG_PICKER_PREVIEW_ASSET_VERSION}`;
}

const DESIGN_5X4 = { widthPx: 819, heightPx: 1024 } as const;
const OUTPUT_5X4 = { widthPx: 1080, heightPx: 1350 } as const;
/** ファイル名は 16x9 だが実寸は 9:16（スマホ縦） */
const DESIGN_9X16 = { widthPx: 576, heightPx: 1024 } as const;
const OUTPUT_9X16 = { widthPx: 1080, heightPx: 1920 } as const;

/**
 * メタ＋配置。座標は moriAshiatoLayoutData.ts（レイアウト定規から保存可）。
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
    ...MORI_ASHIATO_LAYOUTS.chiisana_ashiato,
  },
  kyou_no_ashiato: {
    id: "kyou_no_ashiato",
    label: "今日のあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_kyou_no_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_kyou_no_ashiato_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.kyou_no_ashiato,
  },
  odekake_ashiato: {
    id: "odekake_ashiato",
    label: "おでかけあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_odekake_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_odekake_ashiato_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.odekake_ashiato,
  },
  oishii_ashiato: {
    id: "oishii_ashiato",
    label: "おいしいあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_oishii_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_oishii_ashiato_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.oishii_ashiato,
  },
  totteoki_no_ashiato: {
    id: "totteoki_no_ashiato",
    label: "とっておきのあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_5X4,
    outputSize: OUTPUT_5X4,
    backgroundFile: "mori_log_5x4_totteoki_no_ashiato_bg.png",
    photoOverlayFile: "mori_log_5x4_totteoki_no_ashiato_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.totteoki_no_ashiato,
  },
  kyou_no_ashiato_wide: {
    id: "kyou_no_ashiato_wide",
    label: "今日のあしあと（ワイド）",
    textMode: "ashiato_lines",
    designSize: DESIGN_9X16,
    outputSize: OUTPUT_9X16,
    backgroundFile: "mori_log_16x9_kyou_no_ashiato_wide_bg.png",
    photoOverlayFile: "mori_log_16x9_kyou_no_ashiato_wide_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.kyou_no_ashiato_wide,
  },
  kyou_no_3koma_ashiato: {
    id: "kyou_no_3koma_ashiato",
    label: "今日の3コマあしあと",
    textMode: "ashiato_lines",
    designSize: DESIGN_9X16,
    outputSize: OUTPUT_9X16,
    backgroundFile: "mori_log_16x9_kyou_no_3koma_ashiato_bg.png",
    photoOverlayFile: "mori_log_16x9_kyou_no_3koma_ashiato_overlay.png",
    ...MORI_ASHIATO_LAYOUTS.kyou_no_3koma_ashiato,
  },
};
