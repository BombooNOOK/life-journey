"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  moriLogCardFieldForTextSlot,
  moriLogCardTextSlotsForTemplate,
} from "@/lib/journal/moriLog/moriLogCardFields";
import {
  MORI_ASHIATO_LAYOUTS,
  MORI_ASHIATO_LAYOUT_SLOT_COLORS,
  MORI_ASHIATO_LAYOUT_SLOT_LABELS,
  moriAshiatoTextHitBox,
  type MoriAshiatoLayoutCoords,
  type MoriAshiatoLayoutSlotId,
  type MoriAshiatoPhotoCoords,
  type MoriAshiatoTextCoords,
} from "@/lib/journal/social-post-image/moriAshiatoLayoutData";
import {
  MORI_ASHIATO_TEMPLATE_IDS,
  MORI_ASHIATO_TEMPLATES,
  type MoriAshiatoTemplateId,
} from "@/lib/journal/social-post-image/moriAshiatoTemplates";
import { resolveJournalSocialPostDesignSize } from "@/lib/journal/social-post-image/templates";

const DRAFT_STORAGE_KEY = "mori-ashiato-layout-draft-v2";
const TEMPLATE_BASE = "/images/journal-social-post";
const DEMO_PHOTO_SRC = "/images/home-mock/demo-journal-photo.png";

const SAMPLE_DATE = "2026.7.26 (日)";

function isPhotoCoords(value: unknown): value is MoriAshiatoPhotoCoords {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.width === "number" &&
    typeof o.height === "number" &&
    (o.fit === "cover" || o.fit === "contain")
  );
}

function isTextCoords(value: unknown): value is MoriAshiatoTextCoords {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return typeof o.x === "number" && typeof o.y === "number" && typeof o.fontSize === "number";
}

function layoutSlotLabel(
  templateId: MoriAshiatoTemplateId,
  slotId: MoriAshiatoLayoutSlotId,
): string {
  if (slotId === "photo" || slotId === "photo2" || slotId === "photo3" || slotId === "date") {
    return MORI_ASHIATO_LAYOUT_SLOT_LABELS[slotId];
  }
  const field = moriLogCardFieldForTextSlot(templateId, slotId);
  return field?.label ?? MORI_ASHIATO_LAYOUT_SLOT_LABELS[slotId];
}

function layoutSampleText(
  templateId: MoriAshiatoTemplateId,
  slotId: "date" | "title" | "body" | "comment",
): string | null {
  if (slotId === "date") return SAMPLE_DATE;
  return moriLogCardFieldForTextSlot(templateId, slotId)?.placeholder ?? null;
}

function layoutSlotIdsForTemplate(
  templateId: MoriAshiatoTemplateId,
  layout: MoriAshiatoLayoutCoords,
): MoriAshiatoLayoutSlotId[] {
  const ids: MoriAshiatoLayoutSlotId[] = ["photo"];
  if (layout.extraPhotos?.[0]) ids.push("photo2");
  if (layout.extraPhotos?.[1]) ids.push("photo3");
  if (layout.dateScrapbook) ids.push("date");
  ids.push(...moriLogCardTextSlotsForTemplate(templateId));
  return ids;
}

function cloneLayouts(
  source: typeof MORI_ASHIATO_LAYOUTS,
): Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> {
  return structuredClone(source);
}

/** 下書きはテンプレ単位で浅い置換すると photo 等が消えて落ちるので、フィールド単位でマージする */
function mergeLayoutDraft(
  base: Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords>,
  draft: Partial<Record<MoriAshiatoTemplateId, Partial<MoriAshiatoLayoutCoords>>>,
): Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> {
  const out = cloneLayouts(base);
  for (const id of MORI_ASHIATO_TEMPLATE_IDS) {
    const partial = draft[id];
    if (!partial || typeof partial !== "object") continue;
    const current = out[id];
    out[id] = {
      ...current,
      photo: isPhotoCoords(partial.photo) ? clampPhoto(partial.photo) : current.photo,
      extraPhotos: Array.isArray(partial.extraPhotos)
        ? partial.extraPhotos.filter(isPhotoCoords).map(clampPhoto)
        : current.extraPhotos,
      dateScrapbook: isTextCoords(partial.dateScrapbook)
        ? partial.dateScrapbook
        : partial.dateScrapbook === null
          ? undefined
          : current.dateScrapbook,
      title: isTextCoords(partial.title) ? partial.title : current.title,
      body: isTextCoords(partial.body) ? partial.body : current.body,
      comment: isTextCoords(partial.comment) ? partial.comment : current.comment,
    };
  }
  return out;
}

function readStoredDraft(): Record<MoriAshiatoTemplateId, MoriAshiatoLayoutCoords> | null {
  if (typeof window === "undefined") return null;
  try {
    // 旧キーは不完全マージで落ちることがあるため破棄
    window.localStorage.removeItem("mori-ashiato-layout-draft-v1");
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<
      Record<MoriAshiatoTemplateId, Partial<MoriAshiatoLayoutCoords>>
    >;
    return mergeLayoutDraft(MORI_ASHIATO_LAYOUTS, data);
  } catch {
    return null;
  }
}

function clampPhoto(photo: MoriAshiatoPhotoCoords): MoriAshiatoPhotoCoords {
  return {
    ...photo,
    x: Number(photo.x),
    y: Number(photo.y),
    width: Math.max(8, Number(photo.width)),
    height: Math.max(8, Number(photo.height)),
  };
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-stone-700">
      <span className="w-16 shrink-0 font-medium">{label}</span>
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

function getPhotoSlot(
  layout: MoriAshiatoLayoutCoords,
  slot: MoriAshiatoLayoutSlotId,
): MoriAshiatoPhotoCoords | null {
  if (slot === "photo") return layout.photo;
  if (slot === "photo2") return layout.extraPhotos?.[0] ?? null;
  if (slot === "photo3") return layout.extraPhotos?.[1] ?? null;
  return null;
}

function getTextSlot(
  layout: MoriAshiatoLayoutCoords,
  slot: MoriAshiatoLayoutSlotId,
): MoriAshiatoTextCoords | null {
  if (slot === "date") return layout.dateScrapbook ?? null;
  if (slot === "title") return layout.title;
  if (slot === "body") return layout.body;
  if (slot === "comment") return layout.comment;
  return null;
}

type Props = {
  initialTemplate?: MoriAshiatoTemplateId;
};

export function MoriAshiatoLayoutDebugClient({
  initialTemplate = "chiisana_ashiato",
}: Props) {
  const [layouts, setLayouts] = useState(() => cloneLayouts(MORI_ASHIATO_LAYOUTS));
  const [templateId, setTemplateId] = useState<MoriAshiatoTemplateId>(initialTemplate);
  const [selected, setSelected] = useState<MoriAshiatoLayoutSlotId>("photo");
  const [showFrames, setShowFrames] = useState(true);
  const [showDemoPhoto, setShowDemoPhoto] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showSampleText, setShowSampleText] = useState(true);
  const [soloEditing, setSoloEditing] = useState(false);
  const [pinBottom, setPinBottom] = useState(true);
  const [viewScalePercent, setViewScalePercent] = useState(55);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "fail">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const meta = MORI_ASHIATO_TEMPLATES[templateId];
  const layout = layouts[templateId];
  const designSize = resolveJournalSocialPostDesignSize(meta);
  const slotIds = useMemo(
    () => layoutSlotIdsForTemplate(templateId, layout),
    [layout, templateId],
  );
  const viewScale = viewScalePercent / 100;

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

  const patchPhoto = useCallback(
    (slot: MoriAshiatoLayoutSlotId, patch: Partial<MoriAshiatoPhotoCoords>) => {
      setLayouts((prev) => {
        const current = prev[templateId];
        const base = getPhotoSlot(current, slot);
        if (!base) return prev;
        let next = clampPhoto({ ...base, ...patch });
        if (pinBottom && patch.height != null && patch.y == null) {
          const bottom = base.y + base.height;
          next = clampPhoto({ ...next, y: bottom - next.height });
        }
        if (slot === "photo") {
          return { ...prev, [templateId]: { ...current, photo: next } };
        }
        const extras = [...(current.extraPhotos ?? [])];
        const index = slot === "photo2" ? 0 : 1;
        extras[index] = next;
        return { ...prev, [templateId]: { ...current, extraPhotos: extras } };
      });
    },
    [pinBottom, templateId],
  );

  const patchText = useCallback(
    (slot: MoriAshiatoLayoutSlotId, patch: Partial<MoriAshiatoTextCoords>) => {
      setLayouts((prev) => {
        const current = prev[templateId];
        const base = getTextSlot(current, slot);
        if (!base) return prev;
        const next = { ...base, ...patch };
        if (slot === "date") {
          return { ...prev, [templateId]: { ...current, dateScrapbook: next } };
        }
        if (slot === "title") {
          return { ...prev, [templateId]: { ...current, title: next } };
        }
        if (slot === "body") {
          return { ...prev, [templateId]: { ...current, body: next } };
        }
        return { ...prev, [templateId]: { ...current, comment: next } };
      });
    },
    [templateId],
  );

  const selectedPhoto = getPhotoSlot(layout, selected);
  const selectedText = getTextSlot(layout, selected);

  const nudgePhoto = useCallback(
    (key: keyof MoriAshiatoPhotoCoords, delta: number) => {
      if (!selectedPhoto || typeof selectedPhoto[key] !== "number") return;
      patchPhoto(selected, { [key]: (selectedPhoto[key] as number) + delta });
    },
    [patchPhoto, selected, selectedPhoto],
  );

  const nudgeText = useCallback(
    (key: "x" | "y" | "fontSize", delta: number) => {
      if (!selectedText) return;
      patchText(selected, { [key]: selectedText[key] + delta });
    },
    [patchText, selected, selectedText],
  );

  const saveToFile = useCallback(async () => {
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dev/mori-ashiato-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layouts }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; path?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "save failed");
      }
      setSaveState("ok");
      setSaveMessage(
        `保存しました → ${data.path ?? "moriAshiatoLayoutData.ts"}（本番反映は別途）`,
      );
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (e) {
      setSaveState("fail");
      setSaveMessage(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }, [layouts]);

  const visibleSlotIds = soloEditing ? slotIds.filter((id) => id === selected) : slotIds;
  const bgSrc = `${TEMPLATE_BASE}/${meta.backgroundFile}`;
  const overlaySrc = meta.photoOverlayFile
    ? `${TEMPLATE_BASE}/${meta.photoOverlayFile}`
    : null;

  const photosForDemo = useMemo(() => {
    const list = [layout.photo, ...(layout.extraPhotos ?? [])].filter(isPhotoCoords);
    return list;
  }, [layout]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        テンプレを選び、色付き枠を合わせてください。高さ変更は既定で下端固定です。終わったら
        <strong>「この配置をファイルに保存」</strong>
        を押してください（コピペ不要）。座標は{" "}
        <code className="rounded bg-white/70 px-1">moriAshiatoLayoutData.ts</code> に書き込まれます。
      </div>

      <div className="flex flex-wrap gap-2">
        {MORI_ASHIATO_TEMPLATE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTemplateId(id)}
            className={[
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              templateId === id
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            {MORI_ASHIATO_TEMPLATES[id].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-stone-700">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showFrames} onChange={(e) => setShowFrames(e.target.checked)} />
          配置枠
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showDemoPhoto}
            onChange={(e) => setShowDemoPhoto(e.target.checked)}
          />
          デモ写真
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showOverlay}
            onChange={(e) => setShowOverlay(e.target.checked)}
            disabled={!overlaySrc}
          />
          オーバーレイ
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showSampleText}
            onChange={(e) => setShowSampleText(e.target.checked)}
          />
          サンプル文字
        </label>
        <label className="flex items-center gap-1.5 rounded-lg border border-fuchsia-300 bg-fuchsia-50 px-2 py-1 font-medium text-fuchsia-950">
          <input
            type="checkbox"
            checked={soloEditing}
            onChange={(e) => setSoloEditing(e.target.checked)}
          />
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
          {designSize.widthPx}×{designSize.heightPx}　カーソル:{" "}
          {cursor ? `${cursor.x}, ${cursor.y}` : "—"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-auto rounded-xl border border-stone-300 bg-stone-200/70 p-3">
          <div
            style={{
              width: designSize.widthPx * viewScale,
              height: designSize.heightPx * viewScale,
            }}
          >
            <div
              className="relative origin-top-left bg-white"
              style={{
                width: designSize.widthPx,
                height: designSize.heightPx,
                transform: `scale(${viewScale})`,
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCursor({
                  x: Math.round(((e.clientX - rect.left) / rect.width) * designSize.widthPx),
                  y: Math.round(((e.clientY - rect.top) / rect.height) * designSize.heightPx),
                });
              }}
              onMouseLeave={() => setCursor(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bgSrc} alt="" className="absolute inset-0 h-full w-full" draggable={false} />

              {showDemoPhoto
                ? photosForDemo.map((photo, index) => (
                    <div
                      key={`demo-${index}`}
                      className="pointer-events-none absolute overflow-hidden"
                      style={{
                        left: photo.x,
                        top: photo.y,
                        width: photo.width,
                        height: photo.height,
                        borderRadius: photo.borderRadiusPx,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={DEMO_PHOTO_SRC}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                  ))
                : null}

              {showOverlay && overlaySrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={overlaySrc}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  draggable={false}
                />
              ) : null}

              {showSampleText
                ? (["date", "title", "body", "comment"] as const).map((slot) => {
                    const style = getTextSlot(layout, slot);
                    if (!style || style.fontSize <= 1) return null;
                    const text = layoutSampleText(templateId, slot);
                    if (!text) return null;
                    return (
                      <div
                        key={`sample-${slot}`}
                        className="pointer-events-none absolute max-w-[360px]"
                        style={{
                          left: style.x,
                          top: style.y,
                          color: style.fill ?? "#4a3728",
                          fontSize: style.fontSize,
                          fontWeight: style.fontWeight ?? 400,
                          lineHeight: style.lineHeight ? `${style.lineHeight}px` : 1.4,
                          transform:
                            style.textAnchor === "middle" ? "translate(-50%, 0)" : undefined,
                          textAlign: style.textAnchor === "middle" ? "center" : "left",
                        }}
                      >
                        {text}
                      </div>
                    );
                  })
                : null}

              {showFrames
                ? visibleSlotIds.map((id) => {
                    const photo = getPhotoSlot(layout, id);
                    if (photo) {
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
                            left: photo.x,
                            top: photo.y,
                            width: photo.width,
                            height: photo.height,
                            borderRadius: photo.borderRadiusPx,
                            backgroundColor: MORI_ASHIATO_LAYOUT_SLOT_COLORS[id],
                          }}
                          onClick={() => setSelected(id)}
                          title={layoutSlotLabel(templateId, id)}
                        >
                          <span className="absolute left-0 top-0 max-w-full truncate bg-white/90 px-1 text-[9px] font-medium text-stone-800">
                            {layoutSlotLabel(templateId, id)}
                          </span>
                        </button>
                      );
                    }
                    const text = getTextSlot(layout, id);
                    if (!text) return null;
                    const box = moriAshiatoTextHitBox(text);
                    const label = layoutSlotLabel(templateId, id);
                    return (
                      <button
                        key={id}
                        type="button"
                        className={[
                          "absolute z-20 border-2 border-dashed",
                          selected === id
                            ? "border-fuchsia-600 ring-2 ring-fuchsia-400/70"
                            : "border-stone-700/40",
                        ].join(" ")}
                        style={{
                          left: box.left,
                          top: box.top,
                          width: box.width,
                          height: box.height,
                          backgroundColor: MORI_ASHIATO_LAYOUT_SLOT_COLORS[id],
                        }}
                        onClick={() => setSelected(id)}
                        title={label}
                      >
                        <span className="absolute left-0 top-0 max-w-full truncate bg-white/90 px-1 text-[9px] font-medium text-stone-800">
                          {label}
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
            <p className="text-xs font-semibold text-stone-800">{meta.label}</p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              設計 {designSize.widthPx}×{designSize.heightPx}px
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
                  {layoutSlotLabel(templateId, id)}
                </button>
              ))}
            </div>
          </div>

          {selectedPhoto ? (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-stone-800">
                {layoutSlotLabel(templateId, selected)}
              </p>
              <Field label="x" value={selectedPhoto.x} onChange={(n) => patchPhoto(selected, { x: n })} />
              <Field label="y" value={selectedPhoto.y} onChange={(n) => patchPhoto(selected, { y: n })} />
              <Field
                label="width"
                value={selectedPhoto.width}
                onChange={(n) => patchPhoto(selected, { width: n })}
              />
              <Field
                label="height"
                value={selectedPhoto.height}
                onChange={(n) => patchPhoto(selected, { height: n })}
              />
              <Field
                label="角丸"
                value={selectedPhoto.borderRadiusPx ?? 0}
                onChange={(n) => patchPhoto(selected, { borderRadiusPx: n })}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgePhoto("x", -2)}>
                  ← 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgePhoto("x", 2)}>
                  → 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgePhoto("y", -2)}>
                  ↑ 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgePhoto("y", 2)}>
                  ↓ 2
                </button>
              </div>
            </div>
          ) : null}

          {selectedText ? (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-stone-800">
                {layoutSlotLabel(templateId, selected)}
              </p>
              <Field label="x" value={selectedText.x} onChange={(n) => patchText(selected, { x: n })} />
              <Field label="y" value={selectedText.y} onChange={(n) => patchText(selected, { y: n })} />
              <Field
                label="fontSize"
                value={selectedText.fontSize}
                onChange={(n) => patchText(selected, { fontSize: n })}
              />
              <Field
                label="字/行"
                value={selectedText.maxCharsPerLine ?? 18}
                onChange={(n) => patchText(selected, { maxCharsPerLine: n })}
              />
              <Field
                label="行数"
                value={selectedText.maxLines ?? 1}
                onChange={(n) => patchText(selected, { maxLines: n })}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgeText("x", -2)}>
                  ← 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgeText("x", 2)}>
                  → 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgeText("y", -2)}>
                  ↑ 2
                </button>
                <button type="button" className="rounded border px-2 py-1.5 text-xs" onClick={() => nudgeText("y", 2)}>
                  ↓ 2
                </button>
              </div>
            </div>
          ) : null}

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
            onClick={() => {
              setLayouts(cloneLayouts(MORI_ASHIATO_LAYOUTS));
              try {
                window.localStorage.removeItem(DRAFT_STORAGE_KEY);
              } catch {
                /* ignore */
              }
            }}
          >
            ファイルの値に戻す
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-stone-500">
        <Link
          href="/preview/journal-social-post-image"
          className="underline-offset-2 hover:underline"
        >
          投稿画像プレビューへ
        </Link>
        {" · "}
        <Link
          href="/preview/journal-social-post-image/layout?template=sns02"
          className="underline-offset-2 hover:underline"
        >
          sns02/03 の旧定規
        </Link>
        {" · "}
        <Link href="/preview" className="underline-offset-2 hover:underline">
          プレビュー一覧
        </Link>
      </p>
    </div>
  );
}
