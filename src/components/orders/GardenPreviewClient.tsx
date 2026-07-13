"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GardenMobileImmersive } from "@/components/orders/GardenMobileImmersive";
import { buildGardenPreviewPlant } from "@/lib/garden/gardenPreviewFixture";

/** お庭モバイル没入 — ログイン不要プレビュー（枠表示で庭全体が見える） */
export function GardenPreviewClient() {
  const [stageJump, setStageJump] = useState(0);
  const initialPlant = useMemo(() => buildGardenPreviewPlant(stageJump), [stageJump]);

  return (
    <div className="relative min-h-[100dvh] bg-[#ebe4d4]">
      <div className="mx-auto max-w-md px-3 pb-2 pt-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm">
          <p>
            <strong>プレビュー</strong>（スマホ枠・庭全体表示）。ジョウロを連打すると成長段階を確認できます。
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
            <button
              type="button"
              className="font-medium underline-offset-2 hover:underline"
              onClick={() => setStageJump(0)}
            >
              芽から
            </button>
            <button
              type="button"
              className="font-medium underline-offset-2 hover:underline"
              onClick={() => setStageJump(15)}
            >
              つぼみ付近
            </button>
            <button
              type="button"
              className="font-medium underline-offset-2 hover:underline"
              onClick={() => setStageJump(27)}
            >
              完成直前
            </button>
            <Link
              href="/preview/garden?view=immersive"
              className="font-medium underline-offset-2 hover:underline"
            >
              全画面
            </Link>
            <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
              一覧
            </Link>
          </p>
        </div>
      </div>

      <GardenMobileImmersive
        key={stageJump}
        initialPlant={initialPlant}
        previewMode
        backHref="/preview"
        layout="framed"
      />
    </div>
  );
}
