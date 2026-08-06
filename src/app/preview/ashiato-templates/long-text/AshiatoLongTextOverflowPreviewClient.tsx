"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DiaryBookAshiatoEntryPreviewPage } from "@/components/journal/DiaryBookAshiatoEntryPreviewPage";
import { DiaryBookPageViewport } from "@/components/journal/DiaryBookPageViewport";
import {
  CONTENT_FONT_MODE_LABELS_JA,
  CONTENT_FONT_MODES,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  ashiatoEntryBodyLengthFlag,
  getAshiatoHorizontalBodyCapacity,
  getAshiatoHorizontalBodyLayoutLinesAll,
  resolveAshiatoEnikkiVerticalMetrics,
  resolveAshiatoEntryRenderPlan,
} from "@/lib/journal/ashiatoEntryRender";
import {
  ashiatoPageTemplateOptions,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import {
  bodyFrameSeverityFromLengthFlag,
  getBodyFrameStatusLabel,
  type BodyFrameSeverity,
} from "@/lib/journal/diaryPreviewBodyLineLimits";

const SAMPLE_PHOTO = "/images/home-mock/demo-journal-photo.png";
const SAMPLE_COMMENT =
  "穏やかな一日の記録、とても素敵ですね。特別な出来事がなくても、日々を丁寧に残すこと自体が、あなたらしい歩みの証です。";

/** 実描画プレビューと同系統の短めサンプル */
const SAMPLE_BODY_SHORT =
  "今日は森のなかをゆっくり歩きました。木漏れ日がやわらかくて、心がほどけていくようです。短い言葉でも、あしあととして残しておきたい一日でした。";

/**
 * 改行の試しやすさ用：段落ごとに改行入りの長めサンプル。
 * 実描画プレビューの長文と同じ文面を、手動改行付きにしたもの。
 */
const SAMPLE_BODY_LONG = [
  "今日は森のなかをゆっくり歩きました。木漏れ日がやわらかくて、心がほどけていくようです。",
  "短い言葉でも、あしあととして残しておきたい一日でした。道ばたの小さな花や、足元のどんぐりにも目がとまります。",
  "カフェで温かいお茶をいただきながら、ノートを開いて今日の気持ちを書いてみました。特別な出来事がなくても、日々を丁寧に残すこと自体が、自分らしい歩みの証なのかもしれません。",
  "帰り際、風が葉を揺らす音を聞きながら、また明日も小さなあしあとを残していこうと思いました。季節の移ろいを感じられる日々に、そっと感謝を添えて。",
  "夜になってからも、森の匂いがどこか懐かしく思い出されます。ページのすみに残る余白も、今の自分にはちょうどよい間隔です。",
].join("\n");

type LengthPreset = "fit" | "caution" | "overflow" | "extreme";

const LENGTH_PRESET_LABELS: Record<LengthPreset, string> = {
  fit: "枠ちょうど",
  caution: "1行超過",
  overflow: "2行超過",
  extreme: "大幅超過",
};

const SEVERITY_BADGE: Record<
  BodyFrameSeverity,
  { label: string; className: string }
> = {
  ok: {
    label: "ok",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  caution: {
    label: "caution",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  overflow: {
    label: "overflow",
    className: "border-orange-400 bg-orange-50 text-orange-950",
  },
};

type CapacitySnapshot = {
  writingMode: "horizontal" | "vertical";
  maxLines: number;
  maxBindingChars: number;
  baseMaxCharsPerLine: number;
  maxCharsByLine: number[];
};

function resolveCapacity(
  pageTemplate: AshiatoPageTemplateId,
  contentFontMode: ContentFontMode,
): CapacitySnapshot | null {
  const plan = resolveAshiatoEntryRenderPlan({ pageTemplate });
  const body = plan.slotsPercent.body;
  if (!body) return null;

  if (plan.bodyWritingMode === "vertical") {
    const metrics = resolveAshiatoEnikkiVerticalMetrics(contentFontMode, body);
    return {
      writingMode: "vertical",
      maxLines: metrics.maxColumns,
      maxBindingChars: metrics.maxCharsPerColumn * metrics.maxColumns,
      baseMaxCharsPerLine: metrics.maxCharsPerColumn,
      maxCharsByLine: Array.from(
        { length: metrics.maxColumns },
        () => metrics.maxCharsPerColumn,
      ),
    };
  }

  const capacity = getAshiatoHorizontalBodyCapacity(
    contentFontMode,
    body,
    plan.bodyTextLayout,
  );
  return {
    writingMode: "horizontal",
    maxLines: capacity.maxLines,
    maxBindingChars: capacity.maxBindingChars,
    baseMaxCharsPerLine: capacity.baseMaxCharsPerLine,
    maxCharsByLine: capacity.maxCharsByLine,
  };
}

function targetLineCount(preset: LengthPreset, maxLines: number): number {
  switch (preset) {
    case "fit":
      return maxLines;
    case "caution":
      return maxLines + 1;
    case "overflow":
      return maxLines + 2;
    case "extreme":
      return maxLines + 5;
  }
}

/** 行枠を意図どおり埋める詰め文字（判定確認用） */
function buildPackedBody(capacity: CapacitySnapshot, preset: LengthPreset): string {
  const lines = targetLineCount(preset, capacity.maxLines);
  if (capacity.writingMode === "vertical") {
    const chars =
      capacity.maxBindingChars +
      Math.max(0, lines - capacity.maxLines) * capacity.baseMaxCharsPerLine;
    return "あ".repeat(Math.max(1, chars));
  }
  return Array.from({ length: lines }, (_, index) => {
    const max =
      capacity.maxCharsByLine[index] ?? capacity.baseMaxCharsPerLine;
    return "あ".repeat(max);
  }).join("\n");
}

function measureBodyUsage(
  pageTemplate: AshiatoPageTemplateId,
  contentFontMode: ContentFontMode,
  content: string,
  capacity: CapacitySnapshot,
): { lineCount: number; charCount: number } {
  const charCount = content.replace(/\s/g, "").length;
  if (capacity.writingMode === "vertical") {
    const used = content.replace(/\n/g, "").length;
    return {
      charCount: used,
      lineCount:
        used <= 0
          ? 0
          : Math.ceil(used / Math.max(1, capacity.baseMaxCharsPerLine)),
    };
  }
  const plan = resolveAshiatoEntryRenderPlan({ pageTemplate });
  const body = plan.slotsPercent.body;
  if (!body) return { lineCount: 0, charCount };
  return {
    charCount,
    lineCount: getAshiatoHorizontalBodyLayoutLinesAll(
      content,
      contentFontMode,
      body,
      plan.bodyTextLayout,
    ).length,
  };
}

function PreviewCard({
  pageTemplate,
  contentFontMode,
  content,
}: {
  pageTemplate: AshiatoPageTemplateId;
  contentFontMode: ContentFontMode;
  content: string;
}) {
  const meta = ashiatoPageTemplateOptions.find((o) => o.id === pageTemplate)!;
  const capacity = useMemo(
    () => resolveCapacity(pageTemplate, contentFontMode),
    [pageTemplate, contentFontMode],
  );
  const severity = useMemo(
    () =>
      bodyFrameSeverityFromLengthFlag(
        ashiatoEntryBodyLengthFlag({
          content,
          contentFontMode,
          pageTemplate,
        }),
      ),
    [content, contentFontMode, pageTemplate],
  );
  const usage = useMemo(
    () =>
      capacity
        ? measureBodyUsage(pageTemplate, contentFontMode, content, capacity)
        : { lineCount: 0, charCount: 0 },
    [capacity, pageTemplate, contentFontMode, content],
  );
  const badge = SEVERITY_BADGE[severity];
  const statusLabel = getBodyFrameStatusLabel(contentFontMode, severity, false);

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <header className="space-y-1.5 border-b border-stone-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-stone-900">{meta.label}</h3>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700">
            {CONTENT_FONT_MODE_LABELS_JA[contentFontMode]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        {capacity ? (
          <p className="text-sm tabular-nums leading-snug text-stone-600">
            {usage.charCount}/{capacity.maxBindingChars}字 · 行{" "}
            {usage.lineCount}/{capacity.maxLines}
            {capacity.writingMode === "vertical" ? "（縦・列換算）" : ""}
            {" · "}
            {capacity.baseMaxCharsPerLine}字/行基準
          </p>
        ) : (
          <p className="text-sm text-stone-500">本文枠なし</p>
        )}
        <p
          className={
            severity === "overflow"
              ? "text-sm font-medium text-orange-800"
              : severity === "caution"
                ? "text-sm font-medium text-amber-800"
                : "text-sm text-stone-500"
          }
        >
          {statusLabel}
        </p>
      </header>
      <div className="bg-[#f7f4ef] px-3 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <DiaryBookPageViewport>
            <DiaryBookAshiatoEntryPreviewPage
              pageTemplate={pageTemplate}
              companionType="owl"
              mood="calm"
              activity="family_friends"
              content={content}
              comment={SAMPLE_COMMENT}
              photoSrc={SAMPLE_PHOTO}
              previewDate={new Date("2026-06-05T10:00:00.000Z")}
              diaryNumbers={{ today: 5, month: 3, year: 8 }}
              contentFontMode={contentFontMode}
              kanteiOrderExists
            />
          </DiaryBookPageViewport>
        </div>
      </div>
    </article>
  );
}

export function AshiatoLongTextOverflowPreviewClient() {
  const [draft, setDraft] = useState(SAMPLE_BODY_LONG);
  /** 見やすさ優先：最初は1テンプレ×全サイズ。必要なら「すべて」へ */
  const [modeFilter, setModeFilter] = useState<ContentFontMode | "all">("all");
  const [templateFilter, setTemplateFilter] = useState<
    AshiatoPageTemplateId | "all"
  >("suuji_ashiato_irodori");
  /** 詰め文字生成の基準（単一テンプレ＋モード選択時に便利） */
  const [packTemplate, setPackTemplate] =
    useState<AshiatoPageTemplateId>("suuji_ashiato_irodori");
  const [packMode, setPackMode] = useState<ContentFontMode>("compact");

  const templates = useMemo(
    () =>
      templateFilter === "all"
        ? ashiatoPageTemplateOptions.map((o) => o.id)
        : [templateFilter],
    [templateFilter],
  );
  const modes = useMemo(
    () => (modeFilter === "all" ? [...CONTENT_FONT_MODES] : [modeFilter]),
    [modeFilter],
  );

  const draftCharCount = draft.replace(/\s/g, "").length;
  const draftManualLines = draft.length === 0 ? 0 : draft.split("\n").length;

  const cells = useMemo(() => {
    const out: {
      pageTemplate: AshiatoPageTemplateId;
      contentFontMode: ContentFontMode;
    }[] = [];
    for (const pageTemplate of templates) {
      for (const contentFontMode of modes) {
        if (!resolveCapacity(pageTemplate, contentFontMode)) continue;
        out.push({ pageTemplate, contentFontMode });
      }
    }
    return out;
  }, [templates, modes]);

  function applyPackedPreset(preset: LengthPreset) {
    const capacity = resolveCapacity(packTemplate, packMode);
    if (!capacity) return;
    setDraft(buildPackedBody(capacity, preset));
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-16 sm:max-w-2xl">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-relaxed text-emerald-950">
        上のサンプル文を編集・改行すると、下のプレビューが追従します。ページは1枚ずつ大きく縦並びです。テンプレを切り替えて見比べてください。
      </div>

      <section className="space-y-3 rounded-xl border border-stone-300 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">サンプル本文</h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Enter で改行しながら、はみ出しの様子を確認できます
            </p>
          </div>
          <p className="text-[11px] tabular-nums text-stone-600">
            {draftCharCount}字（空白除く）· 手動改行行 {draftManualLines}
          </p>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full resize-y rounded-lg border border-stone-300 bg-[#faf8f5] px-3 py-2.5 text-sm leading-relaxed text-stone-900 outline-none ring-emerald-600/30 focus:ring-2"
          placeholder="ここに本文を入力…"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft(SAMPLE_BODY_LONG)}
            className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            長めサンプル（改行あり）
          </button>
          <button
            type="button"
            onClick={() => setDraft(SAMPLE_BODY_SHORT)}
            className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            短めサンプル
          </button>
          <button
            type="button"
            onClick={() => setDraft("")}
            className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            クリア
          </button>
        </div>

        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-stone-700">
            判定用：詰め文字を本文へ貼り付け
          </p>
          <p className="mt-0.5 text-[10px] text-stone-500">
            基準テンプレ・文字サイズの行枠に合わせた「あ」詰めを、上の入力欄に入れます
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-stone-600">
              基準
              <select
                value={packTemplate}
                onChange={(e) =>
                  setPackTemplate(e.target.value as AshiatoPageTemplateId)
                }
                className="rounded border border-stone-300 bg-white px-1.5 py-1 text-[11px] text-stone-800"
              >
                {ashiatoPageTemplateOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-stone-600">
              サイズ
              <select
                value={packMode}
                onChange={(e) => setPackMode(e.target.value as ContentFontMode)}
                className="rounded border border-stone-300 bg-white px-1.5 py-1 text-[11px] text-stone-800"
              >
                {CONTENT_FONT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {CONTENT_FONT_MODE_LABELS_JA[mode]}
                  </option>
                ))}
              </select>
            </label>
            {(Object.keys(LENGTH_PRESET_LABELS) as LengthPreset[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => applyPackedPreset(id)}
                className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-950 hover:bg-emerald-100"
              >
                {LENGTH_PRESET_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-stone-800">表示するテンプレート</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTemplateFilter("all")}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              templateFilter === "all"
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700",
            ].join(" ")}
          >
            すべて
          </button>
          {ashiatoPageTemplateOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTemplateFilter(opt.id)}
              className={[
                "rounded-md border px-2.5 py-1.5 text-xs font-medium",
                templateFilter === opt.id
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-300 bg-white text-stone-700",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="pt-2 text-xs font-semibold text-stone-800">文字サイズ</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModeFilter("all")}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              modeFilter === "all"
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700",
            ].join(" ")}
          >
            すべて
          </button>
          {CONTENT_FONT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setModeFilter(mode)}
              className={[
                "rounded-md border px-2.5 py-1.5 text-xs font-medium",
                modeFilter === mode
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-300 bg-white text-stone-700",
              ].join(" ")}
            >
              {CONTENT_FONT_MODE_LABELS_JA[mode]}
            </button>
          ))}
        </div>

        <p className="pt-1 text-[11px] text-stone-500">
          表示中 {cells.length} 枚（縦並び・大きめ）· 同じサンプル本文を反映
        </p>
      </section>

      <div className="flex flex-col gap-8">
        {cells.map((cell) => (
          <PreviewCard
            key={`${cell.pageTemplate}-${cell.contentFontMode}`}
            pageTemplate={cell.pageTemplate}
            contentFontMode={cell.contentFontMode}
            content={draft}
          />
        ))}
      </div>

      <p className="text-center text-xs text-stone-500">
        <Link
          href="/preview/ashiato-templates/render"
          className="underline-offset-2 hover:underline"
        >
          実描画（短文・長文サンプル）
        </Link>
        {" · "}
        <Link
          href="/preview/ashiato-templates"
          className="underline-offset-2 hover:underline"
        >
          表紙・かたち選択
        </Link>
        {" · "}
        <Link href="/preview" className="underline-offset-2 hover:underline">
          プレビュー一覧
        </Link>
      </p>
    </div>
  );
}
