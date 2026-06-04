"use client";

import { useMemo, useState } from "react";

import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";

const CHECKS = [
  { id: "kantei", label: "鑑定コードを確認した" },
  { id: "name", label: "対象者名を確認した" },
  { id: "birth", label: "生年月日を確認した" },
  { id: "base", label: "BASE注文情報と照合した" },
] as const;

export function KanteiBookBindingPrintDownload({
  orderId,
  printHref,
  suggestedFileName,
  kanteiCode,
  fullNameDisplay,
  birthDate,
  baseOrderNumber,
  baseBuyerName,
}: {
  orderId: string;
  printHref: string;
  suggestedFileName?: string;
  kanteiCode: string;
  fullNameDisplay: string;
  birthDate: string;
  baseOrderNumber: string | null;
  baseBuyerName: string | null;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => CHECKS.every((c) => checked[c.id]),
    [checked],
  );

  const previewHref = `/api/orders/${orderId}/pdf?download=0&quality=low`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
        <p className="text-[10px] font-medium text-stone-800">鑑定書PDF（確認用）</p>
        <p className="mt-1 text-[10px] leading-relaxed text-stone-600">
          ブラウザで内容を確認します。ユーザーのダウンロード回数は消費しません。
        </p>
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
        >
          軽量版PDFを確認する
        </a>
      </div>

      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <p className="text-[10px] font-medium text-amber-950">製本用PDF（高画質）— ダウンロード前確認</p>
      <dl className="text-[10px] text-stone-700">
        <div>
          <span className="text-stone-500">鑑定コード: </span>
          <span className="font-mono">{kanteiCode}</span>
        </div>
        <div>
          <span className="text-stone-500">対象者: </span>
          {fullNameDisplay} / {birthDate}
        </div>
        <div>
          <span className="text-stone-500">BASE: </span>
          {baseOrderNumber || "（未入力）"} / {baseBuyerName || "（未入力）"}
        </div>
        <div>
          <span className="text-stone-500">注文ID: </span>
          <span className="font-mono">{orderId}</span>
        </div>
      </dl>
      <ul className="space-y-1">
        {CHECKS.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-800">
              <input
                type="checkbox"
                checked={!!checked[c.id]}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [c.id]: e.target.checked }))
                }
              />
              {c.label}
            </label>
          </li>
        ))}
      </ul>
      {allChecked ? (
        <PdfDownloadButton
          href={printHref}
          label="製本用PDFをダウンロード"
          className="inline-flex rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
          loadingLabel="高画質PDFの生成に1〜3分かかることがあります。"
          suggestedFileName={suggestedFileName}
        />
      ) : (
        <p className="text-[10px] text-stone-500">上記4項目すべてにチェックするとダウンロードできます。</p>
      )}
      </div>
    </div>
  );
}
