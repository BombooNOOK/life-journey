import {
  NUMEROLOGY_NUMBER_MEANING_ENTRIES,
  NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE,
  NUMEROLOGY_NUMBERS_PAGE_INTRO,
  NUMEROLOGY_NUMBERS_PAGE_TITLE,
} from "@/lib/journal/numerologyNumberMeanings";

type Props = {
  /** 校正プレビュー用にタイトル上の余白を詰める */
  compact?: boolean;
};

export function NumerologyNumbersDictionaryView({ compact = false }: Props) {
  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
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

      <section aria-labelledby="numerology-numbers-list-heading" className="space-y-3">
        <h2 id="numerology-numbers-list-heading" className="text-base font-semibold text-stone-900">
          1〜9の数字一覧
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {NUMEROLOGY_NUMBER_MEANING_ENTRIES.map((entry) => (
            <li
              key={entry.number}
              className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums text-stone-900">{entry.number}</p>
                <p className="text-base font-semibold text-stone-800">{entry.title}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                {entry.keywords.join(" · ")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{entry.description}</p>
              <p className="mt-3 border-t border-stone-100 pt-3 text-sm leading-relaxed text-stone-600">
                <span className="font-medium text-stone-700">日記での見方：</span>
                {entry.diaryHint}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-stone-500">{NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE}</p>
    </div>
  );
}
