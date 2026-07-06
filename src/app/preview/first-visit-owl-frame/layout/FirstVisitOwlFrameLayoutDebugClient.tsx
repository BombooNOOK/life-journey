"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { OwlCommentFrameBoard } from "@/components/guide/OwlCommentFrameBoard";
import { FIRST_VISIT_LOGHOUSE_SIGN_LABEL } from "@/lib/onboarding/firstVisitWizard/residentCardCopy";
import { FIRST_VISIT_LOGHOUSE_SIGN_OWL_FRAME_LABEL_PLACEMENT } from "@/lib/onboarding/firstVisitWizard/loghouseSignLayout";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_PLACEMENT,
  firstVisitOwlFrameLabelStyle,
  type FirstVisitOwlFrameLabelPlacement,
} from "@/lib/onboarding/firstVisitResidentRegistrationFrameLayout";
import { FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT } from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";

type OwlFrameLayoutPreset = "loghouse-sign" | "resident-owl";

function resolvePreset(raw: string | null): OwlFrameLayoutPreset {
  return raw === "resident-owl" ? "resident-owl" : "loghouse-sign";
}

/** フクロウ先生コメント枠の文字座標プレビュー（開発時のみ） */
export function FirstVisitOwlFrameLayoutDebugClient() {
  const searchParams = useSearchParams();
  const preset = resolvePreset(searchParams.get("preset"));
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  const { label, placement, layoutFile } = useMemo((): {
    label: string;
    placement: FirstVisitOwlFrameLabelPlacement;
    layoutFile: string;
  } => {
    if (preset === "resident-owl") {
      return {
        label: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT,
        placement: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_PLACEMENT,
        layoutFile: "src/lib/onboarding/firstVisitResidentRegistrationFrameLayout.ts",
      };
    }
    return {
      label: FIRST_VISIT_LOGHOUSE_SIGN_LABEL,
      placement: FIRST_VISIT_LOGHOUSE_SIGN_OWL_FRAME_LABEL_PLACEMENT,
      layoutFile: "src/lib/onboarding/firstVisitWizard/loghouseSignLayout.ts",
    };
  }, [preset]);

  const handleFigureClick = useCallback((coords: { x: number; y: number }) => {
    setPin(coords);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <p className="text-sm text-stone-600">
          枠内をクリックすると設計座標（480 基準）が出ます。基準は{" "}
          <strong>{placement.textAnchor === "center" ? "文字ブロックの中心" : "先頭文字の左上"}</strong>
          （textAnchor: {placement.textAnchor ?? "topleft"}）です。
        </p>
        <div className="relative mx-auto mt-4 max-w-sm">
          <OwlCommentFrameBoard
            label={label}
            placement={placement}
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
            <code className="rounded bg-stone-200 px-1">{layoutFile}</code> の x/y にそのまま入れられます
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">初回導線プレビュー</p>
        <div className="mt-4 max-w-sm">
          <div className="flex w-full flex-col items-center gap-4">
            <OwlCommentFrameBoard label={label} placement={placement} className="max-w-none w-full" />
            <button
              type="button"
              className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white"
            >
              次へ
            </button>
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-stone-500">
          現在の label style（scale=1 想定）:{" "}
          <code className="break-all">{JSON.stringify(firstVisitOwlFrameLabelStyle(placement, 1))}</code>
        </p>
      </div>
    </div>
  );
}

export function FirstVisitOwlFrameLayoutDebugLinks() {
  return (
    <p className="mt-10 flex flex-wrap gap-4 text-sm">
      <Link
        href="/preview/first-visit-owl-frame/layout?preset=loghouse-sign"
        className="text-emerald-800 underline hover:text-emerald-950"
      >
        ログハウス看板（定規）
      </Link>
      <Link
        href="/preview/first-visit-owl-frame/layout?preset=resident-owl"
        className="text-emerald-800 underline hover:text-emerald-950"
      >
        住民登録フクロウ枠（定規）
      </Link>
      <Link href="/preview/first-visit/loghouse-sign" className="text-emerald-800 underline hover:text-emerald-950">
        ログハウス看板プレビュー
      </Link>
      <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
        校正メニューへ
      </Link>
    </p>
  );
}
