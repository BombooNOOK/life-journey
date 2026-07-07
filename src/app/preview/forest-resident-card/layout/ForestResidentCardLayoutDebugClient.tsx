"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { ForestResidentCard } from "@/components/guide/ForestResidentCard";
import {
  FOREST_RESIDENT_CARD_SRC,
} from "@/lib/forestResident/forestResidentAssets";
import { FIRST_VISIT_RESIDENT_CARD_PREVIEW_FIXTURE } from "@/lib/onboarding/firstVisitWizard/residentCardPreviewFixture";
import {
  buildForestResidentCardLayoutGridSvg,
  FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX,
  forestResidentCardLayoutPercent,
  forestResidentCardLayoutRegions,
  forestResidentCardLayoutDebugSnapshot,
  forestResidentCardLayoutCopyHint,
  type ForestResidentCardLayoutPin,
} from "@/lib/forestResident/forestResidentCardLayoutDebug";

export function ForestResidentCardLayoutDebugClient() {
  const [showGrid, setShowGrid] = useState(true);
  const [showRegions, setShowRegions] = useState(true);
  const [cursor, setCursor] = useState<ForestResidentCardLayoutPin | null>(null);
  const [pin, setPin] = useState<ForestResidentCardLayoutPin | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const gridDataUrl = useMemo(() => {
    const svg = buildForestResidentCardLayoutGridSvg();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  const regions = useMemo(() => forestResidentCardLayoutRegions(), []);

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
    const snippet = forestResidentCardLayoutCopyHint({ x, y });
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("fail");
    }
  }, []);

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950">
          <p className="font-medium">住民票テンプレート（720×720）を 1:1 で表示しています。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>クリックで座標（px と %）をコピーできます。</li>
            <li>青枠＝楕円。橙枠＝テキスト行。紫枠＝バッジ画像。緑枠＝「グリーンバッジ」文字。</li>
            <li>
              顔 PNG の見え方は{" "}
              <code className="rounded bg-white/70 px-1">forestResidentFaceTuning</code>（
              objectPosition / scale）で調整します。
            </li>
            <li>
              編集先:{" "}
              <code className="rounded bg-white/70 px-1">src/lib/forestResident/forestResidentAssets.ts</code>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            5px グリッド
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} />
            現在の配置枠
          </label>
        </div>

        <div
          className="relative cursor-crosshair border border-stone-300 bg-[repeating-conic-gradient(#e7e5e4_0%_25%,#fafaf9_0%_50%)] bg-[length:16px_16px]"
          style={{ width: FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX, height: FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          role="presentation"
        >
          <Image
            src={FOREST_RESIDENT_CARD_SRC}
            alt=""
            width={FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX}
            height={FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX}
            className="relative z-10 block"
            unoptimized
          />

          {showGrid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gridDataUrl}
              alt=""
              className="pointer-events-none absolute inset-0 z-20"
              width={FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX}
              height={FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX}
            />
          ) : null}

          {showRegions
            ? regions.map((region) => (
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
              カーソル: x={cursor.x}, y={cursor.y}（{forestResidentCardLayoutPercent(cursor).left}% /{" "}
              {forestResidentCardLayoutPercent(cursor).top}%）
            </p>
          ) : null}
          {pin ? (
            <p>
              クリック: x={pin.x}, y={pin.y} →{" "}
              <code className="rounded bg-stone-200 px-1">{forestResidentCardLayoutCopyHint(pin)}</code>
              {copyState === "ok" ? "（コピーしました）" : null}
              {copyState === "fail" ? "（コピーできませんでした）" : null}
            </p>
          ) : null}
        </div>

        <pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-emerald-100">
          {JSON.stringify(forestResidentCardLayoutDebugSnapshot(), null, 2)}
        </pre>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">実際のカード表示（プレビューと同じ）</p>
        <div className="mt-4 max-w-sm">
          <ForestResidentCard {...FIRST_VISIT_RESIDENT_CARD_PREVIEW_FIXTURE} />
        </div>
        <p className="mt-6 text-xs leading-relaxed text-stone-500">
          サンプル文言: 森の住民 / BN-000802079 / 2026年7月6日
        </p>
      </div>
    </div>
  );
}

export function ForestResidentCardLayoutDebugLinks() {
  return (
    <p className="mt-10 flex flex-wrap gap-4 text-sm">
      <Link href="/preview/first-visit/resident-card" className="text-emerald-800 underline hover:text-emerald-950">
        ← 住民票プレビューへ
      </Link>
      <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
        校正メニューへ
      </Link>
    </p>
  );
}
