/**
 * 森ログあしあとカード — 配置データ（設計px）
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
 */

import type { MoriAshiatoTemplateId } from "./moriAshiatoTemplates";

export type MoriAshiatoPhotoCoords = {
  x: number;
  y: number;
  width: number;
  height: number;
  fit: "cover" | "contain";
  borderRadiusPx?: number;
  rotateDeg?: number;
  displayScale?: number;
};

export type MoriAshiatoTextCoords = {
  x: number;
  y: number;
  fontSize: number;
  lineHeight?: number;
  fontWeight?: 400 | 600;
  fill?: string;
  textAnchor?: "start" | "middle" | "end";
  rotateDeg?: number;
  maxCharsPerLine?: number;
  maxLines?: number;
};

export type MoriAshiatoLayoutCoords = {
  photo: MoriAshiatoPhotoCoords;
  extraPhotos?: MoriAshiatoPhotoCoords[];
  dateScrapbook?: MoriAshiatoTextCoords;
  title: MoriAshiatoTextCoords;
  body: MoriAshiatoTextCoords;
  comment: MoriAshiatoTextCoords;
};

export type MoriAshiatoLayoutSlotId =
  | "photo"
  | "photo2"
  | "photo3"
  | "date"
  | "title"
  | "body"
  | "comment";

export const MORI_ASHIATO_LAYOUT_SLOT_LABELS: Record<MoriAshiatoLayoutSlotId, string> = {
  photo: "写真1",
  photo2: "写真2",
  photo3: "写真3",
  date: "日付",
  title: "タイトル",
  body: "本文",
  comment: "ひとこと",
};

export const MORI_ASHIATO_LAYOUT_SLOT_COLORS: Record<MoriAshiatoLayoutSlotId, string> = {
  photo: "rgba(56, 189, 248, 0.28)",
  photo2: "rgba(14, 165, 233, 0.28)",
  photo3: "rgba(2, 132, 199, 0.28)",
  date: "rgba(251, 191, 36, 0.35)",
  title: "rgba(244, 114, 182, 0.32)",
  body: "rgba(52, 211, 153, 0.32)",
  comment: "rgba(167, 139, 250, 0.32)",
};

export const MORI_ASHIATO_LAYOUTS: Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> = {
  chiisana_ashiato: {
    photo: { x: 146, y: 165, width: 527, height: 515, fit: "cover", borderRadiusPx: 15 },
    dateScrapbook: { x: 160, y: 744, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 20, maxLines: 1 },
    title: { x: 160, y: 801, fontSize: 22, lineHeight: 30, fontWeight: 600, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 1 },
    body: { x: 160, y: 860, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
    comment: { x: 160, y: 903, fontSize: 20, lineHeight: 28, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 2 },
  },
  kyou_no_ashiato: {
    photo: { x: 168, y: 255, width: 496, height: 400, fit: "cover", borderRadiusPx: 8 },
    dateScrapbook: { x: 150, y: 720, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 20, maxLines: 1 },
    title: { x: 150, y: 775, fontSize: 22, lineHeight: 30, fontWeight: 600, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 1 },
    body: { x: 150, y: 830, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
    comment: { x: 150, y: 885, fontSize: 18, lineHeight: 26, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 2 },
  },
  odekake_ashiato: {
    photo: { x: 140, y: 236, width: 560, height: 432, fit: "cover", borderRadiusPx: 16 },
    dateScrapbook: { x: 150, y: 720, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 20, maxLines: 1 },
    title: { x: 150, y: 775, fontSize: 22, lineHeight: 30, fontWeight: 600, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 1 },
    body: { x: 150, y: 830, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
    comment: { x: 150, y: 885, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
  },
  oishii_ashiato: {
    photo: { x: 168, y: 224, width: 488, height: 472, fit: "cover", borderRadiusPx: 8 },
    dateScrapbook: { x: 155, y: 740, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 20, maxLines: 1 },
    title: { x: 155, y: 795, fontSize: 22, lineHeight: 30, fontWeight: 600, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 1 },
    body: { x: 155, y: 850, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
    comment: { x: 155, y: 905, fontSize: 20, lineHeight: 30, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 18, maxLines: 1 },
  },
  totteoki_no_ashiato: {
    photo: { x: 70, y: 165, width: 680, height: 650, fit: "cover", borderRadiusPx: 4 },
    dateScrapbook: { x: 410, y: 980, fontSize: 18, lineHeight: 30, fill: "#4a3728", textAnchor: "middle", maxCharsPerLine: 16, maxLines: 1 },
    title: { x: 410, y: 58, fontSize: 24, lineHeight: 30, fontWeight: 600, fill: "#4a3728", textAnchor: "middle", maxCharsPerLine: 14, maxLines: 1 },
    body: { x: 40, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
    comment: { x: 40, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
  },
  kyou_no_ashiato_wide: {
    photo: { x: 52, y: 205, width: 472, height: 600, fit: "cover", borderRadiusPx: 12 },
    dateScrapbook: { x: 288, y: 130, fontSize: 18, lineHeight: 30, fill: "#4a3728", textAnchor: "middle", maxCharsPerLine: 14, maxLines: 1 },
    title: { x: 80, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
    body: { x: 80, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
    comment: { x: 80, y: 870, fontSize: 20, lineHeight: 28, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 3 },
  },
  kyou_no_3koma_ashiato: {
    photo: { x: 120, y: 152, width: 340, height: 220, fit: "cover", borderRadiusPx: 14 },
    extraPhotos: [
      { x: 120, y: 416, width: 340, height: 224, fit: "cover", borderRadiusPx: 14 },
      { x: 120, y: 680, width: 340, height: 224, fit: "cover", borderRadiusPx: 14 },
    ],
    dateScrapbook: { x: 288, y: 120, fontSize: 16, lineHeight: 30, fill: "#4a3728", textAnchor: "middle", maxCharsPerLine: 14, maxLines: 1 },
    title: { x: 80, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
    body: { x: 80, y: 40, fontSize: 1, lineHeight: 30, fill: "#00000000", textAnchor: "start", maxCharsPerLine: 1, maxLines: 1 },
    comment: { x: 90, y: 940, fontSize: 18, lineHeight: 26, fill: "#4a3728", textAnchor: "start", maxCharsPerLine: 16, maxLines: 2 },
  },
};

export function moriAshiatoLayoutSlotIds(layout: MoriAshiatoLayoutCoords): MoriAshiatoLayoutSlotId[] {
  const ids: MoriAshiatoLayoutSlotId[] = ["photo"];
  if (layout.extraPhotos?.[0]) ids.push("photo2");
  if (layout.extraPhotos?.[1]) ids.push("photo3");
  if (layout.dateScrapbook) ids.push("date");
  ids.push("title", "body", "comment");
  return ids;
}

export function moriAshiatoTextHitBox(style: MoriAshiatoTextCoords): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const chars = style.maxCharsPerLine ?? 12;
  const lines = style.maxLines ?? 1;
  const fontSize = Math.max(style.fontSize, 12);
  const lineHeight = style.lineHeight ?? Math.round(fontSize * 1.4);
  const width = Math.max(48, Math.round(chars * fontSize * 0.55));
  const height = Math.max(20, Math.round(lines * lineHeight));
  const left =
    style.textAnchor === "middle"
      ? Math.round(style.x - width / 2)
      : style.textAnchor === "end"
        ? Math.round(style.x - width)
        : style.x;
  return { left, top: style.y, width, height };
}
