"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { DiaryDesignPreview } from "@/components/journal/DiaryDesignPreview";
import { CONTENT_FONT_MODE_LABELS_JA, CONTENT_FONT_MODES } from "@/lib/journal/contentFontMode";
import { DIARY_BOOK_ENTRY_COMMENT_PREVIEW_LONG_132 } from "@/lib/journal/diaryBookEntryCommentPreviewSamples";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "@/lib/journal/diaryBookEntryCommentWrap";
import { DIARY_BOOK_ENTRY_V2_COMMENT } from "@/lib/journal/diaryBookEntryPrintLayout";
import { DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY } from "@/lib/journal/diaryBookEntryPrintLayout";
import {
  DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS,
  parseDiaryBookEntryLayoutRulerTarget,
} from "@/lib/journal/diaryBookEntryLayoutRuler";
import { companionOptions, normalizeCompanionType } from "@/lib/journal/meta";

const SAMPLE_BODY =
  "今日はハリネズミのふくろうと一緒に、\nのんびりお散歩をしました。\n公園のベンチで少し休みながら、木漏れ日を眺めていました。\n穏やかな時間がとても心地よかったです。";

const SAMPLE_COMMENT =
  "穏やかな一日の記録、とても素敵ですね。特別な出来事がなくても、日々を丁寧に残すこと自体が、あなたらしい歩みの証です。木漏れ日を眺める時間は、心を整える大切なひとときです。";

const COMMENT_PREVIEW_SAMPLES = [
  { id: "default", label: "通常サンプル（89字程度）" },
  { id: "long132", label: "132字・危険ケース（ff2+2月）" },
] as const;

function parseCommentSample(raw: string | null): (typeof COMMENT_PREVIEW_SAMPLES)[number]["id"] {
  return COMMENT_PREVIEW_SAMPLES.some(({ id }) => id === raw) ? (raw as "default" | "long132") : "long132";
}

const SAMPLE_PHOTO_SRC = "/images/home-mock/demo-journal-photo.png";

const PREVIEW_DATE_SAMPLES = [
  { id: "2026-06-05", label: "6月5日（一桁）" },
  { id: "2026-12-25", label: "12月25日（二桁）" },
] as const;

function parsePreviewDate(raw: string | null): Date {
  const fallback = new Date("2026-06-05T10:00:00.000Z");
  if (!raw?.trim()) return fallback;
  const normalized = raw.trim();
  const parsed = new Date(
    normalized.includes("T") ? normalized : `${normalized}T10:00:00.000Z`,
  );
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

const PREVIEW_RULER_LABELS: Record<(typeof DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS)[number], string> = {
  photo: "写真",
  date: "日付",
  numbers: "数字",
  mood: "気持ち",
  body: "本文",
  comment: "読み解き",
};

function buildHref(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const q = qs.toString();
  return q ? `/preview/diary-book-entry?${q}` : "/preview/diary-book-entry";
}

export function DiaryBookEntryPreviewClient() {
  const searchParams = useSearchParams();
  const companionType = normalizeCompanionType(searchParams.get("companion"));
  const contentFontMode = searchParams.get("mode") ?? "standard";
  const bodyLinesDebug = searchParams.get("bodyLinesDebug") === "1";
  const layoutRulerTarget = parseDiaryBookEntryLayoutRulerTarget(searchParams.get("ruler"));
  const previewDateParam = searchParams.get("date");
  const previewDate = parsePreviewDate(previewDateParam);
  const useLegacyBackground = searchParams.get("bg") === "legacy";
  const useBaseBackgroundOnly =
    searchParams.get("bg") === "base" ||
    (DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY && !useLegacyBackground);
  const commentSample = parseCommentSample(searchParams.get("commentSample"));
  const previewComment =
    commentSample === "long132" ? DIARY_BOOK_ENTRY_COMMENT_PREVIEW_LONG_132 : SAMPLE_COMMENT;
  const commentLayoutStats = resolveDiaryBookEntryV2CommentRenderLayout(previewComment);
  const commentEffectiveFontPx =
    DIARY_BOOK_ENTRY_V2_COMMENT.contentFontSizePx * commentLayoutStats.fontScale;
  const commentUsedHeightPx =
    commentLayoutStats.lines.length *
    commentEffectiveFontPx *
    commentLayoutStats.lineHeight;

  const activeDateSample =
    PREVIEW_DATE_SAMPLES.find(({ id }) => id === previewDateParam?.trim())?.id ?? "2026-06-05";

  const sharedHrefParams = {
    companion: companionType,
    mode: contentFontMode,
    date: previewDateParam ?? activeDateSample,
    bodyLinesDebug: bodyLinesDebug ? "1" : undefined,
    ruler: layoutRulerTarget ?? undefined,
    bg: useLegacyBackground ? "legacy" : useBaseBackgroundOnly ? "base" : undefined,
    commentSample: commentSample === "long132" ? "long132" : undefined,
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-800">日記ブック本文テンプレ（v2）</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY
            ? "共通背景＋伴走キャラ PNG 合成（724×1024）。伴走キャラ切り替えで確認できます。"
            : "水彩 scrapbook 背景 PNG（724×1024）＋動的テキストの合成プレビューです。"}
          ログイン不要。
        </p>
        <p className="mt-2 text-sm text-stone-600">
          PDF 確認:{" "}
          <code className="rounded bg-stone-200 px-1 text-stone-700">npm run preview:diary-entry</code>
        </p>
        <p className="mt-2 text-sm text-stone-600">
          <Link href="/preview" className="text-stone-800 underline">
            校正メニューへ
          </Link>
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          {DIARY_BOOK_ENTRY_V2_USE_COMPANION_OVERLAY ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">背景モード</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={buildHref({ ...sharedHrefParams, bg: undefined })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    !useLegacyBackground
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  共通背景＋キャラ合成
                </Link>
                <Link
                  href={buildHref({ ...sharedHrefParams, bg: "legacy" })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    useLegacyBackground
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  キャラ込み1枚絵（旧）
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">背景テンプレ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={buildHref({ ...sharedHrefParams, bg: "base" })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    useBaseBackgroundOnly
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  共通背景（キャラなし・試作）
                </Link>
                <Link
                  href={buildHref({ ...sharedHrefParams, bg: undefined })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    !useBaseBackgroundOnly
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  キャラ込み（従来）
                </Link>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">伴走キャラ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {companionOptions.map(({ id, label }) => (
                <Link
                  key={id}
                  href={buildHref({ ...sharedHrefParams, companion: id })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    companionType === id
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">文字サイズ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTENT_FONT_MODES.map((mode) => (
                <Link
                  key={mode}
                  href={buildHref({ ...sharedHrefParams, mode })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    contentFontMode === mode
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {CONTENT_FONT_MODE_LABELS_JA[mode]}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              読み解き欄
            </p>
            <p className="mt-1 text-xs text-stone-500">
              製本PDFと同じ折り返し（1・2行目29字、3・4行目26字、5行目27字）。132字ケースで最長原稿を確認できます。
            </p>
            <p className="mt-2 text-xs font-semibold text-stone-500">原稿サンプル</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMENT_PREVIEW_SAMPLES.map(({ id, label }) => (
                <Link
                  key={id}
                  href={buildHref({
                    ...sharedHrefParams,
                    commentSample: id === "long132" ? "long132" : undefined,
                  })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    commentSample === id
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-3 rounded-md bg-stone-100 px-3 py-2 text-xs leading-relaxed text-stone-700">
              {previewComment.length}文字 · {commentLayoutStats.lines.length}行 · 字{" "}
              {commentEffectiveFontPx.toFixed(1)}px
              {commentUsedHeightPx > DIARY_BOOK_ENTRY_V2_COMMENT.contentHeightPx + 1
                ? " · 下が切れる可能性あり"
                : " · 枠内に収まる"}
              {commentSample === "long132" ? (
                <>
                  {" "}
                  · 行長: {commentLayoutStats.lines.map((line) => line.length).join(" / ")}
                </>
              ) : null}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">日付サンプル</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREVIEW_DATE_SAMPLES.map(({ id, label }) => (
                <Link
                  key={id}
                  href={buildHref({ ...sharedHrefParams, date: id })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    (previewDateParam?.trim() || activeDateSample) === id
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              基準マス（1辺 = 5px）
            </p>
            <p className="mt-1 text-xs text-stone-500">
              ピンクの小さな四角が設計座標 5px です。「右に 10px」= 2マス分、のように指定できます。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildHref({ ...sharedHrefParams, ruler: undefined })}
                className={[
                  "rounded-md border px-3 py-1.5 text-sm",
                  layoutRulerTarget == null
                    ? "border-stone-700 bg-stone-800 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                なし
              </Link>
              {DIARY_BOOK_ENTRY_LAYOUT_RULER_TARGETS.map((target) => (
                <Link
                  key={target}
                  href={buildHref({ ...sharedHrefParams, ruler: target })}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    layoutRulerTarget === target
                      ? "border-fuchsia-700 bg-fuchsia-700 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {PREVIEW_RULER_LABELS[target]}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <Link
              href={buildHref({
                ...sharedHrefParams,
                bodyLinesDebug: bodyLinesDebug ? undefined : "1",
              })}
              className="text-sm text-stone-700 underline hover:text-stone-900"
            >
              {bodyLinesDebug ? "行デバッグ OFF" : "行デバッグ ON（?bodyLinesDebug=1）"}
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <DiaryDesignPreview
            companionType={companionType}
            mood="calm"
            activity="record_anyway"
            content={SAMPLE_BODY}
            comment={previewComment}
            photoSrc={SAMPLE_PHOTO_SRC}
            previewDate={previewDate}
            diaryNumbers={{
              today: previewDate.getDate() % 9 || 9,
              month: previewDate.getMonth() + 1,
              year: (previewDate.getFullYear() % 9) + 1,
              calmness: 3,
            }}
            contentFontMode={contentFontMode}
            kanteiOrderExists
            layoutRulerTarget={layoutRulerTarget}
            backgroundTemplate={
              useLegacyBackground ? "companion" : useBaseBackgroundOnly ? "base" : "companion"
            }
          />
        </div>
      </div>
    </div>
  );
}
