import { NumerologyPersonalNumbersSection } from "@/components/journal/NumerologyPersonalNumbersSection";
import {
  NUMEROLOGY_NUMBER_MEANING_ENTRIES,
  NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE,
  NUMEROLOGY_NUMBERS_PAGE_INTRO,
  NUMEROLOGY_NUMBERS_PAGE_TITLE,
} from "@/lib/journal/numerologyNumberMeanings";
import type { PersonalDiaryNumbersQuery } from "@/lib/journal/numerologyNumbersNav";

type Props = {
  /** 校正プレビュー用にタイトル上の余白を詰める */
  compact?: boolean;
  /** LJDの歩き方など：ページ見出し・導入を省略して一覧だけ表示 */
  embedded?: boolean;
  /** あしあとプレビューから渡された今日・月・年のすうじ */
  personalDiaryNumbers?: PersonalDiaryNumbersQuery | null;
};

export function NumerologyNumbersDictionaryView({
  compact = false,
  embedded = false,
  personalDiaryNumbers = null,
}: Props) {
  return (
    <div className={compact || embedded ? "space-y-5" : "space-y-6"}>
      {!embedded ? (
        <div>
          <h1
            className={
              compact
                ? "text-xl font-bold text-stone-900"
                : "text-2xl font-bold text-stone-900"
            }
          >
            {NUMEROLOGY_NUMBERS_PAGE_TITLE}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-700">{NUMEROLOGY_NUMBERS_PAGE_INTRO}</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">{NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE}</p>
        </div>
      ) : null}

      {personalDiaryNumbers ? (
        <NumerologyPersonalNumbersSection diaryNumbers={personalDiaryNumbers} />
      ) : null}

      <section aria-labelledby="numerology-numbers-list-heading" className="space-y-4">
        {embedded ? (
          <h3 id="numerology-numbers-list-heading" className="text-base font-semibold text-stone-800 sm:text-[1.05rem]">
            1〜9のすうじ一覧
          </h3>
        ) : (
          <h2 id="numerology-numbers-list-heading" className="text-base font-semibold text-stone-900">
            1〜9のすうじ一覧
          </h2>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {NUMEROLOGY_NUMBER_MEANING_ENTRIES.map((entry) => (
            <li
              key={entry.number}
              className={
                embedded
                  ? "rounded-lg border border-stone-200/90 bg-stone-50/50 px-4 py-4"
                  : "rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
              }
            >
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums text-stone-900">{entry.number}</p>
                <p className="text-base font-semibold text-stone-800">{entry.title}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                {entry.keywords.join(" · ")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{entry.description}</p>
              <p className="mt-3 border-t border-stone-200/80 pt-3 text-sm leading-relaxed text-stone-600">
                <span className="font-medium text-stone-700">あしあとでの見方：</span>
                {entry.diaryHint}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!embedded ? (
        <p className="text-xs leading-relaxed text-stone-500">{NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE}</p>
      ) : null}
    </div>
  );
}
