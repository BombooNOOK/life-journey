import sharp from "sharp";

import { buildSvgTextOverlay } from "@/lib/admin/post-atelier/daily-number/svgText";
import { prepareCompositeOverlay } from "@/lib/admin/post-atelier/daily-number/renderSvgOverlay";

import {
  buildCompanionFaceLayer,
  companionFaceCompositePosition,
} from "./companionFaceLayer";
import {
  formatSocialPostDateRibbonParts,
  formatSocialPostDateScrapbook,
} from "./dateFormat";
import { loadJournalSocialPostTemplateBackground, loadJournalSocialPostTemplatePhotoOverlay } from "./templatePaths";
import {
  JOURNAL_SOCIAL_POST_TEMPLATE_SIZE,
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
  type JournalSocialPostTextStyle,
} from "./templates";
import {
  computeSquarePhotoCropRect,
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  type JournalSocialPostPhotoAdjust,
} from "./photoAdjust";
import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./types";
import type { JournalSocialPostImageInput, JournalSocialPostImageResult } from "./types";

async function buildPhotoLayer(
  photoBuffer: Buffer | null,
  photo: {
    width: number;
    height: number;
    fit: "cover" | "contain";
    borderRadiusPx?: number;
  },
  photoAdjust: JournalSocialPostPhotoAdjust = DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
): Promise<Buffer | null> {
  if (!photoBuffer) return null;

  const rotated = sharp(photoBuffer).rotate();
  const meta = await rotated.metadata();
  const sourceWidth = meta.width ?? 720;
  const sourceHeight = meta.height ?? 720;

  const crop = computeSquarePhotoCropRect({
    sourceWidth,
    sourceHeight,
    targetWidth: photo.width,
    targetHeight: photo.height,
    adjust: photoAdjust,
  });

  let pipeline = sharp(photoBuffer).rotate().extract(crop);
  if (photo.fit === "contain") {
    pipeline = pipeline.resize(photo.width, photo.height, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    });
  } else {
    pipeline = pipeline.resize(photo.width, photo.height);
  }

  let layer = await pipeline.ensureAlpha().png().toBuffer();

  const radius = photo.borderRadiusPx;
  if (radius && radius > 0) {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${photo.width}" height="${photo.height}">
        <rect x="0" y="0" width="${photo.width}" height="${photo.height}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>`,
    );
    layer = await sharp(layer)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  }

  return layer;
}

function textItem(
  text: string,
  style: JournalSocialPostTextStyle,
  multiline = false,
): Parameters<typeof buildSvgTextOverlay>[0]["items"][number] {
  return {
    text,
    multiline,
    style: {
      x: style.x,
      y: style.y,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight ?? Math.round(style.fontSize * 1.4),
      fontWeight: style.fontWeight ?? 400,
      fill: style.fill ?? "#4a3728",
      textAnchor: style.textAnchor ?? "start",
      maxCharsPerLine: style.maxCharsPerLine,
      maxLines: style.maxLines,
    },
  };
}

function buildTextOverlay(
  input: JournalSocialPostImageInput,
  templateId: JournalSocialPostTemplateId,
): Buffer {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const titleText = input.title.trim() || "（タイトル未入力）";
  const bodyText = input.bodyExcerpt.trim();
  const moodText = input.moodLabel.trim() || "—";
  const commentText = input.commentExcerpt.trim();

  const numbers = [
    input.todayNumber != null ? String(input.todayNumber) : "—",
    input.monthNumber != null ? String(input.monthNumber) : "—",
    input.yearNumber != null ? String(input.yearNumber) : "—",
  ] as const;

  const items: Parameters<typeof buildSvgTextOverlay>[0]["items"] = [];

  if (templateId === "sns02") {
    if (layout.dateRibbonYear) {
      items.push(textItem(input.dateRibbonYear, layout.dateRibbonYear));
    }
    if (layout.dateRibbonMonthDay) {
      items.push(textItem(input.dateRibbonMonthDay, layout.dateRibbonMonthDay));
    }
  } else if (layout.dateScrapbook) {
    items.push(textItem(input.dateScrapbook, layout.dateScrapbook));
  }

  items.push(textItem(titleText, layout.title, true));

  if (bodyText) {
    items.push(textItem(bodyText, layout.body, true));
  }

  for (let i = 0; i < 3; i += 1) {
    items.push(textItem(numbers[i]!, layout.numberSlots[i]!));
  }

  items.push(textItem(moodText, layout.mood, true));

  if (commentText) {
    items.push(textItem(commentText, layout.comment, true));
  }

  return buildSvgTextOverlay({
    width: JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.widthPx,
    height: JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.heightPx,
    items,
  });
}

export function buildJournalSocialPostImageInput(params: {
  templateId: JournalSocialPostTemplateId;
  title: string;
  bodyExcerpt: string;
  todayNumber: number | null;
  monthNumber: number | null;
  yearNumber: number | null;
  moodLabel: string;
  commentExcerpt: string;
  photoBuffer: Buffer | null;
  photoAdjust?: JournalSocialPostPhotoAdjust;
  companionType: string;
  createdAt: Date;
}): JournalSocialPostImageInput {
  const ribbon = formatSocialPostDateRibbonParts(params.createdAt);
  return {
    templateId: params.templateId,
    title: params.title,
    bodyExcerpt: params.bodyExcerpt,
    todayNumber: params.todayNumber,
    monthNumber: params.monthNumber,
    yearNumber: params.yearNumber,
    moodLabel: params.moodLabel,
    commentExcerpt: params.commentExcerpt,
    photoBuffer: params.photoBuffer,
    photoAdjust: params.photoAdjust,
    companionType: params.companionType,
    dateRibbonYear: ribbon.year,
    dateRibbonMonthDay: ribbon.monthDay,
    dateScrapbook: formatSocialPostDateScrapbook(params.createdAt),
  };
}

export function journalSocialPostImageBasename(date: Date, templateId: JournalSocialPostTemplateId): string {
  const parts = date.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const compact = parts.replace(/\D/g, "");
  return `${compact}_diary-sns_${templateId}`;
}

export async function compositeJournalSocialPostImage(
  input: JournalSocialPostImageInput,
  options?: { createdAt?: Date },
): Promise<JournalSocialPostImageResult> {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[input.templateId];
  const background = loadJournalSocialPostTemplateBackground(input.templateId, input.companionType);
  const photoOverlay = await loadJournalSocialPostTemplatePhotoOverlay(input.templateId);
  const photoLayer = await buildPhotoLayer(
    input.photoBuffer,
    layout.photo,
    input.photoAdjust ?? DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const faceLayer = layout.companionFace
    ? await buildCompanionFaceLayer(input.companionType, layout.companionFace)
    : null;
  const textSvg = buildTextOverlay(input, input.templateId);
  const textPng = await prepareCompositeOverlay(textSvg);

  const composites: sharp.OverlayOptions[] = [];
  if (photoLayer) {
    composites.push({
      input: photoLayer,
      top: layout.photo.y,
      left: layout.photo.x,
    });
  }
  if (photoOverlay) {
    composites.push({ input: photoOverlay, top: 0, left: 0 });
  }
  if (faceLayer && layout.companionFace) {
    const facePos = companionFaceCompositePosition(layout.companionFace);
    composites.push({
      input: faceLayer,
      top: facePos.top,
      left: facePos.left,
    });
  }
  composites.push({ input: textPng, top: 0, left: 0 });

  const composed = await sharp(background).composite(composites).png().toBuffer();

  const buffer = await sharp(composed)
    .resize(JOURNAL_SOCIAL_POST_IMAGE_SIZE.widthPx, JOURNAL_SOCIAL_POST_IMAGE_SIZE.heightPx)
    .png()
    .toBuffer();

  const createdAt = options?.createdAt ?? new Date();
  const basename = journalSocialPostImageBasename(createdAt, input.templateId);

  return { buffer, basename };
}
