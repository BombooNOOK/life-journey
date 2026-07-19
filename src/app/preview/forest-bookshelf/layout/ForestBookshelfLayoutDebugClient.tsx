"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ForestBookshelfPreviewClient } from "@/components/orders/forest-bookshelf/ForestBookshelfPreviewClient";
import { FOREST_BOOKSHELF_ASSETS } from "@/lib/ljd/forestBookshelfAssets";
import {
  FOREST_BOOKSHELF_ITEM_LAYOUT,
  FOREST_BOOKSHELF_SPOT_LAYOUT,
  type ForestBookshelfItemId,
  type ForestBookshelfRect,
  type ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";
import {
  buildForestBookshelfLayoutGridSvg,
  FOREST_BOOKSHELF_ITEM_IDS,
  FOREST_BOOKSHELF_ITEM_LABELS,
  FOREST_BOOKSHELF_LAYOUT_PAD_LEFT_PX,
  FOREST_BOOKSHELF_LAYOUT_SIZE_PX,
  FOREST_BOOKSHELF_SHELF_FLOOR_Y_PERCENT,
  FOREST_BOOKSHELF_SPOT_IDS,
  forestBookshelfBottomEdge,
  forestBookshelfLayoutCopyHint,
  forestBookshelfLayoutPercent,
  forestBookshelfLayoutPxFromPercent,
  forestBookshelfLayoutRegions,
  forestBookshelfRectGrowFromBottom,
  forestBookshelfRectSnippet,
  forestBookshelfRectWithBottomEdge,
  type ForestBookshelfLayoutPin,
} from "@/lib/ljd/forestBookshelfLayoutDebug";

type EditTarget =
  | { kind: "item"; id: ForestBookshelfItemId }
  | { kind: "spot"; id: ForestBookshelfSpotId };

const DRAFT_STORAGE_KEY = "forest-bookshelf-layout-draft-v2";

/** 今回は描画しない装飾（定規の一覧からも外す） */
const HIDDEN_ITEM_IDS = new Set<ForestBookshelfItemId>([
  "plant",
  "lanternShelf",
  "lanternFloor",
]);

const EDITABLE_ITEM_IDS = FOREST_BOOKSHELF_ITEM_IDS.filter((id) => !HIDDEN_ITEM_IDS.has(id));

function clampRect(rect: ForestBookshelfRect): ForestBookshelfRect {
  return {
    left: Number(rect.left),
    top: Number(rect.top),
    width: Math.max(1, Number(rect.width)),
    height: Math.max(1, Number(rect.height)),
  };
}

function readStoredDraft(): {
  items: typeof FOREST_BOOKSHELF_ITEM_LAYOUT;
  spots: typeof FOREST_BOOKSHELF_SPOT_LAYOUT;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      items?: typeof FOREST_BOOKSHELF_ITEM_LAYOUT;
      spots?: typeof FOREST_BOOKSHELF_SPOT_LAYOUT;
    };
    if (!data.items || !data.spots) return null;
    return {
      items: { ...FOREST_BOOKSHELF_ITEM_LAYOUT, ...data.items },
      spots: { ...FOREST_BOOKSHELF_SPOT_LAYOUT, ...data.spots },
    };
  } catch {
    return null;
  }
}

export function ForestBookshelfLayoutDebugClient() {
  const [showGrid, setShowGrid] = useState(true);
  /** 旧・全体本棚の見本。アップ本体とは構図が違うのでデフォルトOFF */
  const [showSample, setShowSample] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showShelfFloors, setShowShelfFloors] = useState(true);
  /** 高さ変更時に下端を固定（上方向へ伸びる） */
  const [pinBottom, setPinBottom] = useState(true);
  /** Cursor内ブラウザ向け：既定は縮小表示（ページスクロールで全体を見る） */
  const [viewScalePercent, setViewScalePercent] = useState(55);
  const [cursor, setCursor] = useState<ForestBookshelfLayoutPin | null>(null);
  const [pin, setPin] = useState<ForestBookshelfLayoutPin | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [itemDraft, setItemDraft] = useState(FOREST_BOOKSHELF_ITEM_LAYOUT);
  const [spotDraft, setSpotDraft] = useState(FOREST_BOOKSHELF_SPOT_LAYOUT);
  const [editTarget, setEditTarget] = useState<EditTarget>({
    kind: "item",
    id: "kanteiCover",
  });
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) {
      setItemDraft(stored.items);
      setSpotDraft(stored.spots);
    }
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ items: itemDraft, spots: spotDraft }),
      );
    } catch {
      /* ignore quota */
    }
  }, [draftHydrated, itemDraft, spotDraft]);

  const { widthPx, heightPx } = FOREST_BOOKSHELF_LAYOUT_SIZE_PX;
  const padLeft = FOREST_BOOKSHELF_LAYOUT_PAD_LEFT_PX;
  const viewScale = viewScalePercent / 100;
  const stageLogicalW = widthPx + padLeft;
  const stageLogicalH = heightPx;

  const pinFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * stageLogicalW - padLeft);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * stageLogicalH);
      return { x, y };
    },
    [padLeft, stageLogicalH, stageLogicalW],
  );

  const regions = useMemo(
    () => forestBookshelfLayoutRegions({ items: itemDraft, spots: spotDraft }),
    [itemDraft, spotDraft],
  );
  const itemRegions = useMemo(
    () =>
      regions.filter(
        (r) => r.kind === "item" && !HIDDEN_ITEM_IDS.has(r.id as ForestBookshelfItemId),
      ),
    [regions],
  );
  const spotRegions = useMemo(() => regions.filter((r) => r.kind === "spot"), [regions]);

  const gridDataUrl = useMemo(() => {
    const svg = buildForestBookshelfLayoutGridSvg();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);

  const editingRect =
    editTarget.kind === "item" ? itemDraft[editTarget.id] : spotDraft[editTarget.id];

  const setEditingRect = useCallback(
    (next: ForestBookshelfRect) => {
      const rect = clampRect(next);
      if (editTarget.kind === "item") {
        setItemDraft((prev) => ({ ...prev, [editTarget.id]: rect }));
      } else {
        setSpotDraft((prev) => ({ ...prev, [editTarget.id]: rect }));
      }
    },
    [editTarget],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setCursor(pinFromEvent(e));
    },
    [pinFromEvent],
  );

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const nextPin = pinFromEvent(e);
      setPin(nextPin);
      const snippet = forestBookshelfLayoutCopyHint(nextPin);
      try {
        await navigator.clipboard.writeText(snippet);
        setCopyState("ok");
        window.setTimeout(() => setCopyState("idle"), 1500);
      } catch {
        setCopyState("fail");
      }
    },
    [pinFromEvent],
  );

  const copyPlacement = useCallback(async () => {
    const snippet = forestBookshelfRectSnippet(editTarget.id, editingRect);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("fail");
    }
  }, [editTarget.id, editingRect]);

  const saveDraftToFile = useCallback(async () => {
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dev/forest-bookshelf-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemDraft, spots: spotDraft }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; path?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "save failed");
      }
      setSaveState("ok");
      setSaveMessage(`保存しました → ${data.path ?? "forestBookshelfLayout.ts"}`);
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (error) {
      setSaveState("fail");
      setSaveMessage(error instanceof Error ? error.message : "保存に失敗しました");
    }
  }, [itemDraft, spotDraft]);

  const resetDrafts = useCallback(() => {
    setItemDraft(FOREST_BOOKSHELF_ITEM_LAYOUT);
    setSpotDraft(FOREST_BOOKSHELF_SPOT_LAYOUT);
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const bottomEdge = forestBookshelfBottomEdge(editingRect);

  const snapBottomTo = (yPercent: number) => {
    setEditingRect(forestBookshelfRectWithBottomEdge(editingRect, yPercent));
  };

  const nudge = (key: keyof ForestBookshelfRect, delta: number) => {
    if (key === "height" && pinBottom) {
      setEditingRect(
        forestBookshelfRectGrowFromBottom(
          editingRect,
          Number((editingRect.height + delta).toFixed(1)),
        ),
      );
      return;
    }
    if (key === "top" && pinBottom) {
      // top を動かしても高さ維持 → 下端が動く（意図どおり）
      setEditingRect({
        ...editingRect,
        top: Number((editingRect.top + delta).toFixed(1)),
      });
      return;
    }
    setEditingRect({ ...editingRect, [key]: Number((editingRect[key] + delta).toFixed(1)) });
  };

  return (
    <div className="grid gap-10 xl:grid-cols-1">
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-medium">
            合わせるのは空の棚本体（
            <code className="rounded bg-white/70 px-1">bookshelf_main.png</code>
            ）だけです。緑の棚板ラインに、本の下端を乗せてください。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>
              <strong>表示</strong>：下の拡大率で縮小できます。このページ全体は上下スクロールできます（Cursor内ブラウザ向け）。
            </li>
            <li>
              <strong>基準</strong>：あしあと表記のアップ本棚。上部余白は本棚用の部屋背景。
            </li>
            <li>
              「旧・全体見本」は<strong>別構図の古い絵</strong>です。重ねると迷子になるので、通常はOFFのまま。
            </li>
            <li>
              実線枠＝見た目（
              <code className="rounded bg-white/70 px-1">ITEM_LAYOUT</code>
              ）／点線枠＝タップ（
              <code className="rounded bg-white/70 px-1">SPOT_LAYOUT</code>
              ）。
            </li>
            <li>
              終わったら下の<strong className="text-amber-950">「この配置をファイルに保存」</strong>
              を押すだけでOKです（手動コピペ不要）。
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5">
            <span className="font-medium text-stone-700">拡大率</span>
            <select
              value={viewScalePercent}
              onChange={(e) => setViewScalePercent(Number(e.target.value))}
              className="rounded border border-stone-300 bg-white px-1.5 py-1 text-stone-800"
            >
              <option value={45}>45%</option>
              <option value={55}>55%</option>
              <option value={70}>70%</option>
              <option value={85}>85%</option>
              <option value={100}>100%</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            5px グリッド
          </label>
          <label className="flex items-center gap-2" title="古い全体本棚。アップ本体とは別構図です">
            <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
            旧・全体見本（非推奨）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showShelfFloors}
              onChange={(e) => setShowShelfFloors(e.target.checked)}
            />
            棚板ライン
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showItems} onChange={(e) => setShowItems(e.target.checked)} />
            パーツ枠
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showSpots} onChange={(e) => setShowSpots(e.target.checked)} />
            タップ枠
          </label>
        </div>

        <div className="w-full overflow-x-auto overflow-y-visible rounded-xl border border-stone-300 bg-stone-200/60 p-2">
          <div
            style={{
              width: stageLogicalW * viewScale,
              height: stageLogicalH * viewScale,
            }}
          >
            <div
              className="relative cursor-crosshair overflow-hidden border border-stone-400 bg-stone-300"
              style={{
                width: stageLogicalW,
                height: stageLogicalH,
                transform: `scale(${viewScale})`,
                transformOrigin: "top left",
              }}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              role="presentation"
            >
          <div className="absolute inset-0" style={{ left: padLeft, width: widthPx }}>
            <Image
              src={FOREST_BOOKSHELF_ASSETS.background}
              alt=""
              width={widthPx}
              height={heightPx}
              className="absolute inset-0 z-[5] block object-cover object-center"
              unoptimized
            />
            <Image
              src={FOREST_BOOKSHELF_ASSETS.main}
              alt="本棚本体（合わせ先）"
              width={widthPx}
              height={heightPx}
              className="relative z-10 block"
              unoptimized
            />

            {showSample ? (
              <Image
                src={FOREST_BOOKSHELF_ASSETS.sample}
                alt="旧・全体見本（参考のみ・構図不一致）"
                width={widthPx}
                height={heightPx}
                className="pointer-events-none absolute inset-0 z-[15] block opacity-35 mix-blend-normal"
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

            {showShelfFloors
              ? FOREST_BOOKSHELF_SHELF_FLOOR_Y_PERCENT.map((floor) => (
                  <div
                    key={floor.id}
                    className="pointer-events-none absolute z-[25] left-0 right-0 border-t-2 border-dashed border-rose-500/80"
                    style={{ top: `${floor.y}%` }}
                  >
                    <span className="absolute left-1 -translate-y-full bg-rose-600/90 px-1 text-[9px] font-medium text-white">
                      {floor.label} {floor.y}%
                    </span>
                  </div>
                ))
              : null}

            {showItems
              ? itemRegions.map((region) => (
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
                    <span className="absolute left-0 top-0 max-w-full truncate bg-white/85 px-1 text-[9px] font-medium text-stone-800">
                      {region.label}
                    </span>
                  </div>
                ))
              : null}

            {showSpots
              ? spotRegions.map((region) => (
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
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-stone-700">
          {cursor ? (
            <p>
              カーソル: x={cursor.x}, y={cursor.y}（{forestBookshelfLayoutPercent(cursor).x}% /{" "}
              {forestBookshelfLayoutPercent(cursor).y}%）
              {cursor.x < 0 ? " ※本棚左外側" : null}
            </p>
          ) : null}
          {pin ? (
            <p>
              クリック: x={pin.x}, y={pin.y} →{" "}
              <code className="rounded bg-stone-200 px-1">{forestBookshelfLayoutCopyHint(pin)}</code>
              {copyState === "ok" ? "（コピーしました）" : null}
              {copyState === "fail" ? "（コピーできませんでした）" : null}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-stone-900">配置の下書き調整</p>
          <p className="mt-1 text-xs text-stone-500">
            ここで動かした枠は上の定規と下の実物プレビューに即反映されます。「この配置をファイルに保存」で{" "}
            <code className="rounded bg-stone-100 px-1">forestBookshelfLayout.ts</code>{" "}
            を更新できます。
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <label className="text-xs text-stone-600">
              種類
              <select
                className="ml-1 rounded border border-stone-300 px-2 py-1"
                value={editTarget.kind}
                onChange={(e) => {
                  const kind = e.target.value as EditTarget["kind"];
                  if (kind === "item") setEditTarget({ kind, id: "kanteiCover" });
                  else setEditTarget({ kind, id: "kanteiCover" });
                }}
              >
                <option value="item">見た目（item）</option>
                <option value="spot">タップ（spot）</option>
              </select>
            </label>
            <label className="text-xs text-stone-600">
              対象
              <select
                className="ml-1 rounded border border-stone-300 px-2 py-1"
                value={editTarget.id}
                onChange={(e) => {
                  const id = e.target.value;
                  if (editTarget.kind === "item") {
                    setEditTarget({ kind: "item", id: id as ForestBookshelfItemId });
                  } else {
                    setEditTarget({ kind: "spot", id: id as ForestBookshelfSpotId });
                  }
                }}
              >
                {(editTarget.kind === "item" ? EDITABLE_ITEM_IDS : FOREST_BOOKSHELF_SPOT_IDS).map(
                  (id) => (
                    <option key={id} value={id}>
                      {FOREST_BOOKSHELF_ITEM_LABELS[id as ForestBookshelfItemId] ?? id}（{id}）
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["left", "top", "width", "height"] as const).map((key) => (
              <label key={key} className="text-xs text-stone-600">
                {key}
                <div className="mt-1 flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-1.5 py-0.5"
                    onClick={() => nudge(key, -0.5)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step={0.1}
                    value={editingRect[key]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (key === "height" && pinBottom) {
                        setEditingRect(forestBookshelfRectGrowFromBottom(editingRect, value));
                        return;
                      }
                      setEditingRect({
                        ...editingRect,
                        [key]: value,
                      });
                    }}
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-1.5 py-0.5"
                    onClick={() => nudge(key, 0.5)}
                  >
                    ＋
                  </button>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3">
            <label className="flex items-center gap-2 text-xs font-medium text-rose-950">
              <input
                type="checkbox"
                checked={pinBottom}
                onChange={(e) => setPinBottom(e.target.checked)}
              />
              下端を固定して高さ変更（おすすめ）
            </label>
            <p className="mt-1 text-[11px] text-rose-900/80">
              下端は「上からの %」です。棚に乗せるときは、高さを決めたあと下端だけ動かします。
            </p>
            <label className="mt-2 block text-xs text-rose-950">
              下端 %（上から）
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border border-rose-300 bg-white px-1.5 py-0.5"
                  onClick={() => snapBottomTo(Number((bottomEdge - 0.5).toFixed(1)))}
                >
                  −
                </button>
                <input
                  type="number"
                  step={0.1}
                  value={bottomEdge}
                  onChange={(e) => snapBottomTo(Number(e.target.value))}
                  className="w-full rounded border border-rose-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  className="rounded border border-rose-300 bg-white px-1.5 py-0.5"
                  onClick={() => snapBottomTo(Number((bottomEdge + 0.5).toFixed(1)))}
                >
                  ＋
                </button>
              </div>
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FOREST_BOOKSHELF_SHELF_FLOOR_Y_PERCENT.map((floor) => (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => snapBottomTo(floor.y)}
                  className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-950 hover:bg-rose-100"
                >
                  {floor.label}へ
                </button>
              ))}
              {pin ? (
                <button
                  type="button"
                  onClick={() => {
                    const yPct = Number(forestBookshelfLayoutPercent(pin).y);
                    snapBottomTo(yPct);
                  }}
                  className="rounded-full border border-fuchsia-400 bg-fuchsia-50 px-2.5 py-1 text-[11px] font-medium text-fuchsia-950 hover:bg-fuchsia-100"
                >
                  クリック点のYへ下端合わせ
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-[11px] text-stone-500">
            px換算:{" "}
            {(() => {
              const px = forestBookshelfLayoutPxFromPercent(editingRect);
              return `(${px.x}, ${px.y}) ${px.width}×${px.height}`;
            })()}
            {" · "}
            下端 {bottomEdge}%
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveDraftToFile()}
              disabled={saveState === "saving"}
              className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {saveState === "saving" ? "保存中…" : "この配置をファイルに保存"}
            </button>
            <button
              type="button"
              onClick={() => void copyPlacement()}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              1件だけコピー（任意）
            </button>
            <button
              type="button"
              onClick={resetDrafts}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              下書きをリセット
            </button>
          </div>
          {saveMessage ? (
            <p
              className={[
                "mt-2 text-xs",
                saveState === "fail" ? "text-rose-700" : "text-emerald-800",
              ].join(" ")}
            >
              {saveMessage}
            </p>
          ) : (
            <p className="mt-2 text-xs text-stone-500">
              「ファイルに保存」で{" "}
              <code className="rounded bg-stone-100 px-1">forestBookshelfLayout.ts</code>{" "}
              を自動更新します。コピペ作業は不要です。
            </p>
          )}
          {copyState === "ok" ? (
            <p className="mt-1 text-xs text-stone-500">1件コピーしました</p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">実際の本棚UI（枠付きプレビュー）</p>
        <p className="mt-1 text-xs text-stone-500">
          上の下書きがここに即反映されます。終わったら「ファイルに保存」を押してください。
        </p>
        <div className="mt-4 overflow-visible rounded-xl border border-stone-200 bg-[#ebe2d4] p-3">
          <ForestBookshelfPreviewClient
            compact
            itemLayoutOverride={itemDraft}
            spotLayoutOverride={spotDraft}
          />
        </div>
      </div>
    </div>
  );
}

export function ForestBookshelfLayoutDebugLinks() {
  return (
    <p className="mt-10 flex flex-wrap gap-4 text-sm">
      <Link
        href="/preview/forest-bookshelf"
        className="text-amber-900 underline hover:text-amber-950"
      >
        ← 森の本棚プレビューへ
      </Link>
      <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
        校正メニューへ
      </Link>
    </p>
  );
}
