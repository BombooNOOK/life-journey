import { notFound } from "next/navigation";

import {
  ForestDirectionSignLayoutDebugClient,
  ForestDirectionSignLayoutDebugLinks,
} from "./ForestDirectionSignLayoutDebugClient";

export default function ForestDirectionSignLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">森の一本矢印看板レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          看板 PNG（1024×1024）上の行き先名座標を測ります。値は{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/onboarding/forestDirectionSignLayout.ts</code>{" "}
          を編集してください。
        </p>

        <div className="mt-8">
          <ForestDirectionSignLayoutDebugClient />
        </div>

        <ForestDirectionSignLayoutDebugLinks />
      </div>
    </div>
  );
}
