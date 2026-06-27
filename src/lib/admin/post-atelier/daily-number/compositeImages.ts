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
import { prepareCompositeOverlay } from "./renderSvgOverlay";
import {
  DAILY_NUMBER_CLOSING_VARIANT_LABELS,
  type DailyNumberClosingVariant,
} from "./closingVariant";
import {
  dailyNumberPersonalBlockLayoutV2,
  dailyNumberPersonalPageLayout,
  DAILY_NUMBER_TEXT_COLOR,
} from "./imageLayout";
import { formatCharmColorForImage } from "./charmColorDisplay";
import { dailyNumberCharmColorSvgPosition } from "./charmColorLayout";
import { extractImageBody } from "./messageTextSplit";
import { wrapDailyNumberImageBody } from "./imageBodyWrap";
import { buildSvgFromInnerMarkup, buildSvgTextOverlay } from "./svgText";
import type {
  DailyNumberGeneratedPayload,
  DailyNumberMessage,
  DailyNumberPagePreview,
  DailyNumberTodayValue,
} from "./types";
import { buildInstagramCaption } from "./buildCopyText";
import { DAILY_NUMBER_INSTAGRAM_CAPTION_FILENAME } from "./instagramCaptionCopy";

export type DailyNumberCompositeSlide = {
  /** 1-based carousel index */
  index: number;
  filename: string;
  label: string;
  buffer: Buffer;
};

function personalBlockSvgParts(
  block: DailyNumberMessage,
  pageIndex1Based: number,
  blockIndex: number,
): string[] {
  const layout = dailyNumberPersonalBlockLayoutV2(pageIndex1Based, blockIndex);
  const imageBody = extractImageBody(block.body);
  const charmColorText = formatCharmColorForImage(block.colorName);
  const charmColorPos = dailyNumberCharmColorSvgPosition(
    layout.color.cx,
    layout.color.fontSize,
    charmColorText,
  );
  const bodyOverlay = buildSvgTextOverlay({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    color: DAILY_NUMBER_TEXT_COLOR,
    items: [
      {
        text: imageBody,
        style: {
          x: layout.body.x,
          y: layout.body.y,
          fontSize: layout.body.fontSize,
          lineHeight: layout.body.lineHeight,
          maxLines: layout.body.maxLines,
          wrappedLines: wrapDailyNumberImageBody(imageBody, {
            continuationMaxCharsPerLine: layout.body.imageBodyContinuationMaxCharsPerLine,
            maxLines: layout.body.maxLines,
          }),
        },
        multiline: true,
      },
      {
        text: charmColorText,
        style: {
          x: charmColorPos.x,
          y: layout.color.y,
          fontSize: layout.color.fontSize,
          fontWeight: layout.color.fontWeight,
          textAnchor: charmColorPos.textAnchor,
        },
      },
    ],
  });

  const inner = bodyOverlay
    .toString("utf8")
    .replace(/<\?xml[\s\S]*?<defs>[\s\S]*?<\/defs>/, "")
    .replace(/<\/svg>/, "")
    .trim();

  return [inner];
}

function buildPersonalPageOverlay(
  page: DailyNumberPagePreview,
  todayNumber: DailyNumberTodayValue,
): Buffer {
  const pageIndex1Based = page.pageIndex + 1;
  const pageLayout = dailyNumberPersonalPageLayout(pageIndex1Based);
  const parts: string[] = [];

  const headerOverlay = buildSvgTextOverlay({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    color: DAILY_NUMBER_TEXT_COLOR,
    items: [
      {
        text: String(todayNumber),
        style: {
          x: pageLayout.header.todayNumber.cx,
          y: pageLayout.header.todayNumber.y,
          fontSize: pageLayout.header.todayNumber.fontSize,
          fontWeight: pageLayout.header.todayNumber.fontWeight,
          textAnchor: "middle",
        },
      },
    ],
  });

  parts.push(
    headerOverlay
      .toString("utf8")
      .replace(/<\?xml[\s\S]*?<defs>[\s\S]*?<\/defs>/, "")
      .replace(/<\/svg>/, "")
      .trim(),
  );

  page.blocks.forEach((block, blockIndex) => {
    parts.push(...personalBlockSvgParts(block, pageIndex1Based, blockIndex));
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
  const overlayPng = await prepareCompositeOverlay(overlay);
  return base
    .composite([{ input: overlayPng, top: 0, left: 0 }])
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
    buffer: await compositeTemplate(dailyNumberCoverTemplatePath(character), null),
  });

  slides.push({
    index: 2,
    filename: "02-explain.png",
    label: "今日のこころ予報の見方",
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
        buildPersonalPageOverlay(page, payload.todayNumber),
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
      "01-cover.png … 表紙（キャラ別・完成画像）",
      "02-explain.png … 今日のこころ予報の見方（キャラ別・完成画像）",
      "03〜08 … 個別ページ（page_01〜06）",
      "09-closing-*.png … ラストページ（4種からランダム）",
      `${DAILY_NUMBER_INSTAGRAM_CAPTION_FILENAME} … Instagramキャプション（コピー用）`,
      "",
      "【Instagram 投稿の手順】",
      "1. カルーセルは 01 から順に投稿してください",
      "2. キャプションは instagram-caption.txt を開き、全文をコピーして貼り付け",
      "   （iPhone: ファイルアプリ → ZIPを解凍 → キャプションファイルを長押しで全選択 → コピー）",
      "3. 予約投稿は Instagram アプリから行えます",
    ].join("\n"),
  );

  entries[DAILY_NUMBER_INSTAGRAM_CAPTION_FILENAME] = new TextEncoder().encode(
    buildInstagramCaption(payload),
  );

  const buffer = Buffer.from(zipSync(entries, { level: 0 }));
  return { buffer, basename: dailyNumberZipBasename(payload), slides };
}
