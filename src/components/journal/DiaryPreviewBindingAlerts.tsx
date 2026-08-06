"use client";

import { useEffect, useMemo, useState } from "react";

import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import {
  resolveV2BodyFrameSeverity,
  type BodyFrameSeverity,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import { measureDiaryPageTextOverflows } from "@/lib/journal/diaryPreviewMeasure";

type Props = {
  content: string;
  comment?: string | null;
  contentFontMode?: string | null;
  /** 入力画面と同じ段階を渡せるとき（未指定なら v2 行数で算出） */
  bodyFrameSeverity?: BodyFrameSeverity;
  className?: string;
};

/** 製本プレビュー下のオレンジ警告（ページ外。本文ページ本体には重ねない） */
export function DiaryPreviewBindingAlerts({
  content,
  comment,
  contentFontMode: contentFontModeProp,
  bodyFrameSeverity: bodyFrameSeverityProp,
  className = "",
}: Props) {
  const trimmedBody = content.trim();
  const contentFontMode = normalizeContentFontMode(contentFontModeProp);
  const charCount = trimmedBody.length;

  const bodyFrameSeverity = useMemo(
    () =>
      bodyFrameSeverityProp ??
      resolveV2BodyFrameSeverity(trimmedBody, contentFontMode),
    [bodyFrameSeverityProp, trimmedBody, contentFontMode],
  );

  const [commentOverflows, setCommentOverflows] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const measured = measureDiaryPageTextOverflows(trimmedBody, comment, contentFontMode);
      setCommentOverflows(measured.comment);
    }, 120);
    return () => window.clearTimeout(id);
  }, [trimmedBody, comment, contentFontMode]);

  if (!trimmedBody && !commentOverflows && bodyFrameSeverity === "ok") return null;

  return (
    <div className={className}>
      <JournalContentLengthAlerts
        contentFontMode={contentFontMode}
        contentLength={charCount}
        bodyFrameSeverity={bodyFrameSeverity}
        commentOverflows={commentOverflows}
      />
    </div>
  );
}
