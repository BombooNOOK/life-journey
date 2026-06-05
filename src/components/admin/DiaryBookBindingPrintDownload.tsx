"use client";

import { useMemo, useState } from "react";

import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { diaryBookPrintPdfFilename } from "@/lib/journal/diaryBookPrintPdfFilename";

const CHECKS = [
  { id: "code", label: "製本コードを確認した" },
  { id: "period", label: "対象期間を確認した" },
  { id: "pages", label: "ページ数を確認した" },
  { id: "base", label: "BASE注文情報と照合した" },
] as const;

export function DiaryBookBindingPrintDownload({
  requestId,
  bindingCode,
  startDate,
  endDate,
  pageCount,
  baseOrderNumber,
  baseBuyerName,
}: {
  requestId: string;
  bindingCode: string;
  startDate: string | null;
  endDate: string | null;
  pageCount: number;
  baseOrderNumber: string | null;
  baseBuyerName: string | null;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => CHECKS.every((c) => checked[c.id]),
    [checked],
  );

  const previewHref = `/api/admin/diary-book-binding/${encodeURIComponent(requestId)}/print-pdf?download=0`;
  const downloadHref = `/api/admin/diary-book-binding/${encodeURIComponent(requestId)}/print-pdf?download=1`;
  const suggestedFileName = diaryBookPrintPdfFilename(bindingCode);

  const periodLabel =
    startDate && endDate ? `${startDate} 〜 ${endDate}` : "（未入力）";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
        <p className="text-[10px] font-medium text-stone-800">製本用PDF（確認用）</p>
        <p className="mt-1 text-[10px] leading-relaxed text-stone-600">
          ブラウザで内容を確認します。生成には数十秒〜数分かかることがあります。
        </p>
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
        >
          PDFを確認する
        </a>
      </div>

      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <p className="text-[10px] font-medium text-amber-950">
          製本用PDF — ダウンロード前確認
        </p>
        <dl className="text-[10px] text-stone-700">
          <div>
            <span className="text-stone-500">製本コード: </span>
            <span className="font-mono">{bindingCode}</span>
          </div>
          <div>
            <span className="text-stone-500">対象期間: </span>
            {periodLabel}
          </div>
          <div>
            <span className="text-stone-500">ページ数: </span>
            {pageCount}
          </div>
          <div>
            <span className="text-stone-500">BASE: </span>
            {baseOrderNumber || "（未入力）"} / {baseBuyerName || "（未入力）"}
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
            href={downloadHref}
            label="製本用PDFをダウンロード"
            className="inline-flex rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
            loadingLabel="製本用PDFの生成に1〜3分かかることがあります。"
            suggestedFileName={suggestedFileName}
          />
        ) : (
          <p className="text-[10px] text-stone-500">
            上記4項目すべてにチェックするとダウンロードできます。
          </p>
        )}
      </div>
    </div>
  );
}
