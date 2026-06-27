import fs from "node:fs";

import sharp from "sharp";

import { buildSvgTextOverlay } from "@/lib/admin/post-atelier/daily-number/svgText";
import { prepareCompositeOverlay } from "@/lib/admin/post-atelier/daily-number/renderSvgOverlay";

import {
  journalSocialPostBackgroundExists,
  journalSocialPostBackgroundPath,
  JOURNAL_SOCIAL_POST_IMAGE_SIZE,
} from "./assetPaths";
import { JOURNAL_SOCIAL_POST_COLORS, JOURNAL_SOCIAL_POST_LAYOUT } from "./layout";
import type { JournalSocialPostImageInput, JournalSocialPostImageResult } from "./types";

async function loadBackgroundBuffer(): Promise<Buffer> {
  if (journalSocialPostBackgroundExists()) {
    return fs.readFileSync(journalSocialPostBackgroundPath());
  }

  const { widthPx, heightPx } = JOURNAL_SOCIAL_POST_IMAGE_SIZE;
  return sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 3,
      background: { r: 250, g: 248, b: 245 },
    },
  })
    .png()
    .toBuffer();
}

async function buildPhotoLayer(photoBuffer: Buffer | null): Promise<Buffer | null> {
  const { photo } = JOURNAL_SOCIAL_POST_LAYOUT;
  if (!photoBuffer) return null;

  return sharp(photoBuffer)
    .rotate()
    .resize(photo.width, photo.height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

function buildTextOverlay(input: JournalSocialPostImageInput): Buffer {
  const layout = JOURNAL_SOCIAL_POST_LAYOUT;
  const titleText = input.title.trim() || "（タイトル未入力）";
  const bodyText = input.bodyExcerpt.trim();
  const todayLabel =
    input.todayNumber != null ? String(input.todayNumber) : "—";
  const moodText = input.moodLabel.trim() || "—";
  const commentLabel = `${input.companionLabel}より`;
  const commentText = input.commentExcerpt.trim();

  const items: Parameters<typeof buildSvgTextOverlay>[0]["items"] = [
    {
      text: input.dateLabel,
      style: {
        x: layout.date.x,
        y: layout.date.y,
        fontSize: layout.date.fontSize,
        lineHeight: layout.date.lineHeight,
        fill: JOURNAL_SOCIAL_POST_COLORS.secondary,
      },
    },
    {
      text: titleText,
      style: {
        x: layout.title.x,
        y: layout.title.y,
        fontSize: layout.title.fontSize,
        lineHeight: layout.title.lineHeight,
        fontWeight: 600,
        fill: JOURNAL_SOCIAL_POST_COLORS.primary,
        maxCharsPerLine: layout.title.maxCharsPerLine,
        maxLines: layout.title.maxLines,
      },
      multiline: true,
    },
  ];

  if (bodyText) {
    items.push({
      text: bodyText,
      style: {
        x: layout.body.x,
        y: layout.body.y,
        fontSize: layout.body.fontSize,
        lineHeight: layout.body.lineHeight,
        fill: JOURNAL_SOCIAL_POST_COLORS.primary,
        maxCharsPerLine: layout.body.maxCharsPerLine,
        maxLines: layout.body.maxLines,
      },
      multiline: true,
    });
  }

  items.push(
    {
      text: "今日のすうじ",
      style: {
        x: layout.todayNumberLabel.x,
        y: layout.todayNumberLabel.y,
        fontSize: layout.todayNumberLabel.fontSize,
        lineHeight: layout.todayNumberLabel.lineHeight,
        fill: JOURNAL_SOCIAL_POST_COLORS.muted,
      },
    },
    {
      text: todayLabel,
      style: {
        x: layout.todayNumberValue.x,
        y: layout.todayNumberValue.y,
        fontSize: layout.todayNumberValue.fontSize,
        lineHeight: layout.todayNumberValue.lineHeight,
        fontWeight: 600,
        fill: JOURNAL_SOCIAL_POST_COLORS.accent,
      },
    },
    {
      text: "きもちの記録",
      style: {
        x: layout.moodLabel.x,
        y: layout.moodLabel.y,
        fontSize: layout.moodLabel.fontSize,
        lineHeight: layout.moodLabel.lineHeight,
        fill: JOURNAL_SOCIAL_POST_COLORS.muted,
      },
    },
    {
      text: moodText,
      style: {
        x: layout.moodValue.x,
        y: layout.moodValue.y,
        fontSize: layout.moodValue.fontSize,
        lineHeight: layout.moodValue.lineHeight,
        fontWeight: 600,
        fill: JOURNAL_SOCIAL_POST_COLORS.primary,
        maxCharsPerLine: 10,
        maxLines: 1,
      },
      multiline: true,
    },
  );

  if (commentText) {
    items.push(
      {
        text: commentLabel,
        style: {
          x: layout.commentLabel.x,
          y: layout.commentLabel.y,
          fontSize: layout.commentLabel.fontSize,
          lineHeight: layout.commentLabel.lineHeight,
          fill: JOURNAL_SOCIAL_POST_COLORS.muted,
        },
      },
      {
        text: commentText,
        style: {
          x: layout.commentBody.x,
          y: layout.commentBody.y,
          fontSize: layout.commentBody.fontSize,
          lineHeight: layout.commentBody.lineHeight,
          fill: JOURNAL_SOCIAL_POST_COLORS.primary,
          maxCharsPerLine: layout.commentBody.maxCharsPerLine,
          maxLines: layout.commentBody.maxLines,
        },
        multiline: true,
      },
    );
  }

  return buildSvgTextOverlay({
    width: JOURNAL_SOCIAL_POST_IMAGE_SIZE.widthPx,
    height: JOURNAL_SOCIAL_POST_IMAGE_SIZE.heightPx,
    items,
  });
}

export function journalSocialPostImageBasename(date: Date): string {
  const parts = date.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const compact = parts.replace(/\D/g, "");
  return `${compact}_diary-sns`;
}

export async function compositeJournalSocialPostImage(
  input: JournalSocialPostImageInput,
  options?: { createdAt?: Date },
): Promise<JournalSocialPostImageResult> {
  const background = await loadBackgroundBuffer();
  const photoLayer = await buildPhotoLayer(input.photoBuffer);
  const textSvg = buildTextOverlay(input);
  const textPng = await prepareCompositeOverlay(textSvg);

  const composites: sharp.OverlayOptions[] = [];
  if (photoLayer) {
    composites.push({
      input: photoLayer,
      top: JOURNAL_SOCIAL_POST_LAYOUT.photo.y,
      left: JOURNAL_SOCIAL_POST_LAYOUT.photo.x,
    });
  }
  composites.push({ input: textPng, top: 0, left: 0 });

  const buffer = await sharp(background).composite(composites).png().toBuffer();
  const basename = journalSocialPostImageBasename(options?.createdAt ?? new Date());

  return { buffer, basename };
}
