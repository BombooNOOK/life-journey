import { notFound } from "next/navigation";

import {
  ForestResidentCardLayoutDebugClient,
  ForestResidentCardLayoutDebugLinks,
} from "./ForestResidentCardLayoutDebugClient";

export default function ForestResidentCardLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">森の住民票レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          テンプレート PNG（720×720）上の顔・テキスト座標を測ります。値は{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/forestResident/forestResidentAssets.ts</code>{" "}
          の <code className="rounded bg-stone-200 px-1">FOREST_RESIDENT_CARD_LAYOUT</code>{" "}
          を編集してください。
        </p>

        <div className="mt-8">
          <ForestResidentCardLayoutDebugClient />
        </div>

        <ForestResidentCardLayoutDebugLinks />
      </div>
    </div>
  );
}
