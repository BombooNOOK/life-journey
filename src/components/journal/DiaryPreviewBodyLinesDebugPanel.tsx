"use client";

import { useEffect, useMemo } from "react";

import {
  countBodyLayoutLines,
  DIARY_BODY_CHARS_PER_LINE_BY_MODE,
  getBodyLayoutLinesForBindingPreview,
  getDiaryBodyLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import { estimateBodyLineClipsAtRightEdge } from "@/lib/journal/diaryPreviewStandardBodyMetrics";
import {
  CONTENT_FONT_MODE_LABELS_JA,
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";

type Props = {
  content: string;
  contentFontMode: string | null | undefined;
  layoutLines: string[];
};

/** 同一 entry・同一本文か（Mac/iPhone 比較用・保存内容の短い指紋） */
function contentDigest(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "empty";
  const head = trimmed.slice(0, 16);
  const tail = trimmed.slice(-16);
  return `len=${trimmed.length}|${head}|${tail}`;
}

/** Mac / iPhone で行配列が同一か確認する一時デバッグ（?bodyLinesDebug=1） */
export function DiaryPreviewBodyLinesDebugPanel({
  content,
  contentFontMode,
  layoutLines,
}: Props) {
  const rawMode = contentFontMode ?? "(null)";
  const mode = normalizeContentFontMode(contentFontMode);
  const configuredCharsPerLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE[mode];
  const { charsPerLine, maxLines } = getDiaryBodyLineLimit(contentFontMode);
  const trimmed = content.trim();
  const bodyDigest = useMemo(() => contentDigest(content), [content]);
  const countedLines = useMemo(
    () => countBodyLayoutLines(trimmed, contentFontMode),
    [trimmed, contentFontMode],
  );
  const bindingDisplayLines = useMemo(
    () => getBodyLayoutLinesForBindingPreview(trimmed, contentFontMode),
    [trimmed, contentFontMode],
  );
  const clipEstimate = useMemo(
    () => estimateBodyLineClipsAtRightEdge(mode),
    [mode],
  );

  const overLimitLines = useMemo(
    () =>
      layoutLines
        .map((line, i) => ({ index: i + 1, line, len: line.length }))
        .filter((row) => row.len > charsPerLine),
    [layoutLines, charsPerLine],
  );

  const linesFingerprint = useMemo(
    () =>
      layoutLines
        .map((line, i) => `${i + 1}:${line.length}:${line}`)
        .join("|"),
    [layoutLines],
  );

  const deviceLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "unknown";
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone/iPad";
    if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
    return "other";
  }, []);

  useEffect(() => {
    console.log("[diary-body-lines-debug]", {
      deviceLabel,
      rawMode,
      mode,
      modeLabelJa: CONTENT_FONT_MODE_LABELS_JA[mode],
      configuredCharsPerLine,
      charsPerLine,
      maxLines,
      bodyDigest,
      layoutLineCount: layoutLines.length,
      countBodyLayoutLines: countedLines,
      bindingDisplayLineCount: bindingDisplayLines.length,
      linesMatchCounter: layoutLines.length === countedLines,
      overLimitLines,
      linesFingerprint,
      layoutLines: layoutLines.map((line, i) => ({
        n: i + 1,
        len: line.length,
        text: line,
      })),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  }, [
    deviceLabel,
    rawMode,
    mode,
    configuredCharsPerLine,
    charsPerLine,
    maxLines,
    bodyDigest,
    layoutLines,
    countedLines,
    bindingDisplayLines,
    linesFingerprint,
    overLimitLines,
  ]);

  return (
    <aside
      className="mt-3 rounded-lg border border-amber-300 bg-amber-50/90 p-3 font-mono text-[10px] leading-snug text-stone-800"
      aria-label="本文行配列デバッグ"
      data-body-lines-debug="1"
      data-body-lines-count={layoutLines.length}
      data-body-lines-fingerprint={linesFingerprint}
    >
      <p className="mb-2 text-[11px] font-semibold text-amber-950">
        本文行デバッグ（?bodyLinesDebug=1）
      </p>
      <p>
        端末={deviceLabel} · 表示モード={CONTENT_FONT_MODE_LABELS_JA[mode]} (
        <code>{mode}</code>)
      </p>
      <p>
        raw contentFontMode=<code>{rawMode}</code>
        {rawMode !== mode && typeof contentFontMode === "string"
          ? ` → 正規化後 ${mode}`
          : null}
      </p>
      <p>
        コード設定 chars/行={configuredCharsPerLine}
        {configuredCharsPerLine === charsPerLine ? " ✓" : " ✗"} · max={maxLines}行
      </p>
      <p className="break-all text-[9px] text-stone-600">
        本文指紋（entry同一確認）: {bodyDigest}
      </p>
      <p className="text-[9px] text-stone-600">
        製本ページ内は {maxLines} 行まで。Mac/iPhone 比較は下の fingerprint と各 line[n]
        をコピーして照合してください。
      </p>
      {overLimitLines.length > 0 ? (
        <p className="rounded border border-red-300 bg-red-50 px-2 py-1 text-red-900">
          ⚠ {charsPerLine}字/行を超える行があります:{" "}
          {overLimitLines.map((r) => `line[${r.index}]=${r.len}字`).join(", ")}
        </p>
      ) : (
        <p className="text-green-900">全行が {charsPerLine}字/行以下 ✓</p>
      )}
      <p>
        layoutLines.length={layoutLines.length} · countBodyLayoutLines()=
        {countedLines}
        {layoutLines.length === countedLines ? " ✓一致" : " ✗不一致"}
      </p>
      <p>
        製本プレビュー表示={bindingDisplayLines.length}行（max {maxLines}）
        {countedLines > maxLines
          ? ` · 超過${countedLines - maxLines}行は非表示`
          : ""}
        {bindingDisplayLines.length === Math.min(countedLines, maxLines)
          ? " ✓"
          : " ✗"}
      </p>
      <ModeClipCheckBlock mode={mode} clipEstimate={clipEstimate} />
      <p className="mt-2 font-semibold text-stone-800">linesFingerprint（Mac/iPhone で完全一致すべき）</p>
      <p className="break-all text-[9px] text-stone-700">{linesFingerprint}</p>
      <ol className="mt-2 max-h-64 list-decimal overflow-y-auto pl-4">
        {layoutLines.map((line, index) => {
          const len = line.length;
          const atLimit = len === charsPerLine;
          const over = len > charsPerLine;
          return (
            <li
              key={index}
              data-body-line-index={index + 1}
              data-body-line-chars={len}
              className={[
                "mb-1 break-all",
                over ? "font-semibold text-red-800" : atLimit ? "text-amber-950" : "",
              ].join(" ")}
            >
              line[{index + 1}] <strong>{len}字</strong>
              {atLimit ? " (=上限)" : ""}
              {over ? ` (⚠${charsPerLine}字超)` : ""}: {line.length > 0 ? line : "〈空行〉"}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function ModeClipCheckBlock({
  mode,
  clipEstimate,
}: {
  mode: ContentFontMode;
  clipEstimate: ReturnType<typeof estimateBodyLineClipsAtRightEdge>;
}) {
  const candidates =
    mode === "generous"
      ? ([38, 39, 40, 41, 47] as const)
      : mode === "standard"
        ? ([32, 33, 38, 39, 41] as const)
        : mode === "relaxed"
          ? ([26, 28, 30, 32] as const)
          : ([50, 52, 54] as const);

  return (
    <div className="mt-2 rounded border border-stone-300 bg-white/80 p-2 text-[9px]">
      <p className="font-semibold text-stone-800">
        {CONTENT_FONT_MODE_LABELS_JA[mode]}・右端クリップ目安（724px座標）
      </p>
      <p>
        枠幅 {clipEstimate.bodyWidthPx.toFixed(0)}px · 字サイズ{" "}
        {clipEstimate.fontSizePx.toFixed(2)}px
      </p>
      <p>
        現在 {clipEstimate.charsPerLine}字/行 ≒ {clipEstimate.estimatedLineWidthPx.toFixed(0)}
        px →{" "}
        {clipEstimate.likelyClips
          ? "理論上クリップあり（実機はフォント描画差あり）"
          : "理論上クリップなし"}
      </p>
      <p>切れない目安: 約{clipEstimate.maxCharsWithoutClipEstimate}字/行以下</p>
      <ul className="mt-1 list-inside list-disc">
        {candidates.map((n) => {
          const est = estimateBodyLineClipsAtRightEdge(mode, n);
          return (
            <li key={n}>
              {n}字/行 ≒ {est.estimatedLineWidthPx.toFixed(0)}px
              {est.likelyClips ? " … 超過" : " … 枠内目安"}
              {n === clipEstimate.charsPerLine ? " ←現在" : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
