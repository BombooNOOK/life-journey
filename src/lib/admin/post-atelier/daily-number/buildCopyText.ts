import type { DailyNumberGeneratedPayload, DailyNumberMessage } from "./types";
import { buildBlockCaptionText } from "./messageTextSplit";
import {
  CAPTION_ABOUT_KOKORO_YOHO,
  CAPTION_APP_INVITE,
  CAPTION_DIARY_INVITE,
  CAPTION_HASHTAGS,
  CAPTION_HOW_TO_READ,
  CAPTION_INTRO_CLOSING,
  CAPTION_TITLE_LINES,
} from "./instagramCaptionCopy";

function formatCanvaBlockCopy(block: DailyNumberMessage, label: string): string {
  const caption = buildBlockCaptionText(block, block.todayNumber);
  const lines = [
    `【${label}】`,
    block.displayName,
    block.subtitle,
    caption.fullBody,
    "おすすめのすごしかた：",
    `・${block.actions[0]}`,
    `・${block.actions[1]}`,
  ];
  return lines.join("\n");
}

function formatInstagramBlockSection(block: DailyNumberMessage): string {
  const caption = buildBlockCaptionText(block, block.todayNumber);
  return [
    `【すうじ${caption.number}のあなたへ】`,
    caption.fullBody,
    "",
    "おすすめのすごしかた",
    `・${block.actions[0]}`,
    `・${block.actions[1]}`,
  ].join("\n");
}

function buildCaptionIntro(payload: DailyNumberGeneratedPayload): string {
  const moodLines = [payload.cover.title.trim(), payload.cover.summaryMessage.trim()].filter(Boolean);
  return [...moodLines, "", CAPTION_INTRO_CLOSING].join("\n");
}

export function buildCanvaCopyText(payload: DailyNumberGeneratedPayload): string {
  const parts: string[] = [
    "【表紙】",
    `今日のすうじ：${payload.todayNumber}`,
    payload.cover.title,
    payload.cover.summaryMessage,
    `おまもりカラー：${payload.cover.colorName}`,
    "",
  ];

  for (const page of payload.pages) {
    page.blocks.forEach((block, blockIndex) => {
      const label =
        page.blocks.length === 2
          ? `すうじ${block.lifePathNumber}（ページ${page.pageIndex + 1}-${blockIndex + 1}）`
          : `すうじ${block.lifePathNumber}`;
      parts.push(formatCanvaBlockCopy(block, label));
      parts.push("");
    });
  }

  return parts.join("\n").trim();
}

export function buildInstagramCaption(payload: DailyNumberGeneratedPayload): string {
  const blockSections = payload.pages.flatMap((page) =>
    page.blocks.map((block) => formatInstagramBlockSection(block)),
  );

  return [
    ...CAPTION_TITLE_LINES,
    "",
    buildCaptionIntro(payload),
    "",
    CAPTION_ABOUT_KOKORO_YOHO,
    "",
    CAPTION_HOW_TO_READ,
    "",
    ...blockSections.flatMap((section, index) =>
      index < blockSections.length - 1 ? [section, ""] : [section],
    ),
    "",
    CAPTION_DIARY_INVITE,
    "",
    CAPTION_APP_INVITE,
    "",
    CAPTION_HASHTAGS.join(" "),
  ].join("\n");
}
