"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ForestDirectionSignBoard } from "@/components/guide/ForestDirectionSignBoard";
import {
  FOREST_DIRECTION_SIGN_LABEL_PLACEMENT,
  forestDirectionSignLabelStyle,
} from "@/lib/onboarding/forestDirectionSignLayout";
import { FIRST_VISIT_KANTEI_HALL_BODY, FIRST_VISIT_KANTEI_HALL_SIGN_LABEL } from "@/lib/onboarding/firstVisitWizard/kanteiHallCopy";

const SAMPLE_LABEL = FIRST_VISIT_KANTEI_HALL_SIGN_LABEL;

/** 看板ラベル座標の微調整プレビュー（開発時のみ） */
export function ForestDirectionSignLayoutDebugClient() {
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const placement = FOREST_DIRECTION_SIGN_LABEL_PLACEMENT;

  const handleFigureClick = useCallback((coords: { x: number; y: number }) => {
    setPin(coords);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <p className="text-sm text-stone-600">
          看板をクリックすると設計座標（1024 基準）が出ます。基準は{" "}
          <strong>「鑑」の字の左上</strong>（textAnchor: topleft）です。
        </p>
        <div className="relative mx-auto mt-4 max-w-sm">
          <ForestDirectionSignBoard
            label={SAMPLE_LABEL}
            className="max-w-none"
            onFigureClick={handleFigureClick}
            debugPin={pin}
          />
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-emerald-100">
          {JSON.stringify(placement, null, 2)}
        </pre>
        {pin ? (
          <p className="mt-2 text-sm text-stone-700">
            クリック位置: x={pin.x}, y={pin.y} —{" "}
            <code className="rounded bg-stone-200 px-1">forestDirectionSignLayout.ts</code> の x/y にそのまま入れられます
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">初回導線（カードなし）</p>
        <div className="mt-4 max-w-sm">
          <div className="flex w-full flex-col items-center gap-4">
            <ForestDirectionSignBoard label={SAMPLE_LABEL} className="max-w-none w-full" />
            <div className="w-full space-y-3">
              <p className="whitespace-pre-line text-center text-base leading-relaxed text-stone-700">
                {FIRST_VISIT_KANTEI_HALL_BODY}
              </p>
              <button
                type="button"
                className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-stone-500">
          現在の label style（scale=1 想定）:{" "}
          <code className="break-all">{JSON.stringify(forestDirectionSignLabelStyle(placement, 1))}</code>
        </p>
      </div>
    </div>
  );
}

export function ForestDirectionSignLayoutDebugLinks() {
  return (
    <p className="mt-10 flex flex-wrap gap-4 text-sm">
      <Link href="/guide/first/kantei-ready" className="text-emerald-800 underline hover:text-emerald-950">
        ← 鑑定のへや案内（本番）
      </Link>
      <Link
        href="/preview/first-visit-owl-frame/layout?preset=loghouse-sign"
        className="text-emerald-800 underline hover:text-emerald-950"
      >
        ログハウス看板（フクロウ枠定規）
      </Link>
      <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
        校正メニューへ
      </Link>
    </p>
  );
}
