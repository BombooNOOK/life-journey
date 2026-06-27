"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  buildJournalSocialPostLayoutGridSvg,
  buildJournalSocialPostLayoutRulerSquareSvg,
  JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX,
  JOURNAL_SOCIAL_POST_LAYOUT_SLIDES,
  layoutAnchorsForTemplate,
  layoutSampleTextsForTemplate,
  photoRectForTemplate,
  type LayoutAnchor,
} from "@/lib/journal/social-post-image/layoutDebug";
import { buildJournalSocialPostLayoutRulerHref } from "@/lib/journal/social-post-image/layoutRulerUrls";
import {
  JOURNAL_SOCIAL_POST_TEMPLATE_SIZE,
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";

const TEMPLATE_BASE = "/images/journal-social-post";

type Props = {
  initialTemplate?: JournalSocialPostTemplateId;
  returnTo?: string | null;
};

export function JournalSocialPostImageLayoutDebugClient({
  initialTemplate = "sns02",
  returnTo = null,
}: Props) {
  const [templateId, setTemplateId] = useState<JournalSocialPostTemplateId>(initialTemplate);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showSampleText, setShowSampleText] = useState(true);
  const [showPhotoRect, setShowPhotoRect] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const slideMeta = JOURNAL_SOCIAL_POST_LAYOUT_SLIDES.find((s) => s.id === templateId)!;
  const templateSrc = `${TEMPLATE_BASE}/${slideMeta.templateFile}`;
  const anchors = useMemo(() => layoutAnchorsForTemplate(templateId), [templateId]);
  const sampleTexts = useMemo(() => layoutSampleTextsForTemplate(templateId), [templateId]);
  const photoRect = useMemo(() => photoRectForTemplate(templateId), [templateId]);
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];

  const gridDataUrl = useMemo(() => {
    const svg = buildJournalSocialPostLayoutGridSvg();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  const pinRulerDataUrl = useMemo(() => {
    if (!pin) return null;
    const svg = buildJournalSocialPostLayoutRulerSquareSvg({
      x: pin.x,
      y: pin.y,
      label: `${JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX}px 基準`,
    });
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [pin]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  }, []);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setPin({ x, y });
    const snippet = `x: ${x}, y: ${y}`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("fail");
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-sm leading-relaxed text-violet-950">
        <p className="font-medium">投稿画像テンプレート（819×1024）を 1:1 で表示しています。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>
            <strong>5px マス</strong>はこころ予報の定規と同じ考え方です。
          </li>
          <li>クリックで座標をコピーし、ピンクの 5px 正方形を置けます。</li>
          <li>水色の枠は写真エリア（<code className="rounded bg-white/70 px-1">templates.ts</code> の photo）。</li>
          <li>オレンジの丸は文字の基準点（<code className="rounded bg-white/70 px-1">templates.ts</code> の現在値）。</li>
          <li>緑のサンプル文字は位置確認用です（合成フォントと同一ではありません）。</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {JOURNAL_SOCIAL_POST_LAYOUT_SLIDES.map((slide) => {
          const href = buildJournalSocialPostLayoutRulerHref({
            template: slide.id,
            returnTo: returnTo ?? undefined,
          });
          const active = templateId === slide.id;
          return (
            <Link
              key={slide.id}
              href={href}
              onClick={() => setTemplateId(slide.id)}
              className={[
                "rounded-md border px-2 py-1 text-xs font-medium transition",
                active
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-violet-300 hover:bg-violet-50",
              ].join(" ")}
            >
              {slide.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          グリッド（10/50px）
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showPhotoRect} onChange={(e) => setShowPhotoRect(e.target.checked)} />
          写真エリア
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showAnchors} onChange={(e) => setShowAnchors(e.target.checked)} />
          配置アンカー
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showSampleText} onChange={(e) => setShowSampleText(e.target.checked)} />
          サンプル文字
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-stone-700">
        <span>カーソル: {cursor ? `x ${cursor.x}, y ${cursor.y}` : "—"}</span>
        <span>クリックピン: {pin ? `x ${pin.x}, y ${pin.y}` : "—"}</span>
        {copyState === "ok" ? <span className="text-emerald-700">座標をコピーしました</span> : null}
        {copyState === "fail" ? <span className="text-red-600">コピー失敗</span> : null}
      </div>

      <AnchorJson anchors={anchors} />

      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-stone-200 p-4">
        <div
          className="relative shrink-0 cursor-crosshair bg-white shadow-lg"
          style={{
            width: `${JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.widthPx}px`,
            height: `${JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.heightPx}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursor(null)}
          onClick={handleClick}
          role="presentation"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={templateSrc} alt="" className="absolute inset-0 block h-full w-full" draggable={false} />

          {showGrid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gridDataUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          ) : null}

          {showPhotoRect ? (
            <div
              className="pointer-events-none absolute border-2 border-sky-500 bg-sky-300/25"
              style={{
                left: `${photoRect.x}px`,
                top: `${photoRect.y}px`,
                width: `${photoRect.width}px`,
                height: `${photoRect.height}px`,
                borderRadius: photoRect.borderRadiusPx ? `${photoRect.borderRadiusPx}px` : undefined,
              }}
            />
          ) : null}

          {showPhotoRect && layout.companionFace ? (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-violet-500 bg-violet-300/25"
              style={{
                left: `${layout.companionFace.x - layout.companionFace.sizePx / 2}px`,
                top: `${layout.companionFace.y - layout.companionFace.sizePx / 2}px`,
                width: `${layout.companionFace.sizePx}px`,
                height: `${layout.companionFace.sizePx}px`,
              }}
            />
          ) : null}

          {pinRulerDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pinRulerDataUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          ) : null}

          <div
            className="pointer-events-none absolute left-0 top-0 border border-fuchsia-600 bg-fuchsia-400/90"
            style={{
              width: `${JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX}px`,
              height: `${JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX}px`,
            }}
            title="原点の 5px 基準マス"
          />

          {showAnchors
            ? anchors.map((anchor) => (
                <AnchorMarker key={anchor.id} anchor={anchor} />
              ))
            : null}

          {showSampleText
            ? sampleTexts.map((sample) => (
                <div
                  key={sample.id}
                  className="pointer-events-none absolute max-w-[360px]"
                  style={{
                    left: `${sample.x}px`,
                    top: `${sample.y}px`,
                    color: sample.fill ?? "#4a3728",
                    fontSize: `${sample.fontSize}px`,
                    fontWeight: sample.fontWeight ?? 400,
                    lineHeight: 1.45,
                    transform: sample.kind === "point" ? "translate(-50%, -50%)" : undefined,
                    textAlign: sample.kind === "point" ? "center" : "left",
                  }}
                >
                  {sample.text}
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function AnchorMarker({ anchor }: { anchor: LayoutAnchor }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${anchor.x}px`, top: `${anchor.y}px` }}
    >
      <div className="relative">
        <div
          className={[
            "border-2 border-orange-500 bg-orange-300/80",
            anchor.kind === "point" ? "h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" : "h-2 w-2 -translate-y-1/2",
          ].join(" ")}
        />
        <span className="absolute left-3 top-0 max-w-[220px] whitespace-normal rounded bg-orange-100/95 px-1 py-0.5 font-mono text-[9px] leading-tight text-orange-900">
          {anchor.label}
          <br />
          ({anchor.x}, {anchor.y})
        </span>
      </div>
    </div>
  );
}

function AnchorJson({ anchors }: { anchors: LayoutAnchor[] }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] text-stone-800">
      {JSON.stringify(
        anchors.map((a) => ({ id: a.id, x: a.x, y: a.y })),
        null,
        2,
      )}
    </pre>
  );
}
