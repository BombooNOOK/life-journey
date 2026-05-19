"use client";

import { useMemo, useState } from "react";

import {
  allDesignPdfNamesForEntry,
  PDF_DESIGN_ASSET_ENTRIES,
  type PdfDesignAssetEntry,
} from "@/lib/pdf/pdfDesignAssetMap";

function assetUrl(file: string, folder: "assets" | "preview") {
  return `/api/dev/booklet-asset?file=${encodeURIComponent(file)}&folder=${folder}`;
}

function PdfListItem({
  entry,
  pdfName,
  selected,
  onSelect,
}: {
  entry: PdfDesignAssetEntry;
  pdfName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
        selected
          ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
          : "border-stone-200 bg-white hover:border-stone-400",
      ].join(" ")}
    >
      <p className="font-mono text-xs text-stone-500">{pdfName}</p>
      <p className="mt-0.5 font-medium text-stone-800">{entry.label}</p>
      {!entry.mergePdfOnly && entry.runtimePng ? (
        <p className="mt-1 font-mono text-xs text-emerald-800">→ {entry.runtimePng}</p>
      ) : null}
      {entry.mergePdfOnly ? (
        <p className="mt-1 text-xs text-amber-800">PDF結合専用（PNGなし）</p>
      ) : null}
    </button>
  );
}

export function PdfDesignMapClient({ orphanPdfs }: { orphanPdfs: string[] }) {
  const [selectedId, setSelectedId] = useState(PDF_DESIGN_ASSET_ENTRIES[0]?.id ?? "");
  const [showPreviewVariant, setShowPreviewVariant] = useState(false);

  const selected = useMemo(
    () => PDF_DESIGN_ASSET_ENTRIES.find((e) => e.id === selectedId) ?? PDF_DESIGN_ASSET_ENTRIES[0],
    [selectedId],
  );

  const pdfButtons = useMemo(() => {
    const items: { entry: PdfDesignAssetEntry; pdfName: string; key: string }[] = [];
    for (const entry of PDF_DESIGN_ASSET_ENTRIES) {
      for (const pdfName of allDesignPdfNamesForEntry(entry)) {
        items.push({ entry, pdfName, key: `${entry.id}:${pdfName}` });
      }
    }
    return items;
  }, []);

  if (!selected) {
    return <p className="text-sm text-stone-600">対応表が空です。</p>;
  }

  const primaryPdf = selected.designPdf ?? selected.designPdfAliases?.[0] ?? null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="space-y-4">
        <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">デザイン元 PDF をクリック</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            PDF 名を選ぶと、右に本番 PNG が表示されます。差し替えは{" "}
            <code className="rounded bg-stone-100 px-1">assets/</code> と{" "}
            <code className="rounded bg-stone-100 px-1">assets-preview/</code> で
            本番は <strong>同名 PNG</strong>、軽量版は <strong>同名の .jpg</strong>（
            <code className="rounded bg-stone-100 px-1">npm run pdf:preview-assets</code>）です。
          </p>
          <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {pdfButtons.map(({ entry, pdfName, key }) => (
              <li key={key}>
                <PdfListItem
                  entry={entry}
                  pdfName={pdfName}
                  selected={selectedId === entry.id}
                  onSelect={() => {
                    setSelectedId(entry.id);
                    setShowPreviewVariant(false);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        {orphanPdfs.length > 0 ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <p className="font-semibold">一覧に未登録の PDF（要確認）</p>
            <ul className="mt-2 list-inside list-disc font-mono">
              {orphanPdfs.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">PNG だけ差し替え（PDFなし）</h2>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {PDF_DESIGN_ASSET_ENTRIES.filter((e) => !e.mergePdfOnly && e.runtimePng).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(entry.id);
                    setShowPreviewVariant(false);
                  }}
                  className={[
                    "w-full rounded px-2 py-1.5 text-left text-xs",
                    selectedId === entry.id ? "bg-emerald-100 font-medium" : "hover:bg-stone-50",
                  ].join(" ")}
                >
                  <span className="font-mono">{entry.runtimePng}</span>
                  <span className="ml-2 text-stone-600">{entry.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{selected.label}</h2>
          {selected.codeConstant ? (
            <p className="mt-1 font-mono text-xs text-stone-500">{selected.codeConstant}</p>
          ) : null}
          {selected.note ? (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{selected.note}</p>
          ) : null}
        </div>

        <dl className="grid gap-2 text-sm">
          <div className="rounded-lg bg-stone-50 px-3 py-2">
            <dt className="text-xs font-medium text-stone-500">本番（製本用）PNG</dt>
            <dd className="mt-0.5 font-mono text-stone-900">
              src/components/pdf/assets/{selected.runtimePng || "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-stone-50 px-3 py-2">
            <dt className="text-xs font-medium text-stone-500">プレビュー用 JPEG（同名ベース）</dt>
            <dd className="mt-0.5 font-mono text-stone-900">
              src/components/pdf/assets-preview/
              {selected.runtimePng
                ? selected.runtimePng.replace(/\.png$/i, ".jpg")
                : "—"}
            </dd>
          </div>
          {primaryPdf ? (
            <div className="rounded-lg bg-stone-50 px-3 py-2">
              <dt className="text-xs font-medium text-stone-500">主なデザイン元 PDF</dt>
              <dd className="mt-0.5 font-mono text-stone-900">src/components/pdf/assets/{primaryPdf}</dd>
            </div>
          ) : null}
        </dl>

        {selected.mergePdfOnly && primaryPdf ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">このページは PNG ではなく PDF をそのまま結合します。</p>
            <iframe
              title={primaryPdf}
              src={assetUrl(primaryPdf, "assets")}
              className="h-[70vh] w-full rounded-lg border border-stone-200 bg-stone-100"
            />
          </div>
        ) : selected.runtimePng ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-stone-600">本番 PNG（assets/）</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(selected.runtimePng, "assets")}
                alt={selected.runtimePng}
                className="mx-auto max-h-[65vh] w-auto max-w-full rounded border border-stone-200 shadow-sm"
              />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-stone-600">プレビュー用（assets-preview/）</p>
                <button
                  type="button"
                  onClick={() => setShowPreviewVariant((v) => !v)}
                  className="rounded border border-stone-300 px-2 py-0.5 text-xs hover:bg-stone-50"
                >
                  {showPreviewVariant ? "隠す" : "表示する"}
                </button>
              </div>
              {showPreviewVariant ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={assetUrl(selected.runtimePng, "preview")}
                  alt={`preview ${selected.runtimePng}`}
                  className="mx-auto max-h-[50vh] w-auto max-w-full rounded border border-dashed border-stone-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).alt = "assets-preview に同名ファイルがありません";
                  }}
                />
              ) : null}
            </div>
            {primaryPdf ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-stone-600">デザイン元 PDF を開く</summary>
                <iframe
                  title={primaryPdf}
                  src={assetUrl(primaryPdf, "assets")}
                  className="mt-2 h-[50vh] w-full rounded-lg border border-stone-200"
                />
              </details>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-stone-500">表示する画像がありません。</p>
        )}
      </div>
    </div>
  );
}