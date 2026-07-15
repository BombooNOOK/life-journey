import type {
  ForestBookshelfItemId,
  ForestBookshelfRect,
  ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function rectLine(id: string, rect: ForestBookshelfRect, indent = "  "): string {
  return `${indent}${id}: { left: ${fmt(rect.left)}, top: ${fmt(rect.top)}, width: ${fmt(rect.width)}, height: ${fmt(rect.height)} },`;
}

const ITEM_ORDER: ForestBookshelfItemId[] = [
  "plant",
  "lanternShelf",
  "kanteiCover",
  "spinesFortune",
  "createDiary",
  "currentDiary",
  "placeholderRed",
  "placeholderGreen",
  "spinesDiary",
  "owl",
  "lanternFloor",
];

const SPOT_ORDER: ForestBookshelfSpotId[] = [
  "kanteiCover",
  "spinesFortune",
  "createDiary",
  "currentDiary",
  "placeholderRed",
  "placeholderGreen",
  "spinesDiary",
];

const ITEM_COMMENTS: Partial<Record<ForestBookshelfItemId, string>> = {
  plant: "/** 非表示（天板装飾） */",
  lanternShelf: "/** 非表示（天板装飾） */",
  kanteiCover: "/** 1段目：鑑定書 */",
  createDiary: "/** 2段目：日記ブック */",
  placeholderGreen: "/** 3段目：これまでの日記ブック */",
  lanternFloor: "/** 非表示（床ランタン） */",
};

/** 定規の下書きから forestBookshelfLayout.ts 全文を生成 */
export function buildForestBookshelfLayoutTsSource(params: {
  items: Record<ForestBookshelfItemId, ForestBookshelfRect>;
  spots: Record<ForestBookshelfSpotId, ForestBookshelfRect>;
}): string {
  const itemLines = ITEM_ORDER.flatMap((id) => {
    const comment = ITEM_COMMENTS[id];
    const line = rectLine(id, params.items[id]);
    return comment ? [`  ${comment}`, line] : [line];
  });

  const spotLines = SPOT_ORDER.map((id) => rectLine(id, params.spots[id]));

  return `/**
 * 森の本棚 — パーツ配置（%）
 * 基準: bookshelf_main.png（576×1024）目の前アップ構図
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
 */

export type ForestBookshelfRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** 画像描画領域（見た目） */
export type ForestBookshelfItemId =
  | "plant"
  | "lanternShelf"
  | "kanteiCover"
  | "spinesFortune"
  | "createDiary"
  | "currentDiary"
  | "placeholderRed"
  | "placeholderGreen"
  | "spinesDiary"
  | "owl"
  | "lanternFloor";

/** タップ可能スポット */
export type ForestBookshelfSpotId =
  | "kanteiCover"
  | "spinesFortune"
  | "createDiary"
  | "currentDiary"
  | "placeholderRed"
  | "placeholderGreen"
  | "spinesDiary";

export const FOREST_BOOKSHELF_ITEM_LAYOUT: Record<ForestBookshelfItemId, ForestBookshelfRect> = {
${itemLines.join("\n")}
};

/** タップ領域は見た目より少し広め */
export const FOREST_BOOKSHELF_SPOT_LAYOUT: Record<ForestBookshelfSpotId, ForestBookshelfRect> = {
${spotLines.join("\n")}
};
`;
}

export function isForestBookshelfRect(value: unknown): value is ForestBookshelfRect {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.left === "number" &&
    typeof r.top === "number" &&
    typeof r.width === "number" &&
    typeof r.height === "number" &&
    Number.isFinite(r.left) &&
    Number.isFinite(r.top) &&
    Number.isFinite(r.width) &&
    Number.isFinite(r.height)
  );
}
