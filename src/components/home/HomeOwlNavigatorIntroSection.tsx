import Image from "next/image";

/** はじめての方へ：動画と無料鑑定の間 — フクロウ先生の紹介 */
export function HomeOwlNavigatorIntroSection() {
  return (
    <section
      className="rounded-2xl border border-stone-200/70 bg-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-owl-navigator-heading"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="lj-reading-exempt shrink-0 pt-0.5">
          <Image
            src="/decorations/owl-sensei-my-page-header.png"
            alt=""
            aria-hidden
            width={610}
            height={751}
            sizes="(max-width: 640px) 72px, 80px"
            className="h-[4.5rem] w-auto select-none object-contain sm:h-20"
          />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="lj-read-caption text-stone-500">森のナビゲーター</p>
          <h2
            id="home-owl-navigator-heading"
            className="mt-0.5 text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
          >
            フクロウ先生
          </h2>
        </div>
      </div>

      <div className="lj-read-desc mt-4 space-y-4 leading-[1.65] text-stone-600 sm:mt-5 sm:leading-7">
        <p>
          ようこそ、BambooNOOKの森へ。
          <br className="sm:hidden" />
          わたしはこの森で、数秘術の鑑定をしているフクロウ先生です。
        </p>

        <p>
          Life Journey Diaryでは、
          <br className="sm:hidden" />
          まず最初に、あなたが持つ数字を見つけます。
        </p>

        <p className="font-medium text-stone-700">
          それは、数字に合わせて毎日を決めるためではありません。
        </p>

        <p>
          数秘術では、
          <br className="sm:hidden" />
          数字にはそれぞれ意味やテーマがあると考えます。
        </p>

        <p>
          始まり、調和、表現、安定、変化、愛情、探求など。
          <br />
          数字ごとに、意味やテーマがあります。
        </p>

        <p>
          LJDでは、その意味やテーマを、
          <br className="block sm:hidden" />
          日記を見返すときの小さな手がかりとして使います。
        </p>

        <p className="border-l-[3px] border-emerald-200/90 pl-3.5 text-[0.95em] italic leading-relaxed text-stone-500 sm:pl-4">
          「今日は、このテーマに少し近い一日だったかも」
        </p>

        <p>
          そんなふうに気づくことで、
          <br className="sm:hidden" />
          なんでもない一日にも、やさしく光があたります。
        </p>
      </div>

      <div className="lj-read-desc mt-5 space-y-2 leading-[1.7] sm:mt-6 sm:leading-7">
        <p className="text-base font-bold text-emerald-900 sm:text-[1.05rem]">日々を書き残す。</p>
        <p className="font-medium text-emerald-800">あとから数字のテーマと照らしてみる。</p>
        <p className="font-medium text-emerald-800">
          なんでもない一日の中に、小さな気づきが見えてくる。
        </p>
        <p className="font-medium text-emerald-800">その積み重ねが、自分だけの一冊になる。</p>
      </div>

      <p className="lj-read-desc mt-4 text-center font-medium leading-relaxed text-stone-700 sm:mt-5">
        それが、Life Journey Diaryです。
      </p>
    </section>
  );
}
