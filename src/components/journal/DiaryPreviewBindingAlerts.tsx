"use client";

import { useEffect, useMemo, useState } from "react";

import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import { isDiaryBodyOverLineLimit } from "@/lib/journal/diaryPreviewBodyLineLimits";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { measureDiaryPageTextOverflows } from "@/lib/journal/diaryPreviewMeasure";

type Props = {
  content: string;
  comment?: string | null;
  contentFontMode?: string | null;
  className?: string;
};

/** 製本プレビュー下のオレンジ警告（ページ外。本文ページ本体には重ねない） */
export function DiaryPreviewBindingAlerts({
  content,
  comment,
  contentFontMode: contentFontModeProp,
  className = "",
}: Props) {
  const trimmedBody = content.trim();
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
  const charCount = trimmedBody.length;

  const bindingBodyOverflow = useMemo(
    () => (trimmedBody ? isDiaryBodyOverLineLimit(trimmedBody, contentFontMode) : false),
    [trimmedBody, contentFontMode],
  );

  const [commentOverflows, setCommentOverflows] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const measured = measureDiaryPageTextOverflows(trimmedBody, comment, contentFontMode);
      setCommentOverflows(measured.comment);
    }, 120);
    return () => window.clearTimeout(id);
  }, [trimmedBody, comment, contentFontMode]);

  if (!trimmedBody && !commentOverflows && !bindingBodyOverflow) return null;

  return (
    <div className={className}>
      <JournalContentLengthAlerts
        contentFontMode={contentFontMode}
        contentLength={charCount}
        bodyOverflows={bindingBodyOverflow}
        commentOverflows={commentOverflows}
      />
    </div>
  );
}
