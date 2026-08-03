import Link from "next/link";
import { notFound } from "next/navigation";

import { HitoyasumiChairPageClient } from "@/components/orders/HitoyasumiChairPageClient";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

type Props = {
  searchParams: Promise<{ theme?: string; view?: string }>;
};

function parseTheme(raw: string | undefined): LogHouseRoomTimeOfDay | undefined {
  if (raw === "day" || raw === "night") return raw;
  return undefined;
}

export default async function HitoyasumiChairPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const timeOfDayOverride = parseTheme(params.theme);
  const initialScreen = params.view === "browse" ? "browse" : "entrance";
  const themeQuery = timeOfDayOverride ? `theme=${timeOfDayOverride}` : "";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1a1510] px-2 py-2">
      <p className="mb-2 text-center text-[11px] leading-relaxed text-[#d9cbb8]/90">
        スマホ縦枠（おおよそ 9:16）で表示しています。実機は左右いっぱい・上下に余白が出やすいです。
      </p>

      {/* 実機に近い縦長フレーム。横長の Cursor ブラウザでも左右余白を前提にしない */}
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[1.25rem] border border-[#5a4a38] shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
        style={{
          height: "min(860px, calc(100dvh - 5.5rem))",
          aspectRatio: "9 / 16",
          maxWidth: "min(420px, calc((100dvh - 5.5rem) * 9 / 16))",
        }}
      >
        <HitoyasumiChairPageClient
          key={`${initialScreen}-${timeOfDayOverride ?? "auto"}`}
          profileId="preview-hitoyasumi"
          initialScreen={initialScreen}
          timeOfDayOverride={timeOfDayOverride}
          backHref="/preview"
          fillParent
        />
      </div>

      <div className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#d9cbb8]/90 bg-[#fffdf8]/92 px-2 py-1.5 text-xs shadow-md backdrop-blur-[3px]">
        <Link
          href={`/preview/hitoyasumi${themeQuery ? `?${themeQuery}` : ""}`}
          className={`rounded-full px-2.5 py-1 ${initialScreen === "entrance" ? "bg-[#3f3428] text-[#fffaf2]" : "text-[#5c4a3a]"}`}
        >
          入口
        </Link>
        <Link
          href={`/preview/hitoyasumi?view=browse${themeQuery ? `&${themeQuery}` : ""}`}
          className={`rounded-full px-2.5 py-1 ${initialScreen === "browse" ? "bg-[#3f3428] text-[#fffaf2]" : "text-[#5c4a3a]"}`}
        >
          一覧
        </Link>
        <span className="mx-0.5 h-3 w-px bg-[#d9cbb8]" aria-hidden />
        <Link
          href={`/preview/hitoyasumi?theme=day${initialScreen === "browse" ? "&view=browse" : ""}`}
          className={`rounded-full px-2.5 py-1 ${timeOfDayOverride === "day" ? "bg-[#3f3428] text-[#fffaf2]" : "text-[#5c4a3a]"}`}
        >
          昼
        </Link>
        <Link
          href={`/preview/hitoyasumi?theme=night${initialScreen === "browse" ? "&view=browse" : ""}`}
          className={`rounded-full px-2.5 py-1 ${timeOfDayOverride === "night" ? "bg-[#3f3428] text-[#fffaf2]" : "text-[#5c4a3a]"}`}
        >
          夜
        </Link>
        <Link
          href={`/preview/hitoyasumi${initialScreen === "browse" ? "?view=browse" : ""}`}
          className={`rounded-full px-2.5 py-1 ${!timeOfDayOverride ? "bg-[#3f3428] text-[#fffaf2]" : "text-[#5c4a3a]"}`}
        >
          自動
        </Link>
      </div>
    </div>
  );
}
