import {
  FOREST_BOOKSHELF_ASSETS,
  FOREST_BOOKSHELF_INTRINSIC,
} from "@/lib/ljd/forestBookshelfAssets";
import {
  FOREST_BOOKSHELF_ITEM_LAYOUT,
  FOREST_BOOKSHELF_SPOT_LAYOUT,
  type ForestBookshelfItemId,
  type ForestBookshelfRect,
  type ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";

/** 本棚本体の設計サイズ（px） */
export const FOREST_BOOKSHELF_LAYOUT_SIZE_PX = FOREST_BOOKSHELF_INTRINSIC;

/** こころ予報／ログハウス定規と同じ 5px マス */
export const FOREST_BOOKSHELF_LAYOUT_RULER_SQUARE_PX = 5 as const;

/** 外ランタンなど負座標用の左余白。天板装飾非表示のため 0 */
export const FOREST_BOOKSHELF_LAYOUT_PAD_LEFT_PX = 0 as const;

export type ForestBookshelfLayoutPin = {
  x: number;
  y: number;
};

export type ForestBookshelfLayoutRegion = {
  id: string;
  label: string;
  kind: "item" | "spot";
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  border: string;
};

const ITEM_LABELS: Record<ForestBookshelfItemId, string> = {
  plant: "植物",
  lanternShelf: "棚ランタン",
  kanteiCover: "鑑定書表紙",
  spinesFortune: "鑑定背表紙",
  createDiary: "あしあとブックを作る",
  currentDiary: "現在のあしあとブック",
  placeholderRed: "赤プレースホルダー",
  placeholderGreen: "緑プレースホルダー",
  spinesDiary: "あしあと背表紙",
  owl: "フクロウ",
  lanternFloor: "外ランタン",
};

const ITEM_COLORS: Record<ForestBookshelfItemId, { color: string; border: string }> = {
  plant: { color: "rgba(34,197,94,0.18)", border: "rgba(22,163,74,0.9)" },
  lanternShelf: { color: "rgba(234,179,8,0.2)", border: "rgba(202,138,4,0.95)" },
  kanteiCover: { color: "rgba(245,158,11,0.2)", border: "rgba(217,119,6,0.95)" },
  spinesFortune: { color: "rgba(59,130,246,0.18)", border: "rgba(37,99,235,0.9)" },
  createDiary: { color: "rgba(168,85,247,0.18)", border: "rgba(147,51,234,0.95)" },
  currentDiary: { color: "rgba(14,165,233,0.18)", border: "rgba(2,132,199,0.95)" },
  placeholderRed: { color: "rgba(239,68,68,0.18)", border: "rgba(220,38,38,0.9)" },
  placeholderGreen: { color: "rgba(20,184,166,0.18)", border: "rgba(13,148,136,0.9)" },
  spinesDiary: { color: "rgba(99,102,241,0.18)", border: "rgba(79,70,229,0.9)" },
  owl: { color: "rgba(120,113,108,0.2)", border: "rgba(68,64,60,0.9)" },
  lanternFloor: { color: "rgba(251,191,36,0.22)", border: "rgba(180,83,9,0.95)" },
};

export function forestBookshelfLayoutPercent(pin: ForestBookshelfLayoutPin): {
  x: string;
  y: string;
} {
  const { widthPx, heightPx } = FOREST_BOOKSHELF_LAYOUT_SIZE_PX;
  return {
    x: ((pin.x / widthPx) * 100).toFixed(1),
    y: ((pin.y / heightPx) * 100).toFixed(1),
  };
}

export function forestBookshelfLayoutPxFromPercent(rect: ForestBookshelfRect): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { widthPx, heightPx } = FOREST_BOOKSHELF_LAYOUT_SIZE_PX;
  return {
    x: Math.round((rect.left / 100) * widthPx),
    y: Math.round((rect.top / 100) * heightPx),
    width: Math.round((rect.width / 100) * widthPx),
    height: Math.round((rect.height / 100) * heightPx),
  };
}

export function forestBookshelfLayoutCopyHint(pin: ForestBookshelfLayoutPin): string {
  const p = forestBookshelfLayoutPercent(pin);
  return `{ left: ${p.x}, top: ${p.y}, width: ?, height: ? }`;
}

export function forestBookshelfRectSnippet(
  id: string,
  rect: ForestBookshelfRect,
): string {
  return `${id}: { left: ${fmt(rect.left)}, top: ${fmt(rect.top)}, width: ${fmt(rect.width)}, height: ${fmt(rect.height)} },`;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function buildForestBookshelfLayoutGridSvg(): string {
  const { widthPx: width, heightPx: height } = FOREST_BOOKSHELF_LAYOUT_SIZE_PX;
  const step = FOREST_BOOKSHELF_LAYOUT_RULER_SQUARE_PX;
  let lines = "";
  for (let i = 0; i <= width; i += step) {
    const major = i % 50 === 0;
    const stroke = major ? "rgba(120,80,40,0.4)" : "rgba(120,80,40,0.14)";
    const strokeWidth = major ? 1 : 0.5;
    lines += `<line x1="${i}" y1="0" x2="${i}" y2="${height}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }
  for (let i = 0; i <= height; i += step) {
    const major = i % 50 === 0;
    const stroke = major ? "rgba(120,80,40,0.4)" : "rgba(120,80,40,0.14)";
    const strokeWidth = major ? 1 : 0.5;
    lines += `<line x1="0" y1="${i}" x2="${width}" y2="${i}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${lines}</svg>`;
}

export function forestBookshelfLayoutRegions(overrides?: {
  items?: Partial<Record<ForestBookshelfItemId, ForestBookshelfRect>>;
  spots?: Partial<Record<ForestBookshelfSpotId, ForestBookshelfRect>>;
}): ForestBookshelfLayoutRegion[] {
  const items = { ...FOREST_BOOKSHELF_ITEM_LAYOUT, ...overrides?.items };
  const spots = { ...FOREST_BOOKSHELF_SPOT_LAYOUT, ...overrides?.spots };

  const itemRegions: ForestBookshelfLayoutRegion[] = (
    Object.keys(items) as ForestBookshelfItemId[]
  ).map((id) => {
    const rect = items[id]!;
    const style = ITEM_COLORS[id];
    return {
      id: `item-${id}`,
      label: ITEM_LABELS[id],
      kind: "item" as const,
      ...rect,
      color: style.color,
      border: style.border,
    };
  });

  const spotRegions: ForestBookshelfLayoutRegion[] = (
    Object.keys(spots) as ForestBookshelfSpotId[]
  ).map((id) => {
    const rect = spots[id]!;
    return {
      id: `spot-${id}`,
      label: `${ITEM_LABELS[id] ?? id}タップ`,
      kind: "spot" as const,
      ...rect,
      color: "rgba(166,124,61,0.08)",
      border: "rgba(166,124,61,0.7)",
    };
  });

  return [...itemRegions, ...spotRegions];
}

export function forestBookshelfLayoutDebugSnapshot() {
  return {
    assets: FOREST_BOOKSHELF_ASSETS,
    size: FOREST_BOOKSHELF_LAYOUT_SIZE_PX,
    items: FOREST_BOOKSHELF_ITEM_LAYOUT,
    spots: FOREST_BOOKSHELF_SPOT_LAYOUT,
  };
}

export const FOREST_BOOKSHELF_ITEM_IDS = Object.keys(
  FOREST_BOOKSHELF_ITEM_LAYOUT,
) as ForestBookshelfItemId[];

export const FOREST_BOOKSHELF_SPOT_IDS = Object.keys(
  FOREST_BOOKSHELF_SPOT_LAYOUT,
) as ForestBookshelfSpotId[];

export { ITEM_LABELS as FOREST_BOOKSHELF_ITEM_LABELS };

/**
 * 各段の「棚板の上面」付近（上端からの %）。
 * 本の下端をここへ合わせると棚に乗った見え方になりやすい。
 * 見本に合わせて微調整可。
 */
export const FOREST_BOOKSHELF_SHELF_FLOOR_Y_PERCENT = [
  { id: "shelf1", label: "1段目（鑑定書）", y: 41.5 },
  { id: "shelf2", label: "2段目（日記ブック）", y: 72.5 },
  { id: "shelf3", label: "3段目（これまでの）", y: 91.5 },
] as const;

/** 下端（上からの %）= top + height */
export function forestBookshelfBottomEdge(rect: ForestBookshelfRect): number {
  return Number((rect.top + rect.height).toFixed(1));
}

/** 下端を固定して高さ変更 → top をずらす */
export function forestBookshelfRectWithBottomEdge(
  rect: ForestBookshelfRect,
  bottomEdge: number,
): ForestBookshelfRect {
  const height = Math.max(1, rect.height);
  return {
    ...rect,
    top: Number((bottomEdge - height).toFixed(1)),
    height,
  };
}

/** 下端固定のまま高さだけ変える（上方向へ伸びる） */
export function forestBookshelfRectGrowFromBottom(
  rect: ForestBookshelfRect,
  nextHeight: number,
): ForestBookshelfRect {
  const height = Math.max(1, nextHeight);
  const bottom = forestBookshelfBottomEdge(rect);
  return {
    ...rect,
    top: Number((bottom - height).toFixed(1)),
    height: Number(height.toFixed(1)),
  };
}
