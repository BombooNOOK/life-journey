"use client";

import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import {
  isJournalContentOverSoftLimit,
  isJournalContentStrongLong,
  JOURNAL_LONG_CONTENT_WARN_MESSAGE,
  JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE,
  normalizeContentFontMode,
} from "@/lib/journal/contentFontMode";
import { DIARY_BINDING_BODY_OVERFLOW_MESSAGE_BY_MODE } from "@/lib/journal/diaryPreviewBodyLineLimits";
import { JOURNAL_BINDING_OVERFLOW_HELP } from "@/lib/journal/journalInputHelpCopy";

type Props = {
  contentFontMode: string | null | undefined;
  /** trim 済みの単純文字数 */
  contentLength: number;
  /** 製本固定レイアウトの本文枠 overflow */
  bodyOverflows?: boolean;
  /** フクロウ先生欄 overflow */
  commentOverflows?: boolean;
};

const COMMENT_FRAME_OVERFLOW_MESSAGE =
  "フクロウ先生の読み解きが枠からはみ出しています。プレビューで全文を確認し、必要なら記録内容を見直してください。";

export function JournalContentLengthAlerts({
  contentFontMode,
  contentLength,
  bodyOverflows = false,
  commentOverflows = false,
}: Props) {
  if (contentLength <= 0 && !bodyOverflows && !commentOverflows) return null;
  const mode = normalizeContentFontMode(contentFontMode);
  const strong = isJournalContentStrongLong(mode, contentLength);
  const soft = isJournalContentOverSoftLimit(mode, contentLength);
  const frameIssue = bodyOverflows || commentOverflows;

  if (!frameIssue && !soft && !strong) return null;

  return (
    <div className="mt-2 space-y-2">
      {bodyOverflows ? (
        <p className="rounded-md border border-orange-400 bg-orange-50 px-3 py-2 lj-read-caption font-medium text-orange-950">
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {DIARY_BINDING_BODY_OVERFLOW_MESSAGE_BY_MODE[mode]}
            <InlineHelpButton ariaLabel="製本の目安について" panelZIndexClass="z-30">
              {JOURNAL_BINDING_OVERFLOW_HELP}
            </InlineHelpButton>
          </span>
        </p>
      ) : null}
      {commentOverflows ? (
        <p className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 lj-read-caption text-orange-950">
          {COMMENT_FRAME_OVERFLOW_MESSAGE}
        </p>
      ) : null}
      {strong ? (
        <p className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 lj-read-caption text-orange-950">
          {JOURNAL_VERY_LONG_CONTENT_WARN_MESSAGE}
        </p>
      ) : null}
      {soft && !strong && !frameIssue ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 lj-read-caption text-amber-950">
          {JOURNAL_LONG_CONTENT_WARN_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
