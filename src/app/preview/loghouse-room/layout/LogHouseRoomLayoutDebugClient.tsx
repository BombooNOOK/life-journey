"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { LogHouseRoomPreviewClient } from "@/components/orders/loghouse-room/LogHouseRoomPreviewClient";
import {
  LOG_HOUSE_ROOM_MOBILE_BG_SRC,
  LOG_HOUSE_ROOM_SAMPLE_ALL_PARTS_SRC,
} from "@/lib/loghouse/logHouseRoomAssets";
import {
  buildLogHouseRoomLayoutGridSvg,
  logHouseRoomLayoutCopyHint,
  logHouseRoomLayoutDebugSnapshot,
  logHouseRoomLayoutPercent,
  logHouseRoomLayoutPxFromPercent,
  logHouseRoomLayoutRegions,
  LOG_HOUSE_ROOM_LAYOUT_SIZE_PX,
  type LogHouseRoomLayoutPin,
} from "@/lib/loghouse/logHouseRoomLayoutDebug";

export function LogHouseRoomLayoutDebugClient() {
  const [showGrid, setShowGrid] = useState(true);
  const [showSample, setShowSample] = useState(true);
  const [showPartRegions, setShowPartRegions] = useState(true);
  const [showHotspotRegions, setShowHotspotRegions] = useState(true);
  const [cursor, setCursor] = useState<LogHouseRoomLayoutPin | null>(null);
  const [pin, setPin] = useState<LogHouseRoomLayoutPin | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const regions = useMemo(() => logHouseRoomLayoutRegions(), []);
  const partRegions = useMemo(() => regions.filter((r) => r.kind === "part" || r.kind === "rabbit"), [regions]);
  const hotspotRegions = useMemo(() => regions.filter((r) => r.kind === "hotspot"), [regions]);

  const gridDataUrl = useMemo(() => {
    const svg = buildLogHouseRoomLayoutGridSvg();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

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
    const nextPin = { x, y };
    setPin(nextPin);
    const snippet = logHouseRoomLayoutCopyHint(nextPin);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("fail");
    }
  }, []);

  const { widthPx, heightPx } = LOG_HOUSE_ROOM_LAYOUT_SIZE_PX;

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950">
          <p className="font-medium">
            室内背景（{widthPx}×{heightPx}）を 1:1 で表示しています。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>
              <strong>5px マス</strong>はこころ予報の定規と同じ考え方です。
            </li>
            <li>クリックで座標（px と %）をコピーできます。</li>
            <li>実線枠＝家具の見た目（<code className="rounded bg-white/70 px-1">logHouseRoomLayout.ts</code>）。</li>
            <li>点線枠＝タップ領域（<code className="rounded bg-white/70 px-1">logHouseRoomHotspots.ts</code>）。</li>
            <li>
              見本合成は{" "}
              <code className="rounded bg-white/70 px-1">loghouse_room_sample_all_parts.png</code>{" "}
              を半透明で重ねています。
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            5px グリッド
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
            見本合成
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPartRegions}
              onChange={(e) => setShowPartRegions(e.target.checked)}
            />
            家具枠
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showHotspotRegions}
              onChange={(e) => setShowHotspotRegions(e.target.checked)}
            />
            タップ枠
          </label>
        </div>

        <div
          className="relative cursor-crosshair border border-stone-300 bg-[repeating-conic-gradient(#e7e5e4_0%_25%,#fafaf9_0%_50%)] bg-[length:16px_16px]"
          style={{ width: widthPx, height: heightPx }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          role="presentation"
        >
          <Image
            src={LOG_HOUSE_ROOM_MOBILE_BG_SRC}
            alt=""
            width={widthPx}
            height={heightPx}
            className="relative z-10 block"
            unoptimized
          />

          {showSample ? (
            <Image
              src={LOG_HOUSE_ROOM_SAMPLE_ALL_PARTS_SRC}
              alt=""
              width={widthPx}
              height={heightPx}
              className="pointer-events-none absolute inset-0 z-[15] block opacity-45"
              unoptimized
            />
          ) : null}

          {showGrid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gridDataUrl}
              alt=""
              className="pointer-events-none absolute inset-0 z-20"
              width={widthPx}
              height={heightPx}
            />
          ) : null}

          {showPartRegions
            ? partRegions.map((region) => (
                <div
                  key={region.id}
                  className="pointer-events-none absolute z-30 border-2"
                  style={{
                    left: `${region.left}%`,
                    top: `${region.top}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                    backgroundColor: region.color,
                    borderColor: region.border,
                  }}
                  title={region.label}
                >
                  <span className="absolute left-0 top-0 max-w-full truncate bg-white/80 px-1 text-[9px] font-medium text-stone-800">
                    {region.label}
                  </span>
                </div>
              ))
            : null}

          {showHotspotRegions
            ? hotspotRegions.map((region) => (
                <div
                  key={region.id}
                  className="pointer-events-none absolute z-[28] border-2 border-dashed"
                  style={{
                    left: `${region.left}%`,
                    top: `${region.top}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                    backgroundColor: region.color,
                    borderColor: region.border,
                  }}
                  title={region.label}
                />
              ))
            : null}

          {pin ? (
            <div
              className="pointer-events-none absolute z-40 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600 ring-2 ring-white"
              style={{ left: pin.x, top: pin.y }}
            />
          ) : null}
        </div>

        <div className="space-y-2 text-sm text-stone-700">
          {cursor ? (
            <p>
              カーソル: x={cursor.x}, y={cursor.y}（{logHouseRoomLayoutPercent(cursor).x}% /{" "}
              {logHouseRoomLayoutPercent(cursor).y}%）
            </p>
          ) : null}
          {pin ? (
            <p>
              クリック: x={pin.x}, y={pin.y} →{" "}
              <code className="rounded bg-stone-200 px-1">{logHouseRoomLayoutCopyHint(pin)}</code>
              {copyState === "ok" ? "（コピーしました）" : null}
              {copyState === "fail" ? "（コピーできませんでした）" : null}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-600">
          <p className="font-medium text-stone-800">% → px 換算（現在の配置）</p>
          <ul className="mt-2 space-y-1">
            {logHouseRoomLayoutDebugSnapshot().partPlacements.map((placement) => {
              const px = logHouseRoomLayoutPxFromPercent(placement);
              return (
                <li key={placement.id}>
                  <strong>{placement.id}</strong>: ({px.x}, {px.y}) {px.width}×{px.height}px
                </li>
              );
            })}
            <li>
              <strong>rabbit</strong>:{" "}
              {(() => {
                const px = logHouseRoomLayoutPxFromPercent(logHouseRoomLayoutDebugSnapshot().rabbitPlacement);
                return `(${px.x}, ${px.y}) ${px.width}×${px.height}px`;
              })()}
            </li>
          </ul>
        </div>

        <pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-emerald-100">
          {JSON.stringify(logHouseRoomLayoutDebugSnapshot(), null, 2)}
        </pre>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">実際の室内UI（プレビューと同じ）</p>
        <div className="mt-4 max-w-sm">
          <LogHouseRoomPreviewClient layout="framed" />
        </div>
        <p className="mt-6 text-xs leading-relaxed text-stone-500">
          右側は本番コンポーネントです。定規で直した値は保存後にこちらへ即反映されます。
        </p>
      </div>
    </div>
  );
}

export function LogHouseRoomLayoutDebugLinks() {
  return (
    <p className="mt-10 flex flex-wrap gap-4 text-sm">
      <Link href="/preview/loghouse-room" className="text-emerald-800 underline hover:text-emerald-950">
        ← ログハウス室内プレビューへ
      </Link>
      <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
        校正メニューへ
      </Link>
    </p>
  );
}
