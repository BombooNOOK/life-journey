"use client";

import Link from "next/link";

import { ForestMapPage } from "@/components/help/ForestMapPage";
import { FOREST_MAP_HOTSPOTS } from "@/lib/help/forestMapHotspots";
import { FOREST_MAP_DESTINATIONS } from "@/lib/help/forestMapDestinations";
import { FOREST_MAP_INTRINSIC } from "@/lib/help/forestMapAssets";

/** 案内図タップ領域の確認・調整用 */
export function ForestMapLayoutDebugClient() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
        <p>
          <strong>案内図タップ領域</strong>の確認。緑枠がタップ範囲です。ずれていたら{" "}
          <code className="rounded bg-amber-100 px-1">src/lib/help/forestMapHotspots.ts</code>{" "}
          を直し、本番反映してください。設計サイズ {FOREST_MAP_INTRINSIC.widthPx}×
          {FOREST_MAP_INTRINSIC.heightPx}。
        </p>
        <p className="mt-1">
          <Link href="/help/forest-map" className="font-medium underline-offset-2 hover:underline">
            本番の案内図
          </Link>
          {" · "}
          <Link
            href="/preview/forest-bookshelf/layout"
            className="font-medium underline-offset-2 hover:underline"
          >
            森の本棚の定規
          </Link>
          {" · "}
          <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
            一覧
          </Link>
        </p>
      </div>

      <ul className="space-y-1 text-xs text-stone-600">
        {FOREST_MAP_HOTSPOTS.map((spot) => (
          <li key={spot.id}>
            <strong>{FOREST_MAP_DESTINATIONS[spot.id].label}</strong>: x={spot.x} y={spot.y} w=
            {spot.width} h={spot.height}
          </li>
        ))}
      </ul>

      <ForestMapPage
        backLink={{ href: "/preview", label: "プレビュー一覧へ戻る" }}
        showHotspotOutlines
        layout="framed"
      />
    </div>
  );
}
