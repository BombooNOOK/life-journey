import Image from "next/image";
import Link from "next/link";

const OWL_GUIDE_SRC = "/images/help/home-screen/owl-home-screen-guide.png";

/** マイページ：ホーム画面追加ガイド案内カード */
export function MyPageHomeScreenTip() {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-br from-[#faf8f5] via-emerald-50/45 to-[#f3f8f5] p-4 shadow-[0_2px_12px_rgba(52,120,90,0.08)] sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]">
            LJDをホーム画面に追加しませんか？
          </h2>
          <p className="mt-2 lj-read-desc text-stone-700">
            スマホのホーム画面に追加すると、アプリのようにすぐ開けます。
            今日のあしあとを残すときに、毎回ブラウザで探さなくて済みます。
          </p>
          <p className="mt-3.5">
            <Link
              href="/help/home-screen"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 transition hover:text-emerald-950 hover:underline"
            >
              ホーム画面に追加する方法 →
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 items-end self-stretch">
          <Image
            src={OWL_GUIDE_SRC}
            alt="スマホを持ってホーム画面への追加を案内するフクロウ先生"
            width={160}
            height={200}
            className="h-[5.5rem] w-auto object-contain object-bottom sm:h-28"
            sizes="(max-width: 640px) 88px, 112px"
          />
        </div>
      </div>
    </section>
  );
}
