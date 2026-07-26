"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ASHIATO_COMPANION_TEMPLATE_SLUGS,
  ashiatoPageTemplateBackgroundPath,
  ashiatoPageTemplateBodyPathForCompanion,
  ashiatoPageTemplateOptions,
  ashiatoPageTemplatePhotoOverlayPath,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import {
  ASHIATO_LAYOUT_SLOT_COLORS,
  ASHIATO_LAYOUT_SLOT_LABELS,
  ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX,
  ASHIATO_PAGE_TEMPLATE_LAYOUTS,
  ashiatoLayoutGrowFromBottom,
  ashiatoLayoutRectStyle,
  ashiatoLayoutSlotIdsForTemplate,
  isAshiatoPageTemplateLayout,
  type AshiatoLayoutPercentRect,
  type AshiatoLayoutSlotId,
  type AshiatoPageTemplateLayout,
} from "@/lib/journal/ashiatoPageTemplateLayout";
import { ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT } from "@/lib/journal/ashiatoEntryRender";
import { DIARY_PREVIEW_BODY_FONT_FAMILY } from "@/lib/journal/diaryPreviewBodyFont";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";

const DRAFT_STORAGE_KEY = "ashiato-page-template-layout-draft-v7";

const COMPANION_LABELS: Record<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number], string> = {
  drfukuro: "フクロウ",
  harinezumi: "ハリネズミ",
  namakemono: "ナマケモノ",
  risu: "リス",
  kerosion: "ケロシオン",
};

const COMPANION_TYPE_BY_SLUG = {
  drfukuro: "owl",
  harinezumi: "hedgehog",
  namakemono: "sloth",
  risu: "squirrel",
  kerosion: "frog",
} as const;

function clampRect(rect: AshiatoLayoutPercentRect): AshiatoLayoutPercentRect {
  return {
    left: Number(rect.left),
    top: Number(rect.top),
    width: Math.max(1, Number(rect.width)),
    height: Math.max(1, Number(rect.height)),
  };
}

function cloneLayouts(
  source: typeof ASHIATO_PAGE_TEMPLATE_LAYOUTS,
): Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout> {
  return structuredClone(source);
}

function mergeAshiatoLayoutDraft(
  base: Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout>,
  draft: Partial<Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout>>,
): Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout> {
  const out = cloneLayouts(base);
  for (const opt of ashiatoPageTemplateOptions) {
    const partial = draft[opt.id];
    if (!partial || !isAshiatoPageTemplateLayout(partial)) continue;
    out[opt.id] = {
      ...out[opt.id],
      ...partial,
      slots: { ...out[opt.id].slots, ...partial.slots },
    };
  }
  return out;
}

function readStoredDraft(): Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout> | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem("ashiato-page-template-layout-draft-v6");
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<
      Record<AshiatoPageTemplateId, AshiatoPageTemplateLayout>
    >;
    return mergeAshiatoLayoutDraft(ASHIATO_PAGE_TEMPLATE_LAYOUTS, data);
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
      <span className="w-14 shrink-0 font-medium">{label}</span>
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

export function AshiatoTemplatesLayoutDebugClient() {
  const [layouts, setLayouts] = useState(() => cloneLayouts(ASHIATO_PAGE_TEMPLATE_LAYOUTS));
  const [templateId, setTemplateId] = useState<AshiatoPageTemplateId>("mori_enikki");
  const [selected, setSelected] = useState<AshiatoLayoutSlotId>("photo");
  const [showOverlay, setShowOverlay] = useState(true);
  /** レイヤー型の写真枠 PNG。位置合わせは背景優先なので既定オフ */
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [showSample, setShowSample] = useState(true);
  const [soloEditing, setSoloEditing] = useState(false);
  const [pinBottom, setPinBottom] = useState(true);
  const [viewScalePercent, setViewScalePercent] = useState(45);
  const [companionSlug, setCompanionSlug] =
    useState<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number]>("drfukuro");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const templateMeta = ashiatoPageTemplateOptions.find((o) => o.id === templateId)!;
  const layout = layouts[templateId];
  const slotIds = useMemo(() => ashiatoLayoutSlotIdsForTemplate(templateId), [templateId]);

  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) setLayouts(stored);
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(layouts));
    } catch {
      /* ignore */
    }
  }, [draftHydrated, layouts]);

  useEffect(() => {
    if (!slotIds.includes(selected)) {
      setSelected(slotIds[0] ?? "photo");
    }
  }, [slotIds, selected]);

  const selectedRect = layout.slots[selected];

  const isLayeredTemplate = templateMeta.files.kind === "layered";
  const photoOverlaySrc = useMemo(
    () => (isLayeredTemplate ? ashiatoPageTemplatePhotoOverlayPath(templateId) : null),
    [isLayeredTemplate, templateId],
  );

  const bgSrc = useMemo(() => {
    if (isLayeredTemplate) {
      // 位置合わせは罫線・日付枠が見える background を使う（preview は合成で枠が潰れる）
      return (
        ashiatoPageTemplateBackgroundPath(templateId) ??
        ashiatoPageTemplateBodyPathForCompanion(
          templateId,
          COMPANION_TYPE_BY_SLUG[companionSlug],
        )
      );
    }
    return ashiatoPageTemplateBodyPathForCompanion(
      templateId,
      COMPANION_TYPE_BY_SLUG[companionSlug],
    );
  }, [companionSlug, isLayeredTemplate, templateId]);

  const patchSelected = useCallback(
    (patch: Partial<AshiatoLayoutPercentRect>) => {
      setLayouts((prev) => {
        const current = prev[templateId];
        const base = current.slots[selected];
        if (!base) return prev;
        let nextRect = clampRect({ ...base, ...patch });
        if (pinBottom && patch.height != null && patch.top == null) {
          nextRect = ashiatoLayoutGrowFromBottom(base, patch.height);
        }
        return {
          ...prev,
          [templateId]: {
            ...current,
            slots: { ...current.slots, [selected]: nextRect },
          },
        };
      });
    },
    [pinBottom, selected, templateId],
  );

  const nudge = useCallback(
    (key: keyof AshiatoLayoutPercentRect, delta: number) => {
      if (!selectedRect) return;
      patchSelected({ [key]: selectedRect[key] + delta });
    },
    [patchSelected, selectedRect],
  );

  const saveToFile = useCallback(async () => {
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dev/ashiato-page-template-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layouts }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveState("ok");
      setSaveMessage("src/lib/journal/ashiatoPageTemplateLayoutData.ts に保存しました");
    } catch (e) {
      setSaveState("fail");
      setSaveMessage(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }, [layouts]);

  const { widthPx, heightPx } = ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX;
  const viewScale = viewScalePercent / 100;

  const visibleSlotIds = soloEditing ? slotIds.filter((id) => id === selected) : slotIds;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        テンプレを選び、色付き枠を合わせてください。高さ変更は既定で下端固定です。終わったら
        <strong>「この配置をファイルに保存」</strong>
        を押してください（コピペ不要）。本文への本番接続は次の工程です。
      </div>

      <div className="flex flex-wrap gap-2">
        {ashiatoPageTemplateOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTemplateId(opt.id)}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              templateId === opt.id
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {templateMeta.files.kind === "companion" ? (
        <div className="flex flex-wrap gap-2">
          {ASHIATO_COMPANION_TEMPLATE_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCompanionSlug(slug)}
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                companionSlug === slug
                  ? "bg-stone-800 text-white"
                  : "border border-stone-300 bg-white text-stone-700",
              ].join(" ")}
            >
              {COMPANION_LABELS[slug]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs text-stone-700">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} />
          配置枠
        </label>
        {isLayeredTemplate ? (
          <span className="text-stone-500">位置合わせは background です</span>
        ) : null}
        {photoOverlaySrc ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showPhotoOverlay}
              onChange={(e) => setShowPhotoOverlay(e.target.checked)}
            />
            写真枠オーバーレイ
          </label>
        ) : null}
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
          サンプル表示
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={soloEditing} onChange={(e) => setSoloEditing(e.target.checked)} />
          調整中だけ表示
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={pinBottom} onChange={(e) => setPinBottom(e.target.checked)} />
          高さは下端固定
        </label>
        <label className="flex items-center gap-1.5">
          拡大
          <input
            type="range"
            min={25}
            max={100}
            value={viewScalePercent}
            onChange={(e) => setViewScalePercent(Number(e.target.value))}
          />
          <span className="font-mono">{viewScalePercent}%</span>
        </label>
        <span className="font-mono text-stone-500">
          カーソル: {cursor ? `${cursor.x}, ${cursor.y}` : "—"}（px）
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-auto rounded-xl border border-stone-300 bg-stone-200/70 p-3">
          <div
            style={{
              width: widthPx * viewScale,
              height: heightPx * viewScale,
            }}
          >
            <div
              className="relative origin-top-left bg-[#ebe4d4]"
              style={{
                width: widthPx,
                height: heightPx,
                transform: `scale(${viewScale})`,
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCursor({
                  x: Math.round(((e.clientX - rect.left) / rect.width) * widthPx),
                  y: Math.round(((e.clientY - rect.top) / rect.height) * heightPx),
                });
              }}
              onMouseLeave={() => setCursor(null)}
            >
              <Image src={bgSrc} alt="" fill className="object-contain" unoptimized priority />

              {showPhotoOverlay && photoOverlaySrc ? (
                <Image
                  src={photoOverlaySrc}
                  alt=""
                  fill
                  className="pointer-events-none object-contain"
                  unoptimized
                />
              ) : null}

              {showSample && layout.slots.photo ? (
                <div
                  className="pointer-events-none absolute overflow-hidden rounded-sm bg-stone-300/80"
                  style={{
                    ...ashiatoLayoutRectStyle(layout.slots.photo),
                    transform: layout.photoRotateDeg
                      ? `rotate(${layout.photoRotateDeg}deg)`
                      : undefined,
                  }}
                >
                  <div className="flex h-full items-center justify-center text-[11px] text-stone-600">
                    写真
                  </div>
                </div>
              ) : null}

              {showSample && layout.slots.body ? (
                <div
                  className="pointer-events-none absolute overflow-hidden p-1 text-emerald-950/80"
                  style={{
                    ...ashiatoLayoutRectStyle(layout.slots.body),
                    writingMode:
                      layout.bodyWritingMode === "vertical" ? "vertical-rl" : "horizontal-tb",
                    fontFamily: DIARY_PREVIEW_BODY_FONT_FAMILY,
                    fontSize:
                      layout.bodyWritingMode === "vertical"
                        ? `${getDiaryBookEntryV2BodyFontLayout("standard").fontSizePx}px`
                        : "11px",
                    lineHeight:
                      layout.bodyWritingMode === "vertical"
                        ? ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT
                        : undefined,
                  }}
                >
                  {layout.bodyWritingMode === "vertical"
                    ? "きょうのあしあと。短い言葉でも、絵日記のように残せます。"
                    : "きょうのあしあと。余白のあるノートに、今日のできごとを残します。"}
                </div>
              ) : null}

              {showOverlay
                ? visibleSlotIds.map((id) => {
                    const rect = layout.slots[id];
                    if (!rect) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={[
                          "absolute z-20 border-2 border-dashed",
                          selected === id
                            ? "border-fuchsia-600 ring-2 ring-fuchsia-400/70"
                            : "border-stone-700/50",
                        ].join(" ")}
                        style={{
                          ...ashiatoLayoutRectStyle(rect),
                          backgroundColor: ASHIATO_LAYOUT_SLOT_COLORS[id],
                        }}
                        onClick={() => setSelected(id)}
                        title={ASHIATO_LAYOUT_SLOT_LABELS[id]}
                      >
                        <span className="absolute left-0 top-0 max-w-full truncate bg-white/90 px-1 text-[9px] font-medium text-stone-800">
                          {ASHIATO_LAYOUT_SLOT_LABELS[id]}
                        </span>
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-800">{templateMeta.label}</p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              本文: {layout.bodyWritingMode === "vertical" ? "縦書き" : "横書き"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {slotIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px]",
                    selected === id
                      ? "bg-emerald-800 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                  ].join(" ")}
                >
                  {ASHIATO_LAYOUT_SLOT_LABELS[id]}
                </button>
              ))}
            </div>
          </div>

          {selectedRect ? (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-stone-800">
                {ASHIATO_LAYOUT_SLOT_LABELS[selected]}
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
          ) : null}

          <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <Field
              label="回転°"
              value={layout.photoRotateDeg}
              step={0.5}
              onChange={(n) =>
                setLayouts((prev) => ({
                  ...prev,
                  [templateId]: { ...prev[templateId], photoRotateDeg: n },
                }))
              }
            />
            <p className="text-[10px] text-stone-500">写真枠の回転（彩りテンプレ向け）</p>
          </div>

          <button
            type="button"
            onClick={() => void saveToFile()}
            disabled={saveState === "saving"}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-800 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-900 disabled:opacity-60"
          >
            {saveState === "saving" ? "保存中…" : "この配置をファイルに保存"}
          </button>
          {saveMessage ? (
            <p className={saveState === "ok" ? "text-xs text-emerald-800" : "text-xs text-red-700"}>
              {saveMessage}
            </p>
          ) : null}

          <button
            type="button"
            className="text-xs text-stone-600 underline-offset-2 hover:underline"
            onClick={() => setLayouts(cloneLayouts(ASHIATO_PAGE_TEMPLATE_LAYOUTS))}
          >
            ファイルの値に戻す
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-stone-500">
        <Link href="/preview/ashiato-templates" className="underline-offset-2 hover:underline">
          表紙・かたちプレビューへ
        </Link>
        {" · "}
        <Link href="/preview" className="underline-offset-2 hover:underline">
          プレビュー一覧
        </Link>
      </p>
    </div>
  );
}
