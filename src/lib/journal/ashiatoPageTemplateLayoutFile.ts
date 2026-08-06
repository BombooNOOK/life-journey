import {
  ashiatoPageTemplateOptions,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import type {
  AshiatoLayoutPercentRect,
  AshiatoPageTemplateLayout,
} from "@/lib/journal/ashiatoPageTemplateLayoutData";
import { isAshiatoPageTemplateLayout } from "@/lib/journal/ashiatoPageTemplateLayout";

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(2)));
}

function rectLiteral(rect: AshiatoLayoutPercentRect): string {
  return `{ left: ${fmt(rect.left)}, top: ${fmt(rect.top)}, width: ${fmt(rect.width)}, height: ${fmt(rect.height)} }`;
}

function layoutBlock(id: AshiatoPageTemplateId, layout: AshiatoPageTemplateLayout): string {
  const slotLines = Object.entries(layout.slots).map(
    ([slotId, rect]) => `      ${slotId}: ${rectLiteral(rect!)},`,
  );
  const radiusLine =
    layout.photoBorderRadiusPx != null
      ? `\n    photoBorderRadiusPx: ${fmt(layout.photoBorderRadiusPx)},`
      : "";
  const dateLayoutLine =
    layout.dateLayout != null ? `\n    dateLayout: "${layout.dateLayout}",` : "";
  const datePartsLine = layout.dateParts
    ? `
    dateParts: {
      year: ${rectLiteral(layout.dateParts.year)},
      month: ${rectLiteral(layout.dateParts.month)},
      day: ${rectLiteral(layout.dateParts.day)},
      weekday: ${rectLiteral(layout.dateParts.weekday)},
    },`
    : "";
  const bodyTextLine = layout.bodyTextLayout
    ? `
    bodyTextLayout: {
      shrinkChars: ${fmt(layout.bodyTextLayout.shrinkChars)},
      align: "${layout.bodyTextLayout.align}",${
        layout.bodyTextLayout.lineStartChar
          ? `
      lineStartChar: { ${Object.entries(layout.bodyTextLayout.lineStartChar)
        .map(([line, start]) => `${line}: ${fmt(start!)}`)
        .join(", ")} },`
          : ""
      }
    },`
    : "";
  return `  ${id}: {
    bodyWritingMode: "${layout.bodyWritingMode}",${dateLayoutLine}
    photoRotateDeg: ${fmt(layout.photoRotateDeg)},${radiusLine}${datePartsLine}${bodyTextLine}
    slots: {
${slotLines.join("\n")}
    },
  },`;
}

export function parseAshiatoPageTemplateLayouts(
  raw: unknown,
): Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout>;
  for (const opt of ashiatoPageTemplateOptions) {
    if (!isAshiatoPageTemplateLayout(obj[opt.id])) return null;
    out[opt.id] = obj[opt.id] as AshiatoPageTemplateLayout;
  }
  return out;
}

/** 定規の下書きから ashiatoPageTemplateLayoutData.ts 全文を生成 */
export function buildAshiatoPageTemplateLayoutDataTsSource(
  layouts: Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout>,
): string {
  const blocks = ashiatoPageTemplateOptions.map((opt) => layoutBlock(opt.id, layouts[opt.id]));

  return `/**
 * あしあと本文テンプレ — 配置データ（%・721×1024 基準）
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
 */

import type { AshiatoPageTemplateId } from "@/lib/journal/ashiatoPageTemplates";

export type AshiatoLayoutPercentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AshiatoLayoutSlotId =
  | "photo"
  | "date"
  | "mood"
  | "activity"
  | "body"
  | "dailyNumber"
  | "reading";

export type AshiatoBodyWritingMode = "horizontal" | "vertical";

export type AshiatoDateLayoutMode = "plain" | "vertical" | "slash_ymd_weekday";

export type AshiatoSlashYmdWeekdayDateParts = {
  year: AshiatoLayoutPercentRect;
  month: AshiatoLayoutPercentRect;
  day: AshiatoLayoutPercentRect;
  weekday: AshiatoLayoutPercentRect;
};

export type AshiatoHorizontalBodyTextLayout = {
  shrinkChars: number;
  align: "left" | "center";
  lineStartChar?: Partial<Record<number, number>>;
};

export type AshiatoPageTemplateLayout = {
  bodyWritingMode: AshiatoBodyWritingMode;
  /** 写真の時計回り回転（度）。不要なら 0 */
  photoRotateDeg: number;
  /** 写真の角丸（設計px）。枠に合わせてクリップする */
  photoBorderRadiusPx?: number;
  dateLayout?: AshiatoDateLayoutMode;
  dateParts?: AshiatoSlashYmdWeekdayDateParts;
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout;
  slots: Partial<Record<AshiatoLayoutSlotId, AshiatoLayoutPercentRect>>;
};

/**
 * - mori_* / suuji_standard: 定規で合わせた値
 * - suuji_ashiato_irodori: 旧 v2（724×1024）座標を % 換算して復元
 * - mood = 気分アイコン / activity = どんな1日だったか
 */
export const ASHIATO_PAGE_TEMPLATE_LAYOUTS: Record<
  AshiatoPageTemplateId,
  AshiatoPageTemplateLayout
> = {
${blocks.join("\n")}
};
`;
}
