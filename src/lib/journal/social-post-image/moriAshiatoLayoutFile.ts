import {
  MORI_ASHIATO_TEMPLATE_IDS,
  type MoriAshiatoTemplateId,
} from "./moriAshiatoTemplates";
import type {
  MoriAshiatoLayoutCoords,
  MoriAshiatoPhotoCoords,
  MoriAshiatoTextCoords,
} from "./moriAshiatoLayoutData";

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(2)));
}

function photoLiteral(p: MoriAshiatoPhotoCoords): string {
  const parts = [
    `x: ${fmt(p.x)}`,
    `y: ${fmt(p.y)}`,
    `width: ${fmt(p.width)}`,
    `height: ${fmt(p.height)}`,
    `fit: "${p.fit}"`,
  ];
  if (p.borderRadiusPx != null) parts.push(`borderRadiusPx: ${fmt(p.borderRadiusPx)}`);
  if (p.rotateDeg != null) parts.push(`rotateDeg: ${fmt(p.rotateDeg)}`);
  if (p.displayScale != null) parts.push(`displayScale: ${fmt(p.displayScale)}`);
  return `{ ${parts.join(", ")} }`;
}

function textLiteral(t: MoriAshiatoTextCoords): string {
  const parts = [`x: ${fmt(t.x)}`, `y: ${fmt(t.y)}`, `fontSize: ${fmt(t.fontSize)}`];
  if (t.lineHeight != null) parts.push(`lineHeight: ${fmt(t.lineHeight)}`);
  if (t.fontWeight != null) parts.push(`fontWeight: ${t.fontWeight}`);
  if (t.fill != null) parts.push(`fill: ${JSON.stringify(t.fill)}`);
  if (t.textAnchor != null) parts.push(`textAnchor: "${t.textAnchor}"`);
  if (t.rotateDeg != null) parts.push(`rotateDeg: ${fmt(t.rotateDeg)}`);
  if (t.maxCharsPerLine != null) parts.push(`maxCharsPerLine: ${fmt(t.maxCharsPerLine)}`);
  if (t.maxLines != null) parts.push(`maxLines: ${fmt(t.maxLines)}`);
  return `{ ${parts.join(", ")} }`;
}

function isPhotoCoords(v: unknown): v is MoriAshiatoPhotoCoords {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.width === "number" &&
    typeof o.height === "number" &&
    (o.fit === "cover" || o.fit === "contain")
  );
}

function isTextCoords(v: unknown): v is MoriAshiatoTextCoords {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.x === "number" && typeof o.y === "number" && typeof o.fontSize === "number";
}

function isLayoutCoords(v: unknown): v is MoriAshiatoLayoutCoords {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isPhotoCoords(o.photo) || !isTextCoords(o.title) || !isTextCoords(o.body) || !isTextCoords(o.comment)) {
    return false;
  }
  if (o.dateScrapbook != null && !isTextCoords(o.dateScrapbook)) return false;
  if (o.promptLabel != null && !isTextCoords(o.promptLabel)) return false;
  if (o.summary != null && !isTextCoords(o.summary)) return false;
  if (o.extraPhotos != null) {
    if (!Array.isArray(o.extraPhotos) || !o.extraPhotos.every(isPhotoCoords)) return false;
  }
  return true;
}

export function parseMoriAshiatoLayouts(
  raw: unknown,
): Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords>;
  for (const id of MORI_ASHIATO_TEMPLATE_IDS) {
    if (!isLayoutCoords(obj[id])) return null;
    out[id] = obj[id] as MoriAshiatoLayoutCoords;
  }
  return out;
}

function layoutBlock(id: MoriAshiatoTemplateId, layout: MoriAshiatoLayoutCoords): string {
  const lines: string[] = [`    photo: ${photoLiteral(layout.photo)},`];
  if (layout.extraPhotos?.length) {
    lines.push("    extraPhotos: [");
    for (const p of layout.extraPhotos) {
      lines.push(`      ${photoLiteral(p)},`);
    }
    lines.push("    ],");
  }
  if (layout.dateScrapbook) {
    lines.push(`    dateScrapbook: ${textLiteral(layout.dateScrapbook)},`);
  }
  lines.push(`    title: ${textLiteral(layout.title)},`);
  lines.push(`    body: ${textLiteral(layout.body)},`);
  if (layout.promptLabel) {
    lines.push(`    promptLabel: ${textLiteral(layout.promptLabel)},`);
  }
  lines.push(`    comment: ${textLiteral(layout.comment)},`);
  if (layout.summary) {
    lines.push(`    summary: ${textLiteral(layout.summary)},`);
  }
  return `  ${id}: {\n${lines.join("\n")}\n  },`;
}

/** 定規の下書きから moriAshiatoLayoutData.ts 全文を生成 */
export function buildMoriAshiatoLayoutDataTsSource(
  layouts: Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords>,
): string {
  const blocks = MORI_ASHIATO_TEMPLATE_IDS.map((id) => layoutBlock(id, layouts[id]));

  return `/**
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
  /** 今日のあしあとなど：3択ラベル（どんな言葉を残しますか？） */
  promptLabel?: MoriAshiatoTextCoords;
  comment: MoriAshiatoTextCoords;
  /** 3コマなど：全体のおまとめ（今日のひとこと） */
  summary?: MoriAshiatoTextCoords;
};

export type MoriAshiatoLayoutSlotId =
  | "photo"
  | "photo2"
  | "photo3"
  | "date"
  | "title"
  | "body"
  | "promptLabel"
  | "comment"
  | "summary";

export const MORI_ASHIATO_LAYOUT_SLOT_LABELS: Record<MoriAshiatoLayoutSlotId, string> = {
  photo: "写真1",
  photo2: "写真2",
  photo3: "写真3",
  date: "日付",
  title: "タイトル",
  body: "本文",
  promptLabel: "どんな言葉を残しますか？",
  comment: "ひとこと",
  summary: "今日のひとこと",
};

export const MORI_ASHIATO_LAYOUT_SLOT_COLORS: Record<MoriAshiatoLayoutSlotId, string> = {
  photo: "rgba(56, 189, 248, 0.28)",
  photo2: "rgba(14, 165, 233, 0.28)",
  photo3: "rgba(2, 132, 199, 0.28)",
  date: "rgba(251, 191, 36, 0.35)",
  title: "rgba(244, 114, 182, 0.32)",
  body: "rgba(52, 211, 153, 0.32)",
  promptLabel: "rgba(251, 146, 60, 0.35)",
  comment: "rgba(167, 139, 250, 0.32)",
  summary: "rgba(244, 63, 94, 0.28)",
};

export const MORI_ASHIATO_LAYOUTS: Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> = {
${blocks.join("\n")}
};

export function moriAshiatoLayoutSlotIds(layout: MoriAshiatoLayoutCoords): MoriAshiatoLayoutSlotId[] {
  const ids: MoriAshiatoLayoutSlotId[] = ["photo"];
  if (layout.extraPhotos?.[0]) ids.push("photo2");
  if (layout.extraPhotos?.[1]) ids.push("photo3");
  if (layout.dateScrapbook) ids.push("date");
  ids.push("title", "body");
  if (layout.promptLabel) ids.push("promptLabel");
  ids.push("comment");
  if (layout.summary) ids.push("summary");
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
`;
}
