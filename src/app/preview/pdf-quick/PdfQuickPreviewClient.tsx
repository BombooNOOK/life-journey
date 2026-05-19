"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEV_PDF_PREVIEW_ENTRIES,
  DEV_PDF_PREVIEW_GROUPS,
  findDevPdfPreviewEntry,
  type DevPdfPreviewEntry,
  type PdfPreviewQuality,
} from "@/lib/pdf/devPdfPreviewCatalog";

function defaultEntryId(): string {
  if (typeof window === "undefined") return "journal-priorities";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash && findDevPdfPreviewEntry(hash)) return hash;
  return "journal-priorities";
}

export function PdfQuickPreviewClient() {
  const [quality, setQuality] = useState<PdfPreviewQuality>("low");
  const [selectedId, setSelectedId] = useState("journal-priorities");
  const [variant, setVariant] = useState<string | undefined>();
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [peko, setPeko] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = defaultEntryId();
    const found = findDevPdfPreviewEntry(id);
    setSelectedId(id);
    setVariant(found?.defaultVariant);
    setHydrated(true);
  }, []);

  const entry = useMemo(
    () => findDevPdfPreviewEntry(selectedId) ?? DEV_PDF_PREVIEW_ENTRIES[0],
    [selectedId],
  );

  const activeVariant = variant ?? entry?.defaultVariant;

  const src = useMemo(() => {
    if (!entry) return "";
    return entry.buildSrc({ quality, variant: activeVariant });
  }, [entry, quality, activeVariant]);

  const bumpFrame = useCallback(() => {
    setLoading(true);
    setPeko(false);
    setFrameKey((k) => k + 1);
    window.setTimeout(() => setPeko(true), 40);
  }, []);

  const selectEntry = useCallback(
    (next: DevPdfPreviewEntry) => {
      setSelectedId(next.id);
      setVariant(next.defaultVariant);
      window.history.replaceState(null, "", `#${next.id}`);
      bumpFrame();
    },
    [bumpFrame],
  );

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      const found = findDevPdfPreviewEntry(id);
      if (found && found.id !== selectedId) {
        setSelectedId(found.id);
        setVariant(found.defaultVariant);
        bumpFrame();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [selectedId, bumpFrame]);

  useEffect(() => {
    if (!hydrated) return;
    bumpFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 品質切替時のみ iframe を差し替え
  }, [quality, hydrated]);

  const onVariantChange = (value: string) => {
    setVariant(value);
    bumpFrame();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-100">
      <header className="shrink-0 border-b border-stone-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-sm font-semibold text-stone-800">PDF サク見</h1>
            <p className="text-xs text-stone-500">左のリンク → 右にペコッと表示（dev のみ）</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QualityToggle quality={quality} onChange={setQuality} />
            <Link
              href="/preview"
              className="text-xs text-stone-600 underline hover:text-stone-900"
            >
              校正メニュー
            </Link>
            {src ? (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
              >
                新しいタブ
              </a>
            ) : null}
          </div>
        </div>
        {entry?.variants?.length ? (
          <div className="mx-auto mt-2 flex w-full max-w-6xl flex-wrap items-center gap-1.5">
            <span className="text-xs text-stone-500">ナンバー:</span>
            {entry.variants.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => onVariantChange(v.value)}
                className={[
                  "rounded px-2 py-0.5 text-xs transition",
                  activeVariant === v.value
                    ? "bg-stone-800 text-white"
                    : "bg-stone-200 text-stone-800 hover:bg-stone-300",
                ].join(" ")}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : null}
        {entry?.note ? (
          <p className="mx-auto mt-1.5 max-w-6xl text-xs text-amber-800">{entry.note}</p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <nav
          className="shrink-0 border-b border-stone-200 bg-white sm:w-56 sm:border-b-0 sm:border-r"
          aria-label="PDF ページ一覧"
        >
          <div className="max-h-40 overflow-y-auto p-2 sm:h-full sm:max-h-[calc(100vh-7rem)]">
            {DEV_PDF_PREVIEW_GROUPS.map((group) => (
              <div key={group} className="mb-3 last:mb-0">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {DEV_PDF_PREVIEW_ENTRIES.filter((e) => e.group === group).map((item) => {
                    const active = item.id === selectedId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectEntry(item)}
                          className={[
                            "w-full rounded-md px-2 py-1.5 text-left text-xs transition",
                            active
                              ? "bg-emerald-600 font-medium text-white shadow-sm"
                              : "text-stone-700 hover:bg-stone-100",
                          ].join(" ")}
                        >
                          {item.label}
                          {item.slow ? (
                            <span
                              className={
                                active
                                  ? "mt-0.5 block text-[10px] text-emerald-100"
                                  : "mt-0.5 block text-[10px] text-stone-400"
                              }
                            >
                              重い
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <section className="relative flex min-h-0 flex-1 flex-col bg-stone-300">
          {loading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-stone-200/80">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-400 border-t-stone-800" />
                <p className="text-xs text-stone-600">PDF を生成しています…</p>
              </div>
            </div>
          ) : null}
          <div
            className={[
              "min-h-0 flex-1 origin-top transition duration-200 ease-out",
              peko ? "scale-100 opacity-100" : "scale-[0.98] opacity-0",
            ].join(" ")}
          >
            {hydrated && src ? (
              <iframe
                key={frameKey}
                title={entry?.label ?? "pdf-preview"}
                src={src}
                className="h-full min-h-[50vh] w-full border-0 sm:min-h-0"
                onLoad={() => setLoading(false)}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function QualityToggle({
  quality,
  onChange,
}: {
  quality: PdfPreviewQuality;
  onChange: (q: PdfPreviewQuality) => void;
}) {
  return (
    <div className="flex rounded-md border border-stone-200 p-0.5 text-xs">
      {(["low", "high"] as const).map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onChange(q)}
          className={[
            "rounded px-2 py-0.5 transition",
            quality === q ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100",
          ].join(" ")}
        >
          {q === "low" ? "速い" : "高精"}
        </button>
      ))}
    </div>
  );
}
