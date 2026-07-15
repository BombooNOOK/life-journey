"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

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

function clampRect(rect: ForestBookshelfRect): ForestBookshelfRect {
  return {
    left: Number(rect.left),
    top: Number(rect.top),
    width: Math.max(1, Number(rect.width)),
    height: Math.max(1, Number(rect.height)),
  };
}

export function ForestBookshelfLayoutDebugClient() {
  const [showGrid, setShowGrid] = useState(true);
  const [showSample, setShowSample] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showShelfFloors, setShowShelfFloors] = useState(true);
  /** 高さ変更時に下端を固定（上方向へ伸びる） */
  const [pinBottom, setPinBottom] = useState(true);
  const [cursor, setCursor] = useState<ForestBookshelfLayoutPin | null>(null);
  const [pin, setPin] = useState<ForestBookshelfLayoutPin | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const [itemDraft, setItemDraft] = useState(FOREST_BOOKSHELF_ITEM_LAYOUT);
  const [spotDraft, setSpotDraft] = useState(FOREST_BOOKSHELF_SPOT_LAYOUT);
  const [editTarget, setEditTarget] = useState<EditTarget>({
    kind: "item",
    id: "plant",
  });

  const { widthPx, heightPx } = FOREST_BOOKSHELF_LAYOUT_SIZE_PX;
  const padLeft = FOREST_BOOKSHELF_LAYOUT_PAD_LEFT_PX;

  const regions = useMemo(
    () => forestBookshelfLayoutRegions({ items: itemDraft, spots: spotDraft }),
    [itemDraft, spotDraft],
  );
  const itemRegions = useMemo(() => regions.filter((r) => r.kind === "item"), [regions]);
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
      const rect = e.currentTarget.getBoundingClientRect();
      setCursor({
        x: Math.round(e.clientX - rect.left - padLeft),
        y: Math.round(e.clientY - rect.top),
      });
    },
    [padLeft],
  );

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left - padLeft);
      const y = Math.round(e.clientY - rect.top);
      const nextPin = { x, y };
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
    [padLeft],
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

  const resetDrafts = useCallback(() => {
    setItemDraft(FOREST_BOOKSHELF_ITEM_LAYOUT);
    setSpotDraft(FOREST_BOOKSHELF_SPOT_LAYOUT);
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
    <div className="grid gap-10 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-medium">
            本棚本体（{widthPx}×{heightPx}）を 1:1 で表示しています。左に{" "}
            {padLeft}px 余白があり、外ランタンの負座標も測れます。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>
              <strong>5px マス</strong>で位置を確認。クリックで座標（px / %）をコピー。
            </li>
            <li>
              実線枠＝見た目（
              <code className="rounded bg-white/70 px-1">FOREST_BOOKSHELF_ITEM_LAYOUT</code>
              ）。
            </li>
            <li>
              点線枠＝タップ領域（
              <code className="rounded bg-white/70 px-1">FOREST_BOOKSHELF_SPOT_LAYOUT</code>
              ）。
            </li>
            <li>
              左で動かした下書きは、右側の実物プレビューへ<strong>その場で反映</strong>されます。
            </li>
            <li>
              本番・/orders/bookshelf に残すときは「配置スニペットをコピー」→{" "}
              <code className="rounded bg-white/70 px-1">forestBookshelfLayout.ts</code>{" "}
              に貼って保存。
            </li>
            <li>
              <strong>底合わせ</strong>は「下端 %」か棚板スナップを使うと簡単です（高さは維持したまま乗せられます）。
            </li>
            <li>
              見本は{" "}
              <code className="rounded bg-white/70 px-1">bookshelf_sample.png</code>{" "}
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

        <div
          className="relative cursor-crosshair overflow-hidden border border-stone-300 bg-[#ebe2d4]"
          style={{ width: widthPx + padLeft, height: heightPx }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          role="presentation"
        >
          <div className="absolute inset-y-0 right-0" style={{ left: padLeft, width: widthPx }}>
            <Image
              src={FOREST_BOOKSHELF_ASSETS.main}
              alt=""
              width={widthPx}
              height={heightPx}
              className="relative z-10 block"
              unoptimized
            />

            {showSample ? (
              <Image
                src={FOREST_BOOKSHELF_ASSETS.sample}
                alt=""
                width={widthPx}
                height={heightPx}
                className="pointer-events-none absolute inset-0 z-[15] block opacity-40"
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
            ここで動かした枠は左の定規と右の実物プレビューに即反映されます。ファイルへ残すには下のコピー→{" "}
            <code className="rounded bg-stone-100 px-1">forestBookshelfLayout.ts</code>{" "}
            へ貼り付けて保存してください。
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <label className="text-xs text-stone-600">
              種類
              <select
                className="ml-1 rounded border border-stone-300 px-2 py-1"
                value={editTarget.kind}
                onChange={(e) => {
                  const kind = e.target.value as EditTarget["kind"];
                  if (kind === "item") setEditTarget({ kind, id: "plant" });
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
                {(editTarget.kind === "item"
                  ? FOREST_BOOKSHELF_ITEM_IDS
                  : FOREST_BOOKSHELF_SPOT_IDS
                ).map((id) => (
                  <option key={id} value={id}>
                    {FOREST_BOOKSHELF_ITEM_LABELS[id as ForestBookshelfItemId] ?? id}（{id}）
                  </option>
                ))}
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
              onClick={() => void copyPlacement()}
              className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-900"
            >
              配置スニペットをコピー
            </button>
            <button
              type="button"
              onClick={resetDrafts}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              下書きをリセット
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto rounded bg-stone-900 p-2 text-[11px] text-amber-100">
            {forestBookshelfRectSnippet(editTarget.id, editingRect)}
          </pre>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-800">実際の本棚UI（プレビュー）</p>
        <p className="mt-1 text-xs text-stone-500">
          左の下書きがここに即反映されます。永続化は layout.ts への貼り付けが必要です。
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-[#ebe2d4]">
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
