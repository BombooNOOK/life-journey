/**
 * あしあと本文テンプレ — 配置ヘルパー（定規・将来の描画共用）
 */

import type { CSSProperties } from "react";

import {
  ashiatoPageTemplateOptions,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import {
  ASHIATO_PAGE_TEMPLATE_LAYOUTS,
  type AshiatoBodyWritingMode,
  type AshiatoDateLayoutMode,
  type AshiatoHorizontalBodyTextLayout,
  type AshiatoLayoutPercentRect,
  type AshiatoLayoutSlotId,
  type AshiatoPageTemplateLayout,
  type AshiatoSlashYmdWeekdayDateParts,
  type AshiatoVerticalBodyTextLayout,
} from "@/lib/journal/ashiatoPageTemplateLayoutData";

export {
  ASHIATO_PAGE_TEMPLATE_LAYOUTS,
  type AshiatoBodyWritingMode,
  type AshiatoDateLayoutMode,
  type AshiatoHorizontalBodyTextLayout,
  type AshiatoLayoutPercentRect,
  type AshiatoLayoutSlotId,
  type AshiatoPageTemplateLayout,
  type AshiatoSlashYmdWeekdayDateParts,
  type AshiatoVerticalBodyTextLayout,
};

/** テンプレ PNG の設計サイズ（public/images/ashiato） */
export const ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX = {
  widthPx: 721,
  heightPx: 1024,
} as const;

export const ASHIATO_LAYOUT_SLOT_IDS: AshiatoLayoutSlotId[] = [
  "photo",
  "date",
  "mood",
  "activity",
  "body",
  "dailyNumber",
  "reading",
];

export const ASHIATO_LAYOUT_SLOT_LABELS: Record<AshiatoLayoutSlotId, string> = {
  photo: "写真",
  date: "日付",
  mood: "気分（顔）",
  activity: "どんな1日",
  body: "本文",
  dailyNumber: "今日のすうじ",
  reading: "読み解き",
};

export const ASHIATO_LAYOUT_SLOT_COLORS: Record<AshiatoLayoutSlotId, string> = {
  photo: "rgba(56, 189, 248, 0.28)",
  date: "rgba(251, 191, 36, 0.32)",
  mood: "rgba(244, 114, 182, 0.28)",
  activity: "rgba(251, 113, 133, 0.28)",
  body: "rgba(52, 211, 153, 0.28)",
  dailyNumber: "rgba(167, 139, 250, 0.28)",
  reading: "rgba(251, 146, 60, 0.32)",
};

export function getAshiatoPageTemplateLayout(
  id: AshiatoPageTemplateId | string,
): AshiatoPageTemplateLayout {
  const found = ashiatoPageTemplateOptions.find((o) => o.id === id);
  const key = (found?.id ?? "suuji_ashiato_irodori") as AshiatoPageTemplateId;
  return ASHIATO_PAGE_TEMPLATE_LAYOUTS[key];
}

export function ashiatoLayoutSlotIdsForTemplate(
  id: AshiatoPageTemplateId | string,
): AshiatoLayoutSlotId[] {
  const layout = getAshiatoPageTemplateLayout(id);
  return ASHIATO_LAYOUT_SLOT_IDS.filter((slotId) => layout.slots[slotId] != null);
}

export function ashiatoLayoutRectStyle(rect: AshiatoLayoutPercentRect): CSSProperties {
  return {
    position: "absolute",
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

export function ashiatoLayoutGrowFromBottom(
  rect: AshiatoLayoutPercentRect,
  nextHeight: number,
): AshiatoLayoutPercentRect {
  const height = Math.max(1, nextHeight);
  const bottom = rect.top + rect.height;
  return {
    ...rect,
    height,
    top: Number((bottom - height).toFixed(2)),
  };
}

export function isAshiatoLayoutPercentRect(value: unknown): value is AshiatoLayoutPercentRect {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.left === "number" &&
    typeof r.top === "number" &&
    typeof r.width === "number" &&
    typeof r.height === "number"
  );
}

export function isAshiatoPageTemplateLayout(value: unknown): value is AshiatoPageTemplateLayout {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (row.bodyWritingMode !== "horizontal" && row.bodyWritingMode !== "vertical") {
    return false;
  }
  if (typeof row.photoRotateDeg !== "number") return false;
  if (
    row.photoBorderRadiusPx != null &&
    typeof row.photoBorderRadiusPx !== "number"
  ) {
    return false;
  }
  if (
    row.dateLayout != null &&
    row.dateLayout !== "plain" &&
    row.dateLayout !== "vertical" &&
    row.dateLayout !== "slash_ymd_weekday"
  ) {
    return false;
  }
  if (row.dateParts != null) {
    if (!row.dateParts || typeof row.dateParts !== "object") return false;
    const parts = row.dateParts as Record<string, unknown>;
    for (const key of ["year", "month", "day", "weekday"] as const) {
      if (!isAshiatoLayoutPercentRect(parts[key])) return false;
    }
  }
  if (row.bodyTextLayout != null) {
    if (!row.bodyTextLayout || typeof row.bodyTextLayout !== "object") return false;
    const bodyText = row.bodyTextLayout as Record<string, unknown>;
    if (typeof bodyText.shrinkChars !== "number") return false;
    if (bodyText.align !== "left" && bodyText.align !== "center") return false;
    if (bodyText.lineStartChar != null) {
      if (!bodyText.lineStartChar || typeof bodyText.lineStartChar !== "object") return false;
      for (const [key, value] of Object.entries(
        bodyText.lineStartChar as Record<string, unknown>,
      )) {
        if (!/^\d+$/.test(key) || typeof value !== "number" || value < 1) return false;
      }
    }
    if (bodyText.lineStartCharByMode != null) {
      if (!bodyText.lineStartCharByMode || typeof bodyText.lineStartCharByMode !== "object") {
        return false;
      }
      for (const [mode, map] of Object.entries(
        bodyText.lineStartCharByMode as Record<string, unknown>,
      )) {
        if (!["relaxed", "standard", "generous", "compact"].includes(mode)) return false;
        if (!map || typeof map !== "object") return false;
        for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
          if (!/^\d+$/.test(key) || typeof value !== "number" || value < 1) return false;
        }
      }
    }
    if (bodyText.lineShortenChars != null) {
      if (!bodyText.lineShortenChars || typeof bodyText.lineShortenChars !== "object") {
        return false;
      }
      for (const [key, value] of Object.entries(
        bodyText.lineShortenChars as Record<string, unknown>,
      )) {
        if (!/^\d+$/.test(key) || typeof value !== "number" || value < 1) return false;
      }
    }
    if (bodyText.lineShortenCharsByMode != null) {
      if (
        !bodyText.lineShortenCharsByMode ||
        typeof bodyText.lineShortenCharsByMode !== "object"
      ) {
        return false;
      }
      for (const [mode, map] of Object.entries(
        bodyText.lineShortenCharsByMode as Record<string, unknown>,
      )) {
        if (!["relaxed", "standard", "generous", "compact"].includes(mode)) return false;
        if (!map || typeof map !== "object") return false;
        for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
          if (!/^\d+$/.test(key) || typeof value !== "number" || value < 1) return false;
        }
      }
    }
    if (bodyText.maxLinesByMode != null) {
      if (!bodyText.maxLinesByMode || typeof bodyText.maxLinesByMode !== "object") return false;
      for (const [mode, value] of Object.entries(
        bodyText.maxLinesByMode as Record<string, unknown>,
      )) {
        if (!["relaxed", "standard", "generous", "compact"].includes(mode)) return false;
        if (typeof value !== "number" || value < 1) return false;
      }
    }
  }
  if (row.verticalBodyTextLayout != null) {
    if (!row.verticalBodyTextLayout || typeof row.verticalBodyTextLayout !== "object") {
      return false;
    }
    const vertical = row.verticalBodyTextLayout as Record<string, unknown>;
    for (const key of ["columnStartChar", "columnShortenChars"] as const) {
      const map = vertical[key];
      if (map == null) continue;
      if (!map || typeof map !== "object") return false;
      for (const [col, value] of Object.entries(map as Record<string, unknown>)) {
        if (!/^\d+$/.test(col) || typeof value !== "number" || value < 1) return false;
      }
    }
    for (const key of ["columnStartCharByMode", "columnShortenCharsByMode"] as const) {
      const byMode = vertical[key];
      if (byMode == null) continue;
      if (!byMode || typeof byMode !== "object") return false;
      for (const [mode, map] of Object.entries(byMode as Record<string, unknown>)) {
        if (!["relaxed", "standard", "generous", "compact"].includes(mode)) return false;
        if (!map || typeof map !== "object") return false;
        for (const [col, value] of Object.entries(map as Record<string, unknown>)) {
          if (!/^\d+$/.test(col) || typeof value !== "number" || value < 1) return false;
        }
      }
    }
  }
  if (!row.slots || typeof row.slots !== "object") return false;
  const slots = row.slots as Record<string, unknown>;
  for (const [key, rect] of Object.entries(slots)) {
    if (!ASHIATO_LAYOUT_SLOT_IDS.includes(key as AshiatoLayoutSlotId)) return false;
    if (!isAshiatoLayoutPercentRect(rect)) return false;
  }
  return true;
}
