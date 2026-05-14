"use client";

import {
  isJournalContentOverSoftLimit,
  isJournalContentStrongLong,
  JOURNAL_LONG_CONTENT_WARN_MESSAGE,
  JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";

type Props = {
  contentFontMode: string | null | undefined;
  /** trim 済みの本文長 */
  contentLength: number;
};

export function JournalContentLengthAlerts({ contentFontMode, contentLength }: Props) {
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
    </div>
  );
}
