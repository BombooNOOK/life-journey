import { DecorationImage } from "@/components/ui/DecorationImage";

const RECOMMENDED_FOR_ITEMS = [
  "毎日がなんとなく流れていくように感じる",
  "自分の性質や、進むタイミングをやさしく知りたい",
  "占いの結果を、読むだけで終わらせたくない",
  "がんばった日も、少し落ち込んだ日も、自分の言葉で残したい",
  "いつか一冊の本のように、思い出の日々を読み返したい",
] as const;

function AcornBulletFallback() {
  return (
    <span
      aria-hidden
      className="mt-[0.42rem] inline-block h-2 w-2 shrink-0 rounded-full bg-amber-900/30"
    />
  );
}

type Props = {
  /** card＝トップ用の独立カード、plain＝歩き方ページなど本文に溶け込む表示 */
  variant?: "card" | "plain";
};

/** 「こんな方におすすめ」（リスくん＋どんぐり箇条書き） */
export function RecommendedForSection({ variant = "card" }: Props) {
  const sectionClass =
    variant === "card"
      ? "rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5"
      : "space-y-3";

  return (
    <section className={sectionClass}>
      <h2 className="text-base font-semibold leading-snug text-stone-900">こんな方におすすめ</h2>

      <div className="mt-3 flex items-end gap-2.5 sm:mt-3.5 sm:gap-3">
        <DecorationImage
          name="risu-kun-sm"
          size="md"
          className="mb-0.5 shrink-0 opacity-90"
          fallback={
            <span
              aria-hidden
              className="mb-0.5 inline-block h-8 w-8 shrink-0 rounded-full bg-amber-100/80"
            />
          }
        />
        <p className="min-w-0 flex-1 rounded-xl border border-stone-200/70 bg-white/85 px-3 py-2 text-xs leading-5 text-stone-600 sm:text-[13px] sm:leading-6">
          なんでもない日も、あとから見ると大切な一日かもしれないよ。
        </p>
      </div>

      <ul className="mt-3 space-y-2 sm:mt-3.5 sm:space-y-2.5">
        {RECOMMENDED_FOR_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <DecorationImage
              name="acorn-sm"
              size="md"
              className="mt-1 opacity-90"
              fallback={<AcornBulletFallback />}
            />
            <span className="min-w-0 flex-1 text-sm leading-6 text-stone-700 sm:text-[15px] sm:leading-7">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
