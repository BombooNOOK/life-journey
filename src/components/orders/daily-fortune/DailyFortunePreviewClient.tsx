"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DailyFortunePageClient } from "@/components/orders/daily-fortune/DailyFortunePageClient";
import { resolveDailyFortuneColorAsset } from "@/lib/ljd/dailyFortuneColors";
import {
  DAILY_FORTUNE_GUIDES,
  type DailyFortuneGuide,
} from "@/lib/ljd/dailyFortuneGuides";
import { GUARDIAN_COLORS } from "@/lib/kantei/todayHintContent";

const PREVIEW_MESSAGE = "今日は、やわらかな整え方が力になりやすい日";
const PREVIEW_SMALL_ACTION = "誰かにやさしい言葉をかける";

function resolveGuide(raw: string | null): DailyFortuneGuide {
  const found = DAILY_FORTUNE_GUIDES.find((g) => g.id === raw);
  return found ?? DAILY_FORTUNE_GUIDES.find((g) => g.id === "kerosion")!;
}

function resolveColorLabel(raw: string | null): string {
  if (!raw) return "オレンジ・茶";
  const decoded = decodeURIComponent(raw);
  if ((GUARDIAN_COLORS as readonly string[]).includes(decoded)) return decoded;
  // 英語キー／旧表記でも指定できるようにする
  const byKey: Record<string, string> = {
    red: "赤",
    orange: "オレンジ・茶",
    "orange-brown": "オレンジ・茶",
    オレンジ: "オレンジ・茶",
    yellow: "黄",
    green: "緑",
    blue: "青",
    darkblue: "紺・藍色",
    藍: "紺・藍色",
    紺: "紺・藍色",
    紺色: "紺・藍色",
    purple: "紫",
    pink: "ピンク",
    gold: "ゴールド",
  };
  return byKey[decoded] ?? "オレンジ・茶";
}

/** ログイン不要の今日の鑑定結果プレビュー（サンプル固定＋クエリで差替可） */
export function DailyFortunePreviewClient() {
  const searchParams = useSearchParams();
  const guide = useMemo(
    () => resolveGuide(searchParams.get("guide")),
    [searchParams],
  );
  const color = useMemo(
    () => resolveDailyFortuneColorAsset(resolveColorLabel(searchParams.get("color"))),
    [searchParams],
  );

  return (
    <div className="relative">
      <DailyFortunePageClient
        guide={guide}
        message={PREVIEW_MESSAGE}
        smallAction={PREVIEW_SMALL_ACTION}
        color={color}
        yearTheme={{
          title: "今年のテーマ",
          headline: "土台づくりの年",
          body: "焦らず、丁寧に整えていくと、あとから歩きやすくなります。",
        }}
        monthTheme={{
          title: "今月のテーマ",
          headline: "やさしい一歩",
          body: "小さな約束を一つ守るだけで、気持ちが軽くなります。",
        }}
        backHref="/preview"
        backLabel="← プレビュー一覧"
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[50] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-[#d9cbb8]/90 bg-[#fffdf8]/92 px-3 py-2 text-[11px] leading-relaxed text-[#5c4a3a] shadow-sm backdrop-blur-[2px]">
          <p className="font-medium">プレビュー（サンプル文言）</p>
          <p className="mt-1 break-all text-[#7a6856]">
            guide=owl|hedgehog|squirrel|kerosion|sloth / color=赤|オレンジ|黄…
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
            {DAILY_FORTUNE_GUIDES.map((g) => (
              <Link
                key={g.id}
                href={`/preview/daily-fortune?guide=${g.id}&color=${encodeURIComponent(color.label)}`}
                className="underline-offset-2 hover:underline"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
