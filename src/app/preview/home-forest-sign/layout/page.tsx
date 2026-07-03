import Link from "next/link";
import { notFound } from "next/navigation";

import { HomeForestSignLayoutDebugClient } from "./HomeForestSignLayoutDebugClient";
import {
  buildHomeForestSignLayoutRulerHref,
  parseHomeForestSignLayoutPin,
  parseHomeForestSignLayoutReturnTo,
  parseHomeForestSignLayoutViewport,
} from "@/lib/home/homeForestSignLayoutRulerUrls";

type Props = {
  searchParams: Promise<{ returnTo?: string; viewport?: string; x?: string; y?: string }>;
};

export default async function HomeForestSignLayoutPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const returnTo = parseHomeForestSignLayoutReturnTo(params.returnTo);
  const initialViewport = parseHomeForestSignLayoutViewport(params.viewport) ?? "mobile";
  const initialPin = parseHomeForestSignLayoutPin({ x: params.x, y: params.y });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">トップ・森の案内板レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          案内板 PNG と同じ設計座標で測ります。座標は{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/home/homeForestSignLayout.ts</code>{" "}
          を編集してください。
        </p>

        <div className="mt-8">
          <HomeForestSignLayoutDebugClient
            initialViewport={initialViewport}
            initialPin={initialPin}
            returnTo={returnTo}
          />
        </div>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          {returnTo ? (
            <Link href={returnTo} className="text-emerald-800 underline hover:text-emerald-950">
              ← 戻る
            </Link>
          ) : (
            <Link href="/" className="text-emerald-800 underline hover:text-emerald-950">
              ← トップへ
            </Link>
          )}
          <Link
            href={buildHomeForestSignLayoutRulerHref({ viewport: "mobile" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            スマホ
          </Link>
          <Link
            href={buildHomeForestSignLayoutRulerHref({ viewport: "desktop" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            PC
          </Link>
          <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
            校正メニューへ
          </Link>
        </p>
      </div>
    </div>
  );
}
