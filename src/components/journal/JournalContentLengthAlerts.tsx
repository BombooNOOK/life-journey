"use client";

import {
  isJournalContentOverSoftLimit,
  isJournalContentStrongLong,
  JOURNAL_LONG_CONTENT_WARN_MESSAGE,
  JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE,
  normalizeContentFontMode,
  PREVIEW_OVERFLOW_HINT_MESSAGE,
} from "@/lib/journal/contentFontMode";

type Props = {
  contentFontMode: string | null | undefined;
  /** trim 済みの本文長 */
  contentLength: number;
  /** 製本イメージ枠で末尾が隠れ得る旨（プレビュー周りのみ true 推奨） */
  showPreviewOverflowHint?: boolean;
};

export function JournalContentLengthAlerts({
  contentFontMode,
  contentLength,
  showPreviewOverflowHint = false,
}: Props) {
  if (contentLength <= 0) return null;
  const mode = normalizeContentFontMode(contentFontMode);
  const strong = isJournalContentStrongLong(mode, contentLength);
  const soft = isJournalContentOverSoftLimit(mode, contentLength);

  if (!soft && !strong) return null;

  return (
    <div className="mt-2 space-y-2">
      {strong ? (
        <p className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-xs leading-relaxed text-orange-950">
          {JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE}
        </p>
      ) : null}
      {soft && !strong ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {JOURNAL_LONG_CONTENT_WARN_MESSAGE}
        </p>
      ) : null}
      {showPreviewOverflowHint && soft ? (
        <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-600">
          {PREVIEW_OVERFLOW_HINT_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
