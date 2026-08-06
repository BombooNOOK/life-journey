import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import { stripTagsFromContent } from "@/lib/journal/diaryTags";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

function normalizeJournalContentNewlines(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** 本文スロット高さに収まる最大行数（モード別） */
export function getDiaryBookEntryV2BodyMaxLines(
  contentFontMode?: string | null,
): number {
  return getDiaryBookEntryV2BodyFontLayout(contentFontMode).maxLines;
}

/**
 * あしあとブック本文 v2 の行配列（折り返し込み・行数上限なし）。
 * 製本オーバー判定用。
 */
export function getDiaryBookEntryV2BodyLayoutLinesAll(
  content: string,
  contentFontMode?: string | null,
): string[] {
  const normalized = normalizeJournalContentNewlines(stripTagsFromContent(content));
  if (!normalized.trim()) return [];

  const { maxCharsPerLine } = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const visualLines: string[] = [];

  for (const segment of normalized.split("\n")) {
    if (segment.length === 0) {
      visualLines.push("");
      continue;
    }
    visualLines.push(...splitFixedWidthJapaneseLines(segment, maxCharsPerLine));
  }

  return visualLines;
}

/**
 * あしあとブック本文 v2 の行配列（製本・プレビュー表示用）。
 * 手動改行を尊重し、各行内は字数上限＋括弧引き戻しで折り返す。
 */
export function getDiaryBookEntryV2BodyLayoutLines(
  content: string,
  contentFontMode?: string | null,
): string[] {
  return getDiaryBookEntryV2BodyLayoutLinesAll(content, contentFontMode).slice(
    0,
    getDiaryBookEntryV2BodyMaxLines(contentFontMode),
  );
}
