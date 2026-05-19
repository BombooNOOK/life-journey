import { readdir } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import {
  allDesignPdfNamesForEntry,
  PDF_DESIGN_ASSET_ENTRIES,
} from "@/lib/pdf/pdfDesignAssetMap";

import { PdfDesignMapClient } from "./PdfDesignMapClient";

const ASSETS_DIR = path.join(process.cwd(), "src/components/pdf/assets");

async function listOrphanDesignPdfs(): Promise<string[]> {
  let files: string[];
  try {
    files = await readdir(ASSETS_DIR);
  } catch {
    return [];
  }

  const mapped = new Set<string>();
  for (const entry of PDF_DESIGN_ASSET_ENTRIES) {
    for (const name of allDesignPdfNamesForEntry(entry)) {
      mapped.add(name);
    }
  }

  return files
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .filter((f) => !mapped.has(f))
    .sort((a, b) => a.localeCompare(b, "ja"));
}

export default async function PdfDesignMapPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800">
        <div className="mx-auto max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">PDF ↔ PNG 対応表</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            このプレビューは <code className="rounded bg-stone-100 px-1">npm run dev</code>{" "}
            の開発モードでのみ利用できます。
          </p>
          <p className="mt-4">
            <Link href="/preview" className="text-sm text-stone-700 underline hover:text-stone-900">
              ← 校正メニューへ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const orphanPdfs = await listOrphanDesignPdfs();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-stone-800">鑑定書アセット：PDF ↔ PNG 対応表</h1>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              左のデザイン元 PDF をクリックすると、右に本番で使う PNG が表示されます。
            </p>
          </div>
          <Link href="/preview" className="text-sm text-stone-600 underline hover:text-stone-900">
            ← 校正メニュー
          </Link>
        </div>
      </header>
      <main className="px-4 py-6">
        <PdfDesignMapClient orphanPdfs={orphanPdfs} />
      </main>
    </div>
  );
}
