import sharp from "sharp";

import {
  assertDailyNumberTemplateExists,
  dailyNumberClosingBackgroundPath,
  dailyNumberClosingOverlayExists,
  dailyNumberClosingOverlayPath,
  dailyNumberCoverTemplatePath,
  dailyNumberExplainTemplatePath,
  dailyNumberPersonalTemplatePath,
  DAILY_NUMBER_TEMPLATE_SIZE,
} from "./assetPaths";
import {
  DAILY_NUMBER_CLOSING_VARIANT_LABELS,
  type DailyNumberClosingVariant,
} from "./closingVariant";
import {
  DAILY_NUMBER_COVER_LAYOUT,
  DAILY_NUMBER_PERSONAL_CARD_TOPS,
  dailyNumberPersonalBlockLayout,
  DAILY_NUMBER_TEXT_COLOR,
} from "./imageLayout";
import { buildActionLinesSvg, buildSvgFromInnerMarkup, buildSvgTextOverlay } from "./svgText";
import type {
  DailyNumberGeneratedPayload,
  DailyNumberMessage,
  DailyNumberPagePreview,
} from "./types";

export type DailyNumberCompositeSlide = {
  /** 1-based carousel index */
  index: number;
  filename: string;
  label: string;
  buffer: Buffer;
};

function buildCoverOverlay(payload: DailyNumberGeneratedPayload): Buffer {
  const layout = DAILY_NUMBER_COVER_LAYOUT;
  return buildSvgTextOverlay({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    color: DAILY_NUMBER_TEXT_COLOR,
    items: [
      {
        text: String(payload.todayNumber),
        style: {
          x: layout.number.cx,
          y: layout.number.y,
          fontSize: layout.number.fontSize,
          fontWeight: layout.number.fontWeight,
          textAnchor: "middle",
        },
      },
      {
        text: payload.cover.title,
        style: {
          x: layout.title.cx,
          y: layout.title.y,
          fontSize: layout.title.fontSize,
          fontWeight: layout.title.fontWeight,
          textAnchor: "middle",
        },
      },
      {
        text: payload.cover.summaryMessage,
        style: {
          x: layout.summary.x,
          y: layout.summary.y,
          fontSize: layout.summary.fontSize,
          lineHeight: layout.summary.lineHeight,
          maxCharsPerLine: layout.summary.maxCharsPerLine,
          maxLines: layout.summary.maxLines,
        },
        multiline: true,
      },
    ],
  });
}

function personalBlockSvgParts(
  block: DailyNumberMessage,
  blockIndex: number,
): string[] {
  const cardTop =
    DAILY_NUMBER_PERSONAL_CARD_TOPS[blockIndex] ?? DAILY_NUMBER_PERSONAL_CARD_TOPS[0];
  const layout = dailyNumberPersonalBlockLayout(blockIndex);
  const bodyOverlay = buildSvgTextOverlay({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    color: DAILY_NUMBER_TEXT_COLOR,
    items: [
      {
        text: block.body,
        style: {
          x: layout.body.x,
          y: cardTop + layout.body.y,
          fontSize: layout.body.fontSize,
          lineHeight: layout.body.lineHeight,
          maxLines: layout.body.maxLines,
          lineRules: layout.body.lineRules,
          continuationLineRule: layout.body.continuationLineRule,
        },
        multiline: true,
      },
      {
        text: block.colorName,
        style: {
          x: layout.color.x,
          y: cardTop + layout.color.y,
          fontSize: layout.color.fontSize,
          textAnchor: "middle",
        },
      },
    ],
  });

  const inner = bodyOverlay
    .toString("utf8")
    .replace(/<\?xml[\s\S]*?<defs>[\s\S]*?<\/defs>/, "")
    .replace(/<\/svg>/, "")
    .trim();

  return [
    inner,
    buildActionLinesSvg({
      actions: block.actions,
      x: layout.actions.x,
      y: cardTop + layout.actions.y,
      fontSize: layout.actions.fontSize,
      lineHeight: layout.actions.lineHeight,
      maxCharsPerLine: layout.actions.maxCharsPerLine,
      fill: DAILY_NUMBER_TEXT_COLOR,
    }),
  ];
}

function buildPersonalPageOverlay(page: DailyNumberPagePreview): Buffer {
  const parts: string[] = [];
  page.blocks.forEach((block, blockIndex) => {
    parts.push(...personalBlockSvgParts(block, blockIndex));
  });

  return buildSvgFromInnerMarkup({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    innerMarkup: parts.join("\n"),
  });
}

async function compositeTemplate(
  templatePath: string,
  overlay: Buffer | null,
): Promise<Buffer> {
  assertDailyNumberTemplateExists(templatePath);
  const base = sharp(templatePath);
  if (!overlay || overlay.byteLength === 0) {
    return base.png().toBuffer();
  }
  return base
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function personalSlideLabel(page: DailyNumberPagePreview): string {
  if (page.blocks.length === 2) {
    return `すうじ${page.blocks[0]!.lifePathNumber}・すうじ${page.blocks[1]!.lifePathNumber}`;
  }
  if (page.blocks.length === 1) {
    return `すうじ${page.blocks[0]!.lifePathNumber}`;
  }
  return `ページ${page.pageIndex + 1}`;
}

async function compositeClosingSlide(closingVariant: DailyNumberClosingVariant): Promise<Buffer> {
  const bgPath = dailyNumberClosingBackgroundPath(closingVariant);
  let overlay: Buffer | null = null;
  if (dailyNumberClosingOverlayExists(closingVariant)) {
    overlay = await sharp(dailyNumberClosingOverlayPath(closingVariant)).png().toBuffer();
  }
  return compositeTemplate(bgPath, overlay);
}

export async function compositeDailyNumberCarousel(
  payload: DailyNumberGeneratedPayload,
): Promise<DailyNumberCompositeSlide[]> {
  const character = payload.character;
  const slides: DailyNumberCompositeSlide[] = [];

  slides.push({
    index: 1,
    filename: "01-cover.png",
    label: "表紙",
    buffer: await compositeTemplate(
      dailyNumberCoverTemplatePath(character),
      buildCoverOverlay(payload),
    ),
  });

  slides.push({
    index: 2,
    filename: "02-explain.png",
    label: "説明",
    buffer: await compositeTemplate(dailyNumberExplainTemplatePath(character), null),
  });

  for (const page of payload.pages) {
    const pageNo = page.pageIndex + 1;
    const carouselIndex = pageNo + 2;
    slides.push({
      index: carouselIndex,
      filename: `${String(carouselIndex).padStart(2, "0")}-personal-page_${String(pageNo).padStart(2, "0")}.png`,
      label: personalSlideLabel(page),
      buffer: await compositeTemplate(
        dailyNumberPersonalTemplatePath(pageNo),
        buildPersonalPageOverlay(page),
      ),
    });
  }

  const closingIndex = payload.pages.length + 3;
  slides.push({
    index: closingIndex,
    filename: `${String(closingIndex).padStart(2, "0")}-closing-${payload.closingVariant}.png`,
    label: `ラストページ（${DAILY_NUMBER_CLOSING_VARIANT_LABELS[payload.closingVariant]}）`,
    buffer: await compositeClosingSlide(payload.closingVariant),
  });

  return slides;
}

export function dailyNumberZipBasename(payload: DailyNumberGeneratedPayload): string {
  const date = payload.scheduledDate || "undated";
  return `kokoro-yoho_${date}_ud${payload.todayNumber}_${payload.character}`;
}

export async function buildDailyNumberZipBuffer(
  payload: DailyNumberGeneratedPayload,
): Promise<{ buffer: Buffer; basename: string; slides: DailyNumberCompositeSlide[] }> {
  const { zipSync } = await import("fflate");
  const slides = await compositeDailyNumberCarousel(payload);
  const entries: Record<string, Uint8Array> = {};

  for (const slide of slides) {
    entries[slide.filename] = new Uint8Array(slide.buffer);
  }

  entries["README.txt"] = new TextEncoder().encode(
    [
      "あなたのすうじで読む 今日のこころ予報",
      `予定日: ${payload.scheduledDate}`,
      `今日のすうじ: ${payload.todayNumber}`,
      `キャラ: ${payload.character}`,
      "",
      "01-cover.png … 表紙",
      "02-explain.png … 説明（固定）",
      "03〜08 … 個別ページ（page_01〜06）",
      "09-closing-*.png … ラストページ（4種からランダム）",
      "",
      "Instagram カルーセルは 01 から順に投稿してください。",
    ].join("\n"),
  );

  const buffer = Buffer.from(zipSync(entries, { level: 0 }));
  return { buffer, basename: dailyNumberZipBasename(payload), slides };
}
