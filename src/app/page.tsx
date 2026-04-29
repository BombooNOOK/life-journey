import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[#f6f4ef] p-4 pb-14 shadow-sm sm:p-6 sm:pb-14 md:p-8 md:pb-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/images/mainhaikei-smartphone.png')] bg-cover bg-no-repeat bg-[position:98%_72%]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-white/72 via-white/20 to-transparent md:h-[28%] md:from-white/56 md:via-white/16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl md:h-52 md:w-52"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl md:h-44 md:w-44"
        />
        <div className="relative z-10 grid gap-3 p-2 sm:p-3 md:grid-cols-2 md:gap-8">
          <div className="min-w-0 rounded-2xl bg-[#fffdf9]/72 p-3 backdrop-blur-[1px] sm:p-4 md:bg-[#fffdf9]/62">
            <p className="text-[11px] tracking-[0.2em] text-emerald-800 sm:text-xs">
              BAMBOONOOK / LIFE JOURNEY
            </p>
            <h1 className="mt-2 whitespace-nowrap font-extrabold leading-tight tracking-tight text-stone-900 text-[clamp(1.375rem,0.8rem+3.6vw,2.125rem)] sm:text-3xl md:whitespace-normal md:text-4xl lg:text-5xl">
              数字で紡ぐ、人生の旅
            </h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700 sm:text-base sm:leading-7">
              どうぶつ鑑定士たちのことばに導かれながら、
              {"\n"}あなたの「今日」に届く数字を、そっとひらいていきます。
            </p>
          </div>

          <div className="space-y-3 rounded-2xl p-3 sm:p-4 md:self-end">
            <Link
              href="/order"
              className="block rounded-xl border border-[#5b6b4d]/45 bg-[#6f8460]/76 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_1px_2px_rgba(58,73,47,0.2)] backdrop-blur-[1px] transition hover:bg-[#667b58]/84 sm:text-base"
            >
              無料鑑定をはじめる
            </Link>
            <Link
              href="/orders"
              className="block rounded-xl border border-stone-300/75 bg-white/62 px-4 py-3.5 text-center text-sm font-semibold text-stone-700 backdrop-blur-[1px] transition hover:bg-white/78 sm:text-base"
            >
              マイページへ
            </Link>
            <p className="text-xs leading-5 text-stone-600">
              はじめての方は無料鑑定から。
              <br />
              保存済みの結果は、
              <br />
              マイページから開けます。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 sm:p-6">
        <h2 className="font-semibold text-stone-800">この場所でできること</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 leading-7">
          <li>あなたのコアナンバーを読み解く</li>
          <li>今の流れと、これからのテーマを見る</li>
          <li>気づいたことを、日々の記録として残す</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <p className="whitespace-pre-line text-base font-semibold leading-8 text-stone-800">
          知ることから、残すことへ。
          {"\n"}今日の気づきを、
          {"\n"}あなた自身の物語にしていきましょう。
        </p>
        <Link
          href="/orders"
          className="mt-4 inline-block rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          日々の記録を見る
        </Link>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-stone-700 sm:p-6">
        <h2 className="font-semibold text-stone-800">BambooNOOK の物語</h2>
        <p className="mt-2 leading-7">
          ここは、元おもちゃ屋の記憶を抱いた古民家カフェ。
          かつて誰かの宝物だったものたちと、どうぶつ鑑定士たちが、あなたの一日をそっと見守っています。
        </p>
        <p className="mt-2 leading-7">
          数字は「当てる」ためではなく、今のあなたをやさしく整えるための灯り。
          焦らず、静かに、あなたのペースで受け取ってください。
        </p>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-stone-700 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-xl" aria-hidden>
            🦉
          </div>
          <div>
            <p className="font-medium text-stone-800">フクロウ先生より</p>
            <p className="mt-1 leading-7">
              迷ったら、まずは無料鑑定からで大丈夫です。
              今日のあなたに必要なヒントを、静かにお届けします。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
