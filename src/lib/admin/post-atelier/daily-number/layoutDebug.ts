import {
  DAILY_NUMBER_COVER_LAYOUT,
  DAILY_NUMBER_PERSONAL_CARD_TOPS,
  dailyNumberPersonalBlockLayout,
  DAILY_NUMBER_TEMPLATE_SIZE,
} from "./imageLayout";

/** 日記プレビューと同じ考え方：テンプレート設計座標（819×1024）上の 1 辺 */
export const DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX = 5;

export type DailyNumberLayoutSlide =
  | "cover"
  | "explain"
  | "personal-01"
  | "personal-02"
  | "personal-03"
  | "personal-04"
  | "personal-05"
  | "personal-06";

export const DAILY_NUMBER_LAYOUT_SLIDES: {
  id: DailyNumberLayoutSlide;
  label: string;
  templateFile: string;
}[] = [
  { id: "cover", label: "1. 表紙", templateFile: "daily-number-cover-owl.png" },
  { id: "explain", label: "2. 説明", templateFile: "daily-number-explain-owl.png" },
  { id: "personal-01", label: "3. 個別 page_01", templateFile: "daily-number-personal-page_01.png" },
  { id: "personal-02", label: "4. 個別 page_02", templateFile: "daily-number-personal-page_02.png" },
  { id: "personal-03", label: "5. 個別 page_03", templateFile: "daily-number-personal-page_03.png" },
  { id: "personal-04", label: "6. 個別 page_04", templateFile: "daily-number-personal-page_04.png" },
  { id: "personal-05", label: "7. 個別 page_05", templateFile: "daily-number-personal-page_05.png" },
  { id: "personal-06", label: "8. 個別 page_06", templateFile: "daily-number-personal-page_06.png" },
];

export type LayoutAnchor = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
};

export function coverLayoutAnchors(): LayoutAnchor[] {
  const layout = DAILY_NUMBER_COVER_LAYOUT;
  return [
    { id: "number", label: "今日のすうじ（数字）", x: layout.number.cx, y: layout.number.y, kind: "point" },
    { id: "title", label: "サブタイトル", x: layout.title.cx, y: layout.title.y, kind: "point" },
    {
      id: "summary",
      label: "本文（左上）",
      x: layout.summary.x,
      y: layout.summary.y,
      kind: "topleft",
    },
  ];
}

export function personalLayoutAnchors(): LayoutAnchor[] {
  const anchors: LayoutAnchor[] = [];
  for (let blockIndex = 0; blockIndex < 2; blockIndex += 1) {
    const cardTop = DAILY_NUMBER_PERSONAL_CARD_TOPS[blockIndex] ?? DAILY_NUMBER_PERSONAL_CARD_TOPS[0];
    const layout = dailyNumberPersonalBlockLayout(blockIndex);
    const prefix = blockIndex === 0 ? "上段" : "下段";
    anchors.push(
      {
        id: `body-${blockIndex}`,
        label: `${prefix}・本文`,
        x: layout.body.x,
        y: cardTop + layout.body.y,
        kind: "topleft",
      },
      {
        id: `color-${blockIndex}`,
        label: `${prefix}・おまもりカラー`,
        x: layout.color.x,
        y: cardTop + layout.color.y,
        kind: "point",
      },
      {
        id: `actions-${blockIndex}`,
        label: `${prefix}・すごしかた`,
        x: layout.actions.x,
        y: cardTop + layout.actions.y,
        kind: "topleft",
      },
    );
  }
  return anchors;
}

export function layoutAnchorsForSlide(slide: DailyNumberLayoutSlide): LayoutAnchor[] {
  if (slide === "cover") return coverLayoutAnchors();
  if (slide.startsWith("personal-")) return personalLayoutAnchors();
  return [];
}

/** 設計座標用のグリッド SVG（合成にも流用可） */
export function buildLayoutGridSvg(input?: {
  width?: number;
  height?: number;
  minorStep?: number;
  majorStep?: number;
}): string {
  const width = input?.width ?? DAILY_NUMBER_TEMPLATE_SIZE.widthPx;
  const height = input?.height ?? DAILY_NUMBER_TEMPLATE_SIZE.heightPx;
  const minor = input?.minorStep ?? 10;
  const major = input?.majorStep ?? 50;

  const lines: string[] = [];
  for (let x = 0; x <= width; x += minor) {
    const majorLine = x % major === 0;
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${majorLine ? "#c026d3" : "#e9d5ff"}" stroke-width="${majorLine ? 1.2 : 0.6}" opacity="${majorLine ? 0.85 : 0.55}" />`,
    );
    if (majorLine && x > 0 && x < width) {
      lines.push(
        `<text x="${x + 2}" y="12" font-family="monospace" font-size="9" fill="#86198f">${x}</text>`,
      );
    }
  }
  for (let y = 0; y <= height; y += minor) {
    const majorLine = y % major === 0;
    lines.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${majorLine ? "#c026d3" : "#e9d5ff"}" stroke-width="${majorLine ? 1.2 : 0.6}" opacity="${majorLine ? 0.85 : 0.55}" />`,
    );
    if (majorLine && y > 0 && y < height) {
      lines.push(
        `<text x="2" y="${y - 2}" font-family="monospace" font-size="9" fill="#86198f">${y}</text>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${lines.join("")}</svg>`;
}

export function buildLayoutRulerSquareSvg(input: {
  x: number;
  y: number;
  size?: number;
  label?: string;
}): string {
  const size = input.size ?? DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX;
  const label = input.label ?? `${size}px`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DAILY_NUMBER_TEMPLATE_SIZE.widthPx}" height="${DAILY_NUMBER_TEMPLATE_SIZE.heightPx}" viewBox="0 0 ${DAILY_NUMBER_TEMPLATE_SIZE.widthPx} ${DAILY_NUMBER_TEMPLATE_SIZE.heightPx}">
<rect x="${input.x}" y="${input.y}" width="${size}" height="${size}" fill="rgba(217,70,239,0.85)" stroke="#a21caf" stroke-width="1" />
<text x="${input.x + size + 4}" y="${input.y + size - 1}" font-family="monospace" font-size="10" fill="#86198f">${label} @ ${input.x},${input.y}</text>
</svg>`;
}
