"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DiaryBookEntryV2PreviewPage } from "@/components/journal/DiaryBookEntryV2PreviewPage";
import { DiaryPreviewBindingAlerts } from "@/components/journal/DiaryPreviewBindingAlerts";
import { DiaryPreviewBodyLinesDebugPanel } from "@/components/journal/DiaryPreviewBodyLinesDebugPanel";
import type { DiaryBookEntryV2PreviewPageProps } from "@/components/journal/DiaryBookEntryV2PreviewPage";
import { getBodyLayoutLines } from "@/lib/journal/diaryPreviewBodyLineLimits";
import {
  DiaryPreviewScaledViewport,
  type DiaryPreviewScaleFitMode,
} from "@/components/journal/DiaryPreviewScaledViewport";
import type { DiaryDesignId } from "@/lib/journal/meta";
import {
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
  PREVIEW_OVERFLOW_HINT_MESSAGE,
} from "@/lib/journal/contentFontMode";

const EMPTY_BODY_PLACEHOLDER = "ここに本文が入ります。";

type Props = DiaryBookEntryV2PreviewPageProps & {
  /** @deprecated v2 本文では未使用。呼び出し互換のため残す */
  designTheme?: DiaryDesignId;
  /** page = 日記ページのみ（全画面プレビュー用）。省略時はカード付き */
  variant?: "card" | "page";
  /** DiaryPreviewScaledViewport に渡す className */
  scaledClassName?: string;
  /** variant=page のときのフィット（全画面は fullscreen） */
  pageFitMode?: DiaryPreviewScaleFitMode;
  /** 親の背景タップで閉じるとき、ページ上のクリックを伝播させない */
  isolatePointerEvents?: boolean;
  /** false のとき警告は描画しない（親がページ外に配置する） */
  showBindingAlerts?: boolean;
};

function DiaryDesignPreviewInner({
  variant = "card",
  scaledClassName = "",
  pageFitMode = "contain",
  isolatePointerEvents = false,
  showBindingAlerts = true,
  designTheme: _designTheme,
  content,
  comment,
  contentFontMode: contentFontModeProp,
  kanteiOrderExists,
  layoutRulerTarget,
  ...pageProps
}: Props) {
  const searchParams = useSearchParams();
  const bodyLinesDebug = searchParams.get("bodyLinesDebug") === "1";

  const trimmedBody = content.trim();
  const bodyEmpty = !trimmedBody;
  const contentFontMode = normalizeContentFontMode(contentFontModeProp ?? DEFAULT_CONTENT_FONT_MODE);
  const bodyLayoutLines = useMemo(
    () => (trimmedBody ? getBodyLayoutLines(trimmedBody, contentFontMode) : []),
    [trimmedBody, contentFontMode],
  );
  const displayContent = trimmedBody || EMPTY_BODY_PLACEHOLDER;

  const page = (
    <DiaryBookEntryV2PreviewPage
      content={displayContent}
      comment={comment}
      contentFontMode={contentFontModeProp}
      kanteiOrderExists={kanteiOrderExists}
      layoutRulerTarget={layoutRulerTarget}
      bodyLinesDebug={bodyLinesDebug}
      {...pageProps}
    />
  );

  const bodyLinesDebugPanel =
    bodyLinesDebug && trimmedBody ? (
      <DiaryPreviewBodyLinesDebugPanel
        content={content}
        contentFontMode={contentFontModeProp}
        layoutLines={bodyLayoutLines}
      />
    ) : null;

  const previewAlerts = showBindingAlerts ? (
    <DiaryPreviewBindingAlerts
      content={content}
      comment={comment}
      contentFontMode={contentFontModeProp}
    />
  ) : null;

  const pageAlertsBelow =
    pageFitMode === "fullscreen" ? "mt-2 shrink-0 px-3" : "mt-2 shrink-0 px-1";

  if (variant === "page") {
    return (
      <div className="lj-reading-exempt size-full min-h-0">
        <DiaryPreviewScaledViewport
          fitMode={pageFitMode}
          isolatePointerEvents={isolatePointerEvents}
          className={`min-h-0 ${pageFitMode === "fullscreen" ? "w-full" : "size-full"} ${scaledClassName}`.trim()}
        >
          {page}
        </DiaryPreviewScaledViewport>
        {previewAlerts ? <div className={pageAlertsBelow}>{previewAlerts}</div> : null}
        {bodyLinesDebugPanel}
      </div>
    );
  }

  return (
    <section className="lj-reading-exempt rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <h3 className="text-sm font-semibold text-stone-800">製本イメージ（日記ブック本文）</h3>
      <p className="mt-1 text-xs text-stone-500">
        入力内容を日記ブック本文ページに流し込んだ表示です（724×1024 固定・端末は拡大縮小のみ）。
      </p>
      <DiaryPreviewScaledViewport fitMode="width" className="mx-auto mt-3 max-w-[720px]">
        {page}
      </DiaryPreviewScaledViewport>
      {bodyLinesDebugPanel}
      {previewAlerts}
      {!bodyEmpty ? (
        <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-stone-500">
          {PREVIEW_OVERFLOW_HINT_MESSAGE}
        </p>
      ) : null}
    </section>
  );
}

export function DiaryDesignPreview(props: Props) {
  return (
    <Suspense fallback={null}>
      <DiaryDesignPreviewInner {...props} />
    </Suspense>
  );
}
