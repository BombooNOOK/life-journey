export const NUMEROLOGY_PERSONAL_NUMBERS_SECTION_TITLE = "あなたの今日のすうじ";

type PersonalDiaryNumbers = {
  today: number;
  month: number;
  year: number;
};

const PERSONAL_NUMBER_ROWS: Array<{ key: keyof PersonalDiaryNumbers; label: string }> = [
  { key: "today", label: "今日のすうじ" },
  { key: "month", label: "月のすうじ" },
  { key: "year", label: "年のすうじ" },
];

/** 意味ページ冒頭：結果のすうじだけ表示（解説は下の1〜9一覧で探す） */
export function NumerologyPersonalNumbersSection({
  diaryNumbers,
}: {
  diaryNumbers: PersonalDiaryNumbers;
}) {
  return (
    <section
      aria-labelledby="numerology-personal-numbers-heading"
      className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 px-4 py-4"
    >
      <h2 id="numerology-personal-numbers-heading" className="text-base font-semibold text-stone-900">
        {NUMEROLOGY_PERSONAL_NUMBERS_SECTION_TITLE}
      </h2>
      <dl className="mt-3 space-y-2 text-stone-800">
        {PERSONAL_NUMBER_ROWS.map(({ key, label }) => (
          <div key={key} className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-sm text-stone-600">{label}：</dt>
            <dd className="text-xl font-bold tabular-nums text-stone-900">{diaryNumbers[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
