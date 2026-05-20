import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[#f6f4ef] p-4 pb-16 shadow-sm sm:p-6 sm:pb-20 md:min-h-[480px] md:p-8 md:pb-12 lg:min-h-[520px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/images/mainhaikei-smartphone.png')] bg-cover bg-no-repeat bg-[position:98%_72%] md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 top-[48%] w-[70%] bg-gradient-to-t from-[#f6f4ef]/92 via-[#f6f4ef]/45 to-transparent md:hidden"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute inset-0 bg-[#f6f4ef]" />
          <div className="absolute inset-0 bg-[url('/images/mainhaikei-smartphone.png')] bg-no-repeat bg-[length:auto_min(88%,480px)] bg-[position:100%_100%] lg:bg-[length:auto_min(90%,520px)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f6f4ef] from-[38%] via-[#f6f4ef]/90 via-[52%] to-transparent to-[78%]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f6f4ef]/80 to-transparent" />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-white/72 via-white/20 to-transparent md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl md:hidden"
        />
        <div className="relative z-10 grid gap-3 p-2 sm:p-3 md:max-w-xl md:gap-5 lg:max-w-2xl">
          <div className="min-w-0 rounded-2xl bg-[#fffdf9]/72 p-3 backdrop-blur-[1px] sm:p-4 md:bg-[#fffdf9]/78">
            <p className="text-[11px] tracking-[0.2em] text-emerald-800 sm:text-xs">
              BAMBOONOOK / LIFE JOURNEY
            </p>
            <h1 className="mt-2 font-extrabold leading-tight tracking-tight text-stone-900 text-[clamp(1.375rem,0.8rem+3.6vw,2.125rem)] sm:text-3xl md:text-4xl md:leading-[1.15] lg:text-5xl">
              <span className="inline whitespace-nowrap md:hidden">数字で紡ぐ、人生の旅</span>
              <span className="hidden md:flex md:flex-col md:gap-0.5">
                <span className="block whitespace-nowrap">数字で紡ぐ、</span>
                <span className="block whitespace-nowrap">人生の旅</span>
              </span>
            </h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700 sm:text-base sm:leading-7">
              どうぶつ鑑定士たちのことばに導かれながら、
              {"\n"}あなたの「今日」に届く数字を、そっとひらいていきます。
            </p>
          </div>

          <div className="w-full max-w-full space-y-3 rounded-2xl bg-[#fffdf9]/75 p-3 backdrop-blur-[2px] sm:p-4 md:max-w-xs md:bg-transparent md:backdrop-blur-none">
            <Link
              href="/order"
              className="block w-full rounded-xl border border-[#5b6b4d]/45 bg-[#6f8460]/76 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_1px_2px_rgba(58,73,47,0.2)] backdrop-blur-[1px] transition hover:bg-[#667b58]/84 sm:text-base"
            >
              無料鑑定をはじめる
            </Link>
            <Link
              href="/orders"
              className="block w-full rounded-xl border border-stone-300/75 bg-white/62 px-4 py-3.5 text-center text-sm font-semibold text-stone-700 backdrop-blur-[1px] transition hover:bg-white/78 sm:text-base"
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
