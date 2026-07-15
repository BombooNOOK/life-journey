"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  buildHomeForestSignLayoutGridSvg,
  buildHomeForestSignLayoutRulerSquareSvg,
  HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX,
  HOME_FOREST_SIGN_LAYOUT_VIEWPORTS,
  layoutAnchorsForViewport,
  layoutSampleTextsForViewport,
  type LayoutAnchor,
} from "@/lib/home/homeForestSignLayoutDebug";
import { buildHomeForestSignLayoutRulerHref } from "@/lib/home/homeForestSignLayoutRulerUrls";
import {
  HOME_FOREST_SIGN_NAV_LABELS,
  homeForestSignDesignSize,
  homeForestSignPlacementStyle,
  type HomeForestSignViewport,
} from "@/lib/home/homeForestSignLayout";
import { HomeForestSignLoginNote, HomeForestSignOverlay } from "@/components/home/HomeForestSignOverlay";

const PREVIEW_NAV_BY_ID = {
  loghouse: { id: "loghouse", href: "/orders", label: HOME_FOREST_SIGN_NAV_LABELS.loghouse },
  first: { id: "first", href: "/guide/first", label: HOME_FOREST_SIGN_NAV_LABELS.first },
  "forest-map": {
    id: "forest-map",
    href: "/help/forest-map?returnTo=%2F",
    label: HOME_FOREST_SIGN_NAV_LABELS["forest-map"],
  },
  "ljd-help": { id: "ljd-help", href: "/help/ljd", label: HOME_FOREST_SIGN_NAV_LABELS["ljd-help"] },
} as const;

/** 画面上で見える定規マス（設計座標 5px の目安） */
const RULER_MARKER_VISUAL_PX = 14;

type Props = {
  initialViewport?: HomeForestSignViewport;
  initialPin?: { x: number; y: number } | null;
  returnTo?: string | null;
};

function RulerSquareMarker({
  x,
  y,
  label,
  tone = "cursor",
}: {
  x: number;
  y: number;
  label: string;
  tone?: "cursor" | "pin";
}) {
  const designSize = HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX;
  const visualSize = RULER_MARKER_VISUAL_PX;
  const offset = Math.round((visualSize - designSize) / 2);

  return (
    <div
      className="pointer-events-none absolute z-[120]"
      style={{ left: `${x - offset}px`, top: `${y - offset}px` }}
      aria-hidden
    >
      <div
        className={[
          "box-border rounded-[1px] shadow-sm",
          tone === "pin"
            ? "border-2 border-fuchsia-700 bg-fuchsia-500"
            : "border-2 border-fuchsia-600 bg-fuchsia-300/95",
        ].join(" ")}
        style={{ width: `${visualSize}px`, height: `${visualSize}px` }}
      />
      <div
        className="pointer-events-none absolute border border-fuchsia-800/80 bg-fuchsia-200/90"
        style={{
          left: `${offset}px`,
          top: `${offset}px`,
          width: `${designSize}px`,
          height: `${designSize}px`,
        }}
      />
      <p
        className={[
          "m-0 mt-1 max-w-[260px] whitespace-pre-wrap rounded bg-white/92 px-1 py-0.5 font-mono text-[11px] leading-tight shadow-sm",
          tone === "pin" ? "text-fuchsia-950" : "text-fuchsia-900",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

export function HomeForestSignLayoutDebugClient({
  initialViewport = "mobile",
  initialPin = null,
  returnTo = null,
}: Props) {
  const [viewport, setViewport] = useState<HomeForestSignViewport>(initialViewport);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showSampleText, setShowSampleText] = useState(false);
  const [showLiveOverlay, setShowLiveOverlay] = useState(true);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(initialPin);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const interactionCleanupRef = useRef<(() => void) | null>(null);

  const slideMeta = HOME_FOREST_SIGN_LAYOUT_VIEWPORTS.find((s) => s.id === viewport)!;
  const { widthPx, heightPx } = homeForestSignDesignSize(viewport);
  const anchors = useMemo(() => layoutAnchorsForViewport(viewport), [viewport]);
  const sampleTexts = useMemo(() => layoutSampleTextsForViewport(viewport), [viewport]);

  const pinHref = useMemo(() => {
    if (!pin) return null;
    return buildHomeForestSignLayoutRulerHref({
      viewport,
      returnTo: returnTo ?? undefined,
      pin,
    });
  }, [pin, returnTo, viewport]);

  const gridDataUrl = useMemo(() => {
    const svg = buildHomeForestSignLayoutGridSvg(viewport);
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [viewport]);

  const pinRulerDataUrl = useMemo(() => {
    if (!pin) return null;
    const svg = buildHomeForestSignLayoutRulerSquareSvg({
      viewport,
      x: pin.x,
      y: pin.y,
      label: `${HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX}px @ ${pin.x},${pin.y}`,
    });
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [pin, viewport]);

  const syncPinToAddressBar = useCallback(
    (nextPin: { x: number; y: number } | null) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (nextPin) {
        params.set("x", String(nextPin.x));
        params.set("y", String(nextPin.y));
      } else {
        params.delete("x");
        params.delete("y");
      }
      params.set("viewport", viewport);
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(null, "", nextUrl);
    },
    [viewport],
  );

  const placePin = useCallback(
    async (x: number, y: number) => {
      const nextPin = { x, y };
      setPin(nextPin);
      setCursor(nextPin);
      syncPinToAddressBar(nextPin);
      const snippet = `x: ${x}, y: ${y}`;
      try {
        await navigator.clipboard.writeText(snippet);
        setCopyState("ok");
        window.setTimeout(() => setCopyState("idle"), 1500);
      } catch {
        setCopyState("fail");
      }
    },
    [syncPinToAddressBar],
  );

  const attachInteractionRef = useCallback(
    (layer: HTMLDivElement | null) => {
      interactionCleanupRef.current?.();
      interactionCleanupRef.current = null;
      if (!layer) return;

      const onMove = (event: PointerEvent) => {
        const rect = layer.getBoundingClientRect();
        setCursor({
          x: Math.round(event.clientX - rect.left),
          y: Math.round(event.clientY - rect.top),
        });
      };

      const onLeave = () => {
        setCursor(null);
      };

      const onDown = (event: PointerEvent) => {
        const rect = layer.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);
        void placePin(x, y);
      };

      layer.addEventListener("pointermove", onMove);
      layer.addEventListener("pointerleave", onLeave);
      layer.addEventListener("pointerdown", onDown);
      layer.dataset.rulerReady = "1";

      interactionCleanupRef.current = () => {
        layer.removeEventListener("pointermove", onMove);
        layer.removeEventListener("pointerleave", onLeave);
        layer.removeEventListener("pointerdown", onDown);
        delete layer.dataset.rulerReady;
      };
    },
    [placePin],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm leading-relaxed text-emerald-950">
        <p className="font-medium">
          案内板 PNG を設計サイズ（{widthPx}×{heightPx}）で 1:1 表示しています。
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>
            <strong>5px マス</strong>はこころ予報・投稿画像定規と同じ考え方です（ピンク枠の内側が 5px）。
          </li>
          <li>画像の上にマウスを乗せると、カーソル位置にピンクの四角と座標が出ます。</li>
          <li>クリックでピンを置き、座標をコピーし、アドレスバーに ?x=&amp;y= を反映します。</li>
          <li>
            座標は{" "}
            <code className="rounded bg-white/70 px-1">src/lib/home/homeForestSignLayout.ts</code>{" "}
            を編集してください。
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {HOME_FOREST_SIGN_LAYOUT_VIEWPORTS.map((slide) => {
          const href = buildHomeForestSignLayoutRulerHref({
            viewport: slide.id,
            returnTo: returnTo ?? undefined,
            pin: slide.id === viewport ? (pin ?? undefined) : undefined,
          });
          const active = viewport === slide.id;
          return (
            <Link
              key={slide.id}
              href={href}
              onClick={() => setViewport(slide.id)}
              className={[
                "rounded-md border px-2 py-1 text-xs font-medium transition",
                active
                  ? "border-emerald-600 bg-emerald-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50",
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
          <input type="checkbox" checked={showAnchors} onChange={(e) => setShowAnchors(e.target.checked)} />
          配置アンカー
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showSampleText}
            onChange={(e) => setShowSampleText(e.target.checked)}
          />
          サンプル文字
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLiveOverlay}
            onChange={(e) => setShowLiveOverlay(e.target.checked)}
          />
          本番オーバーレイ
        </label>
      </div>

      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700">
        <div className="flex flex-wrap items-center gap-4">
          <span>カーソル: {cursor ? `x ${cursor.x}, y ${cursor.y}` : "—"}</span>
          <span>クリックピン: {pin ? `x ${pin.x}, y ${pin.y}` : "—"}</span>
          {copyState === "ok" ? <span className="text-emerald-700">座標をコピーしました</span> : null}
          {copyState === "fail" ? <span className="text-red-600">コピー失敗</span> : null}
        </div>
        {pinHref ? (
          <p className="break-all text-[11px] leading-relaxed text-stone-600">
            アドレス:{" "}
            <a href={pinHref} className="text-emerald-800 underline hover:text-emerald-950">
              {pinHref}
            </a>
          </p>
        ) : null}
      </div>

      <AnchorJson anchors={anchors} />

      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-stone-200 p-4">
        <div
          className="relative shrink-0 bg-white shadow-lg"
          style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slideMeta.templateSrc}
              alt=""
              className="absolute inset-0 block h-full w-full"
              draggable={false}
            />

            {showGrid ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gridDataUrl} alt="" className="absolute inset-0 h-full w-full" />
            ) : null}

            {pinRulerDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pinRulerDataUrl} alt="" className="absolute inset-0 h-full w-full" />
            ) : null}

            <div
              className="absolute left-0 top-0 border border-fuchsia-600 bg-fuchsia-400/90"
              style={{
                width: `${HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX}px`,
                height: `${HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX}px`,
              }}
              title="原点の 5px 基準マス"
            />

            {showAnchors
              ? anchors.map((anchor) => <AnchorMarker key={anchor.id} anchor={anchor} />)
              : null}

            {showSampleText
              ? sampleTexts.map((sample) => (
                  <div
                    key={sample.id}
                    className="absolute max-w-[360px] whitespace-pre-wrap"
                    style={{
                      ...homeForestSignPlacementStyle(sample.placement, viewport),
                      fontSize: `${sample.placement.fontSize}px`,
                    }}
                  >
                    {sample.text}
                  </div>
                ))
              : null}

            {showLiveOverlay ? (
              <>
                <HomeForestSignOverlay
                  viewport={viewport}
                  navById={PREVIEW_NAV_BY_ID}
                  primaryNavId="first"
                  preview
                />
                <HomeForestSignLoginNote viewport={viewport} preview />
              </>
            ) : null}
          </div>

          <div
            ref={attachInteractionRef}
            className="absolute inset-0 z-[110] cursor-crosshair touch-none"
            role="presentation"
            aria-label="座標定規（クリックでピン）"
          />

          {cursor ? (
            <RulerSquareMarker
              x={cursor.x}
              y={cursor.y}
              label={`x: ${cursor.x}, y: ${cursor.y}`}
              tone="cursor"
            />
          ) : null}

          {pin ? (
            <RulerSquareMarker
              x={pin.x}
              y={pin.y}
              label={`pin x: ${pin.x}, y: ${pin.y}`}
              tone="pin"
            />
          ) : null}
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
