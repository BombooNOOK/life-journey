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
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostDesignSize,
  resolveJournalSocialPostOutputSize,
  resolveJournalSocialPostPhotoRenderSize,
  resolveJournalSocialPostTextMode,
  type JournalSocialPostPhotoStyle,
  type JournalSocialPostTemplateId,
  type JournalSocialPostTextStyle,
} from "./templates";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  computeSquarePhotoCropRect,
  type JournalSocialPostPhotoAdjust,
} from "./photoAdjust";
import { rotatePhotoLayerAroundTopLeft, journalSocialPostPhotoCompositePosition } from "./photoRotate";
import { DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE } from "./textExtract";
import type { JournalSocialPostImageInput, JournalSocialPostImageResult } from "./types";

async function buildPhotoLayer(
  photoBuffer: Buffer | null,
  photo: {
    width: number;
    height: number;
    fit: "cover" | "contain";
    borderRadiusPx?: number;
    rotateDeg?: number;
    displayScale?: number;
  },
  photoAdjust: JournalSocialPostPhotoAdjust = DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
): Promise<Buffer | null> {
  if (!photoBuffer) return null;

  const renderSize = resolveJournalSocialPostPhotoRenderSize(photo);

  const rotated = sharp(photoBuffer).rotate();
  const meta = await rotated.metadata();
  const sourceWidth = meta.width ?? 720;
  const sourceHeight = meta.height ?? 720;

  const crop = computeSquarePhotoCropRect({
    sourceWidth,
    sourceHeight,
    targetWidth: renderSize.width,
    targetHeight: renderSize.height,
    adjust: photoAdjust,
  });

  let pipeline = sharp(photoBuffer).rotate().extract(crop);
  if (photo.fit === "contain") {
    pipeline = pipeline.resize(renderSize.width, renderSize.height, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    });
  } else {
    pipeline = pipeline.resize(renderSize.width, renderSize.height);
  }

  let layer = await pipeline.ensureAlpha().png().toBuffer();

  const radius = photo.borderRadiusPx;
  if (radius && radius > 0) {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${renderSize.width}" height="${renderSize.height}">
        <rect x="0" y="0" width="${renderSize.width}" height="${renderSize.height}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>`,
    );
    layer = await sharp(layer)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  }

  const rotateDeg = photo.rotateDeg ?? 0;
  if (rotateDeg !== 0) {
    layer = await rotatePhotoLayerAroundTopLeft(
      layer,
      renderSize.width,
      renderSize.height,
      rotateDeg,
    );
  }

  return layer;
}

function textItem(
  text: string,
  style: JournalSocialPostTextStyle,
  multiline = false,
  /** 位置合わせ定規（CSS top）と同じく、y を文字枠の上端として扱う */
  yIsTop = false,
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
      rotateDeg: style.rotateDeg,
      maxCharsPerLine: style.maxCharsPerLine,
      maxLines: style.maxLines,
      ...(yIsTop ? { yOrigin: "top" as const } : {}),
    },
  };
}

function buildTextOverlay(
  input: JournalSocialPostImageInput,
  templateId: JournalSocialPostTemplateId,
): Buffer {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const design = resolveJournalSocialPostDesignSize(layout);
  const textMode = resolveJournalSocialPostTextMode(layout);
  const moodText = input.moodLabel.trim() || "—";
  const commentText = input.commentExcerpt.trim();

  const numbers = [
    input.todayNumber != null ? String(input.todayNumber) : "—",
    input.monthNumber != null ? String(input.monthNumber) : "—",
    input.yearNumber != null ? String(input.yearNumber) : "—",
  ] as const;

  const items: Parameters<typeof buildSvgTextOverlay>[0]["items"] = [];
  /** あしあとカードはレイアウト定規の CSS top 基準に合わせる */
  const ashiatoYIsTop = textMode === "ashiato_lines";
  const pushIfVisible = (
    text: string,
    style: JournalSocialPostTextStyle | undefined,
    multiline = false,
  ) => {
    if (!style || style.fontSize <= 1) return;
    if (!text) return;
    items.push(textItem(text, style, multiline, ashiatoYIsTop));
  };

  if (textMode === "sns02") {
    if (layout.dateRibbonYear) {
      items.push(textItem(input.dateRibbonYear, layout.dateRibbonYear));
    }
    if (layout.dateRibbonMonthDay) {
      items.push(textItem(input.dateRibbonMonthDay, layout.dateRibbonMonthDay));
    }
    const titleText = input.title.trim() || "（タイトル未入力）";
    items.push(textItem(titleText, layout.title, true));
    const bodyText = input.bodyExcerpt.trim();
    if (bodyText) {
      items.push(textItem(bodyText, layout.body, true));
    }
  } else if (textMode === "ashiato_lines") {
    pushIfVisible(input.dateScrapbook, layout.dateScrapbook);
    pushIfVisible(input.title.trim(), layout.title, true);
    pushIfVisible(input.bodyExcerpt.trim(), layout.body, true);
    pushIfVisible((input.promptLabel ?? "").trim(), layout.promptLabel);
    pushIfVisible(commentText, layout.comment, true);
    pushIfVisible((input.summary ?? "").trim(), layout.summary, true);
  } else {
    if (layout.dateScrapbook) {
      items.push(textItem(input.dateScrapbook, layout.dateScrapbook));
    }
    const titleText = input.title.trim();
    if (titleText) {
      items.push(textItem(titleText, layout.title, true));
    }
    if (layout.subtitle) {
      const subtitleText = input.subtitle.trim() || DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE;
      items.push(textItem(subtitleText, layout.subtitle, true));
    }
    const bodyText = input.bodyExcerpt.trim();
    if (bodyText) {
      items.push(textItem(bodyText, layout.body, true));
    }
  }

  if (layout.numberSlots) {
    for (let i = 0; i < 3; i += 1) {
      items.push(textItem(numbers[i]!, layout.numberSlots[i]!));
    }
  }

  if (layout.mood && textMode !== "ashiato_lines") {
    items.push(textItem(moodText, layout.mood, true));
  }

  if (commentText && textMode !== "ashiato_lines") {
    items.push(textItem(commentText, layout.comment, true));
  }

  return buildSvgTextOverlay({
    width: design.widthPx,
    height: design.heightPx,
    items,
  });
}

export function buildJournalSocialPostImageInput(params: {
  templateId: JournalSocialPostTemplateId;
  title: string;
  bodyExcerpt: string;
  subtitle: string;
  todayNumber: number | null;
  monthNumber: number | null;
  yearNumber: number | null;
  moodLabel: string;
  commentExcerpt: string;
  promptLabel?: string;
  summary?: string;
  photoBuffer: Buffer | null;
  extraPhotoBuffers?: [Buffer | null, Buffer | null];
  panelPhotoSources?: JournalSocialPostImageInput["panelPhotoSources"];
  photoAdjust?: JournalSocialPostPhotoAdjust;
  companionType: string;
  createdAt: Date;
}): JournalSocialPostImageInput {
  const ribbon = formatSocialPostDateRibbonParts(params.createdAt);
  return {
    templateId: params.templateId,
    title: params.title,
    bodyExcerpt: params.bodyExcerpt,
    subtitle: params.subtitle,
    todayNumber: params.todayNumber,
    monthNumber: params.monthNumber,
    yearNumber: params.yearNumber,
    moodLabel: params.moodLabel,
    commentExcerpt: params.commentExcerpt,
    promptLabel: params.promptLabel?.trim() || undefined,
    summary: params.summary?.trim() || undefined,
    photoBuffer: params.photoBuffer,
    extraPhotoBuffers: params.extraPhotoBuffers,
    panelPhotoSources: params.panelPhotoSources,
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
  options?: { createdAt?: Date; photoRotateDeg?: number },
): Promise<JournalSocialPostImageResult> {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[input.templateId];
  const outputSize = resolveJournalSocialPostOutputSize(layout);
  const photoSlots: JournalSocialPostPhotoStyle[] = [
    layout.photo,
    ...(layout.extraPhotos ?? []),
  ];
  const background = loadJournalSocialPostTemplateBackground(input.templateId, input.companionType);
  const photoOverlay = await loadJournalSocialPostTemplatePhotoOverlay(input.templateId);
  const faceLayer = layout.companionFace
    ? await buildCompanionFaceLayer(input.companionType, layout.companionFace)
    : null;
  const textSvg = buildTextOverlay(input, input.templateId);
  const textPng = await prepareCompositeOverlay(textSvg);

  const composites: sharp.OverlayOptions[] = [];
  for (let slotIndex = 0; slotIndex < photoSlots.length; slotIndex += 1) {
    const slot = photoSlots[slotIndex]!;
    const photoStyle = {
      ...slot,
      rotateDeg: options?.photoRotateDeg ?? slot.rotateDeg ?? 0,
    };
    const sourceId = input.panelPhotoSources?.[slotIndex] ?? "main";
    const slotBuffer =
      sourceId === "extra0"
        ? (input.extraPhotoBuffers?.[0] ?? null)
        : sourceId === "extra1"
          ? (input.extraPhotoBuffers?.[1] ?? null)
          : input.photoBuffer;
    const slotAdjust =
      sourceId === "main"
        ? (input.photoAdjust ?? DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST)
        : DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST;
    const photoLayer = await buildPhotoLayer(slotBuffer, photoStyle, slotAdjust);
    if (!photoLayer) continue;
    const rotateDeg = photoStyle.rotateDeg ?? 0;
    const renderSize = resolveJournalSocialPostPhotoRenderSize(photoStyle);
    const pos = journalSocialPostPhotoCompositePosition(
      { ...slot, width: renderSize.width, height: renderSize.height },
      rotateDeg,
    );
    composites.push({
      input: photoLayer,
      top: pos.top,
      left: pos.left,
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
    .resize(outputSize.widthPx, outputSize.heightPx)
    .png()
    .toBuffer();

  const createdAt = options?.createdAt ?? new Date();
  const basename = journalSocialPostImageBasename(createdAt, input.templateId);

  return { buffer, basename };
}
