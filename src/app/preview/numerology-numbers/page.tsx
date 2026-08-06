import type { Metadata } from "next";
import Link from "next/link";

import { DiaryNumbersHintSection } from "@/components/journal/DiaryNumbersHintSection";
import { NumerologyNumbersDictionaryView } from "@/components/journal/NumerologyNumbersDictionaryView";
import { parsePersonalDiaryNumbersFromSearchParams } from "@/lib/journal/numerologyNumbersNav";

export const metadata: Metadata = {
  title: "すうじの意味辞書（校正プレビュー）",
  robots: { index: false, follow: false },
};

const DEMO_NUMBERS = { today: 8, month: 3, year: 6 } as const;

type Props = {
  searchParams: Promise<{ today?: string; month?: string; year?: string }>;
};

export default async function PreviewNumerologyNumbersPage({ searchParams }: Props) {
  const params = await searchParams;
  const personalDiaryNumbers =
    parsePersonalDiaryNumbersFromSearchParams(params) ?? DEMO_NUMBERS;

  const helpHref = `/help/numerology-numbers?today=${personalDiaryNumbers.today}&month=${personalDiaryNumbers.month}&year=${personalDiaryNumbers.year}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-stone-600">
          <Link href="/preview" className="underline hover:text-stone-900">
            ← 校正メニューへ
          </Link>
          {" · "}
          <Link href={helpHref} className="underline hover:text-stone-900">
            本番ページ（/help）
          </Link>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          ログイン不要 · npm run dev 中のみ想定。下のリンクはあしあとプレビュー内カードの見た目です。
        </p>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-medium text-stone-600">あしあとプレビュー内カード（サンプル）</p>
          <DiaryNumbersHintSection
            diaryNumbers={personalDiaryNumbers}
            meaningsReturnTo="/preview/numerology-numbers"
          />
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-medium text-stone-600">
            「すうじの意味を見る」先（あなたの今日のすうじ → 1〜9一覧で探す）
          </p>
          <NumerologyNumbersDictionaryView compact personalDiaryNumbers={personalDiaryNumbers} />
        </div>
      </div>
    </div>
  );
}
