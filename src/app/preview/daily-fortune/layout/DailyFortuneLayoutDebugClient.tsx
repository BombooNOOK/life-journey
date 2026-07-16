"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DailyFortunePageClient } from "@/components/orders/daily-fortune/DailyFortunePageClient";
import { resolveDailyFortuneColorAsset } from "@/lib/ljd/dailyFortuneColors";
import { DAILY_FORTUNE_GUIDES } from "@/lib/ljd/dailyFortuneGuides";
import {
  DAILY_FORTUNE_LAYOUT,
  DAILY_FORTUNE_LAYOUT_SLOT_IDS,
  DAILY_FORTUNE_LAYOUT_SLOT_LABELS,
  dailyFortuneRectStyle,
  type DailyFortuneLayoutSlotId,
  type DailyFortunePercentRect,
} from "@/lib/ljd/dailyFortuneLayout";

const DRAFT_STORAGE_KEY = "daily-fortune-layout-draft-v1";

const SLOT_COLORS: Record<DailyFortuneLayoutSlotId, string> = {
  guideCharacter: "rgba(56, 189, 248, 0.28)",
  guideText: "rgba(251, 191, 36, 0.32)",
  message: "rgba(52, 211, 153, 0.28)",
  colorLabel: "rgba(248, 113, 113, 0.28)",
  colorPalette: "rgba(167, 139, 250, 0.28)",
  colorMotif: "rgba(244, 114, 182, 0.28)",
  smallAction: "rgba(45, 212, 191, 0.28)",
  themeButton: "rgba(251, 146, 60, 0.35)",
};

function clampRect(rect: DailyFortunePercentRect): DailyFortunePercentRect {
  return {
    left: Number(rect.left),
    top: Number(rect.top),
    width: Math.max(1, Number(rect.width)),
    height: Math.max(1, Number(rect.height)),
  };
}

function readStoredDraft(): Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect>>;
    return { ...DAILY_FORTUNE_LAYOUT, ...data };
  } catch {
    return null;
  }
}

function Field({
  label,
  value,
  onChange,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-stone-700">
      <span className="w-12 shrink-0 font-medium">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-stone-300 bg-white px-2 py-1.5"
      />
    </label>
  );
}

export function DailyFortuneLayoutDebugClient() {
  const [draft, setDraft] = useState(DAILY_FORTUNE_LAYOUT);
  const [selected, setSelected] = useState<DailyFortuneLayoutSlotId>("message");
  const [showOverlay, setShowOverlay] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) setDraft(stored);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  const selectedRect = draft[selected];
  const guide = DAILY_FORTUNE_GUIDES.find((g) => g.id === "kerosion")!;
  const color = useMemo(() => resolveDailyFortuneColorAsset("オレンジ・茶"), []);

  const patchSelected = useCallback(
    (patch: Partial<DailyFortunePercentRect>) => {
      setDraft((prev) => ({
        ...prev,
        [selected]: clampRect({ ...prev[selected], ...patch }),
      }));
    },
    [selected],
  );

  const nudge = useCallback(
    (key: keyof DailyFortunePercentRect, delta: number) => {
      patchSelected({ [key]: selectedRect[key] + delta });
    },
    [patchSelected, selectedRect],
  );

  const saveToFile = useCallback(async () => {
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dev/daily-fortune-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: draft }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveState("ok");
      setSaveMessage("src/lib/ljd/dailyFortuneLayout.ts に保存しました");
    } catch (e) {
      setSaveState("fail");
      setSaveMessage(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }, [draft]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        枠を選んで数値を動かし、文字や画像の位置を合わせてください。終わったら
        <strong>「この配置をファイルに保存」</strong>
        を押すとコピペ不要で反映されます。
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-stone-300 bg-[#ebe4d4] shadow-sm">
          <DailyFortunePageClient
            guide={guide}
            message="今日は、やわらかな整え方が力になりやすい日"
            smallAction="誰かにやさしい言葉をかける"
            color={color}
            yearTheme={{ title: "今年のテーマ", headline: "土台づくり", body: "サンプル" }}
            monthTheme={{ title: "今月のテーマ", headline: "やさしい一歩", body: "サンプル" }}
            layoutOverride={draft}
            hideChrome
            fillParent
            stageOverlay={
              showOverlay ? (
                <>
                  {DAILY_FORTUNE_LAYOUT_SLOT_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={[
                        "absolute z-20 border border-dashed",
                        selected === id
                          ? "border-amber-700 ring-2 ring-amber-400/70"
                          : "border-stone-700/40",
                      ].join(" ")}
                      style={{
                        ...dailyFortuneRectStyle(draft[id]),
                        backgroundColor: SLOT_COLORS[id],
                      }}
                      onClick={() => setSelected(id)}
                      title={DAILY_FORTUNE_LAYOUT_SLOT_LABELS[id]}
                    />
                  ))}
                </>
              ) : null
            }
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-800">編集する枠</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DAILY_FORTUNE_LAYOUT_SLOT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px]",
                    selected === id
                      ? "bg-amber-700 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                  ].join(" ")}
                >
                  {DAILY_FORTUNE_LAYOUT_SLOT_LABELS[id]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-800">
              {DAILY_FORTUNE_LAYOUT_SLOT_LABELS[selected]}
            </p>
            <Field label="left" value={selectedRect.left} onChange={(n) => patchSelected({ left: n })} />
            <Field label="top" value={selectedRect.top} onChange={(n) => patchSelected({ top: n })} />
            <Field
              label="width"
              value={selectedRect.width}
              onChange={(n) => patchSelected({ width: n })}
            />
            <Field
              label="height"
              value={selectedRect.height}
              onChange={(n) => patchSelected({ height: n })}
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudge("left", -0.5)}>
                ← 0.5
              </button>
              <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudge("left", 0.5)}>
                → 0.5
              </button>
              <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudge("top", -0.5)}>
                ↑ 0.5
              </button>
              <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudge("top", 0.5)}>
                ↓ 0.5
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
            />
            枠オーバーレイを表示
          </label>

          <button
            type="button"
            onClick={() => void saveToFile()}
            disabled={saveState === "saving"}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-800 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-900 disabled:opacity-60"
          >
            {saveState === "saving" ? "保存中…" : "この配置をファイルに保存"}
          </button>
          {saveMessage ? (
            <p
              className={[
                "text-xs",
                saveState === "ok" ? "text-emerald-800" : "text-red-700",
              ].join(" ")}
            >
              {saveMessage}
            </p>
          ) : null}

          <button
            type="button"
            className="text-xs text-stone-600 underline-offset-2 hover:underline"
            onClick={() => setDraft(DAILY_FORTUNE_LAYOUT)}
          >
            ファイルの値に戻す
          </button>
        </div>
      </div>
    </div>
  );
}

export function DailyFortuneLayoutDebugLinks() {
  return (
    <p className="mt-8 text-sm text-stone-600">
      <Link href="/preview/daily-fortune" className="text-emerald-800 underline hover:text-emerald-950">
        今日の鑑定結果プレビュー
      </Link>
      {" · "}
      <Link href="/preview" className="text-emerald-800 underline hover:text-emerald-950">
        プレビュー一覧
      </Link>
    </p>
  );
}
