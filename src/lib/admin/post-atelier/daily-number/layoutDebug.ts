import {
  DAILY_NUMBER_COVER_LAYOUT,
  DAILY_NUMBER_COVER_SCHEDULED_DATE_LAYOUT,
  DAILY_NUMBER_LAYOUT_SAMPLE,
  dailyNumberPersonalPageLayout,
  dailyNumberPersonalPageSide,
  DAILY_NUMBER_TEMPLATE_SIZE,
} from "./imageLayout";
import { dailyNumberCharmColorSvgPosition } from "./charmColorLayout";

/** あしあとプレビューと同じ考え方：テンプレート設計座標（819×1024）上の 1 辺 */
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
  { id: "cover", label: "1. 表紙（完成 PNG）", templateFile: "daily-number-cover-owl.png" },
  { id: "explain", label: "2. 今日のこころ予報の見方", templateFile: "daily-number-explain-owl.png" },
  { id: "personal-01", label: "3. 個別 page_01（左）", templateFile: "daily-number-personal-page_01.png" },
  { id: "personal-02", label: "4. 個別 page_02（右）", templateFile: "daily-number-personal-page_02.png" },
  { id: "personal-03", label: "5. 個別 page_03（左）", templateFile: "daily-number-personal-page_03.png" },
  { id: "personal-04", label: "6. 個別 page_04（右）", templateFile: "daily-number-personal-page_04.png" },
  { id: "personal-05", label: "7. 個別 page_05（左）", templateFile: "daily-number-personal-page_05.png" },
  { id: "personal-06", label: "8. 個別 page_06（右）", templateFile: "daily-number-personal-page_06.png" },
];

export type LayoutAnchor = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
};

export function layoutSlideToPageIndex(slide: DailyNumberLayoutSlide): number | null {
  const match = slide.match(/^personal-(\d{2})$/);
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

export function coverLayoutAnchors(): LayoutAnchor[] {
  const layout = DAILY_NUMBER_COVER_LAYOUT;
  const dateLayout = DAILY_NUMBER_COVER_SCHEDULED_DATE_LAYOUT;
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
    {
      id: "scheduledDate",
      label: "投稿予定日（地面付近）",
      x: dateLayout.cx,
      y: dateLayout.y,
      kind: "point",
    },
  ];
}

export function personalLayoutAnchors(pageIndex1Based = 1): LayoutAnchor[] {
  const page = dailyNumberPersonalPageLayout(pageIndex1Based);
  const sideLabel = dailyNumberPersonalPageSide(pageIndex1Based) === "left" ? "左" : "右";
  const anchors: LayoutAnchor[] = [
    {
      id: "todayNumber",
      label: `ヘッダー・今日のすうじ（${sideLabel}）`,
      x: page.header.todayNumber.cx,
      y: page.header.todayNumber.y,
      kind: "point",
    },
  ];

  for (let blockIndex = 0; blockIndex < 2; blockIndex += 1) {
    const layout = page.blocks[blockIndex]!;
    const prefix = blockIndex === 0 ? "上段" : "下段";
    const colorPos = dailyNumberCharmColorSvgPosition(
      layout.color.cx,
      layout.color.fontSize,
      DAILY_NUMBER_LAYOUT_SAMPLE.colorName,
    );
    anchors.push(
      {
        id: `body-${blockIndex}`,
        label: `${prefix}・本文（1文目）`,
        x: layout.body.x,
        y: layout.body.y,
        kind: "topleft",
      },
      {
        id: `color-${blockIndex}`,
        label: `${prefix}・おまもりカラー（左端）`,
        x: colorPos.x,
        y: layout.color.y,
        kind: "topleft",
      },
    );
  }

  return anchors;
}

export function layoutAnchorsForSlide(slide: DailyNumberLayoutSlide): LayoutAnchor[] {
  if (slide === "cover") return coverLayoutAnchors();
  const pageIndex = layoutSlideToPageIndex(slide);
  if (pageIndex != null) return personalLayoutAnchors(pageIndex);
  return [];
}

export function personalLayoutSampleTexts(pageIndex1Based = 1): Array<{
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
  fontSize: number;
  fontWeight?: 400 | 600;
}> {
  const page = dailyNumberPersonalPageLayout(pageIndex1Based);
  const colorTopPos = dailyNumberCharmColorSvgPosition(
    page.blocks[0]!.color.cx,
    page.blocks[0]!.color.fontSize,
    DAILY_NUMBER_LAYOUT_SAMPLE.colorName,
  );
  const colorBottomPos = dailyNumberCharmColorSvgPosition(
    page.blocks[1]!.color.cx,
    page.blocks[1]!.color.fontSize,
    DAILY_NUMBER_LAYOUT_SAMPLE.colorName,
  );
  return [
    {
      id: "todayNumber",
      label: "今日のすうじ",
      text: DAILY_NUMBER_LAYOUT_SAMPLE.todayNumber,
      x: page.header.todayNumber.cx,
      y: page.header.todayNumber.y,
      kind: "point",
      fontSize: page.header.todayNumber.fontSize,
      fontWeight: page.header.todayNumber.fontWeight,
    },
    {
      id: "body-top",
      label: "上段・本文",
      text: DAILY_NUMBER_LAYOUT_SAMPLE.body,
      x: page.blocks[0]!.body.x,
      y: page.blocks[0]!.body.y,
      kind: "topleft",
      fontSize: page.blocks[0]!.body.fontSize,
    },
    {
      id: "color-top",
      label: "上段・カラー",
      text: DAILY_NUMBER_LAYOUT_SAMPLE.colorName,
      x: colorTopPos.x,
      y: page.blocks[0]!.color.y,
      kind: "topleft",
      fontSize: page.blocks[0]!.color.fontSize,
      fontWeight: page.blocks[0]!.color.fontWeight,
    },
    {
      id: "body-bottom",
      label: "下段・本文",
      text: DAILY_NUMBER_LAYOUT_SAMPLE.body,
      x: page.blocks[1]!.body.x,
      y: page.blocks[1]!.body.y,
      kind: "topleft",
      fontSize: page.blocks[1]!.body.fontSize,
    },
    {
      id: "color-bottom",
      label: "下段・カラー",
      text: DAILY_NUMBER_LAYOUT_SAMPLE.colorName,
      x: colorBottomPos.x,
      y: page.blocks[1]!.color.y,
      kind: "topleft",
      fontSize: page.blocks[1]!.color.fontSize,
      fontWeight: page.blocks[1]!.color.fontWeight,
    },
  ];
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
