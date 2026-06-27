"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  buildDailyNumberLayoutRulerHref,
} from "@/lib/admin/post-atelier/daily-number/layoutRulerUrls";
import {
  buildLayoutGridSvg,
  buildLayoutRulerSquareSvg,
  coverLayoutAnchors,
  DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX,
  DAILY_NUMBER_LAYOUT_SLIDES,
  layoutAnchorsForSlide,
  layoutSlideToPageIndex,
  personalLayoutAnchors,
  personalLayoutSampleTexts,
  type DailyNumberLayoutSlide,
} from "@/lib/admin/post-atelier/daily-number/layoutDebug";
import {
  DAILY_NUMBER_TEMPLATE_SIZE,
  DAILY_NUMBER_TEXT_COLOR,
} from "@/lib/admin/post-atelier/daily-number/imageLayout";

const TEMPLATE_BASE = "/images/post-atelier/daily-number";

type Props = {
  initialSlide?: DailyNumberLayoutSlide;
  returnTo?: string | null;
};

export function DailyNumberLayoutDebugClient({
  initialSlide = "cover",
  returnTo = null,
}: Props) {
  const [slide, setSlide] = useState<DailyNumberLayoutSlide>(initialSlide);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showSampleText, setShowSampleText] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const slideMeta = DAILY_NUMBER_LAYOUT_SLIDES.find((s) => s.id === slide)!;
  const templateSrc = `${TEMPLATE_BASE}/${slideMeta.templateFile}`;
  const anchors = useMemo(() => layoutAnchorsForSlide(slide), [slide]);
  const pageIndex = layoutSlideToPageIndex(slide);
  const sampleTexts = useMemo(
    () => (pageIndex != null ? personalLayoutSampleTexts(pageIndex) : []),
    [pageIndex],
  );

  const gridDataUrl = useMemo(() => {
    const svg = buildLayoutGridSvg();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  const pinRulerDataUrl = useMemo(() => {
    if (!pin) return null;
    const svg = buildLayoutRulerSquareSvg({
      x: pin.x,
      y: pin.y,
      label: `${DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX}px 基準`,
    });
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [pin]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCursor({ x, y });
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
        <p className="font-medium">テンプレート設計座標（819×1024）を 1:1 で表示しています。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>
            <strong>5px マス</strong>は日記プレビューと同じく「設計 px の 5px」です。画面を縮小すると見た目の大きさは変わります。
          </li>
          <li>クリックで座標をコピーし、ピンクの {DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX}px 正方形を置けます。</li>
          <li>紫のグリッドは 10px 細線・50px 太線（数値ラベル付き）です。</li>
          <li>オレンジの丸は <code className="rounded bg-white/70 px-1">imageLayout.ts</code> の現在値です。</li>
          <li>緑のサンプル文字は合成プレビューと同じ Klee One ではありませんが、位置確認用です。</li>
          <li>
            <strong>個別ページ</strong>は page_01,03,05 が左 / page_02,04,06 が右テンプレです。座標は{" "}
            <code className="rounded bg-white/70 px-1">imageLayout.ts</code> の PERSONAL_V2_LEFT / RIGHT を編集します。
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAILY_NUMBER_LAYOUT_SLIDES.map((s) => {
          const href = buildDailyNumberLayoutRulerHref({
            returnTo: returnTo ?? undefined,
            slide: s.id,
          });
          const active = slide === s.id;
          return (
            <Link
              key={s.id}
              href={href}
              className={[
                "rounded-md border px-2 py-1 text-xs font-medium transition",
                active
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-violet-300 hover:bg-violet-50",
              ].join(" ")}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-stone-700">スライド</span>
          <select
            value={slide}
            onChange={(e) => setSlide(e.target.value as DailyNumberLayoutSlide)}
            className="rounded-md border border-stone-300 px-2 py-1"
          >
            {DAILY_NUMBER_LAYOUT_SLIDES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          グリッド（10/50px）
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showAnchors} onChange={(e) => setShowAnchors(e.target.checked)} />
          配置アンカー
        </label>
        {pageIndex != null ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSampleText}
              onChange={(e) => setShowSampleText(e.target.checked)}
            />
            サンプル文字
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-stone-700">
        <span>
          カーソル: {cursor ? `x ${cursor.x}, y ${cursor.y}` : "—"}
        </span>
        <span>
          クリックピン: {pin ? `x ${pin.x}, y ${pin.y}` : "—"}
        </span>
        {copyState === "ok" ? <span className="text-emerald-700">座標をコピーしました</span> : null}
        {copyState === "fail" ? <span className="text-red-600">コピー失敗</span> : null}
      </div>

      {slide === "cover" ? (
        <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] text-stone-800">
          {JSON.stringify(
            coverLayoutAnchors().map((a) => ({ id: a.id, x: a.x, y: a.y })),
            null,
            2,
          )}
        </pre>
      ) : slide.startsWith("personal-") && pageIndex != null ? (
        <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] text-stone-800">
          {JSON.stringify(
            personalLayoutAnchors(pageIndex).map((a) => ({ id: a.id, x: a.x, y: a.y })),
            null,
            2,
          )}
        </pre>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-stone-200 p-4">
        <div
          className="relative shrink-0 cursor-crosshair bg-white shadow-lg"
          style={{
            width: `${DAILY_NUMBER_TEMPLATE_SIZE.widthPx}px`,
            height: `${DAILY_NUMBER_TEMPLATE_SIZE.heightPx}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursor(null)}
          onClick={handleClick}
          role="presentation"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={templateSrc}
            alt=""
            className="absolute inset-0 block h-full w-full"
            draggable={false}
          />

          {showGrid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gridDataUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          ) : null}

          {pinRulerDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pinRulerDataUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          ) : null}

          <div
            className="pointer-events-none absolute left-0 top-0 border border-fuchsia-600 bg-fuchsia-400/90"
            style={{
              width: `${DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX}px`,
              height: `${DAILY_NUMBER_LAYOUT_RULER_SQUARE_PX}px`,
            }}
            title="原点の 5px 基準マス"
          />

          {showAnchors
            ? anchors.map((anchor) => (
                <div
                  key={anchor.id}
                  className="pointer-events-none absolute"
                  style={{ left: `${anchor.x}px`, top: `${anchor.y}px` }}
                >
                  <div className="relative">
                    <div className="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-500 bg-orange-300/80" />
                    <span className="absolute left-3 top-0 max-w-[200px] whitespace-normal rounded bg-orange-100/95 px-1 py-0.5 font-mono text-[9px] leading-tight text-orange-900">
                      {anchor.label}
                      <br />
                      ({anchor.x}, {anchor.y})
                    </span>
                  </div>
                </div>
              ))
            : null}

          {showSampleText && pageIndex != null
            ? sampleTexts.map((sample) => (
                <div
                  key={sample.id}
                  className="pointer-events-none absolute max-w-[360px]"
                  style={{
                    left: `${sample.x}px`,
                    top: `${sample.y}px`,
                    color: DAILY_NUMBER_TEXT_COLOR,
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
