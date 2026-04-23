import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm">
        <span className="absolute right-4 top-4 text-xl" aria-hidden>
          🦉
        </span>
        <p className="text-xs tracking-[0.18em] text-amber-700">LIFE JOURNEY</p>
        <h1 className="mt-2 text-3xl font-bold text-stone-900">ようこそ、あなたの旅の入り口へ</h1>
        <p className="mt-3 text-stone-600">
          今日のヒントと、これからの流れ。まずは無料の数秘リーディングから始めましょう。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/orders"
          className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <p className="text-sm font-semibold text-stone-900">ログインしてマイページへ</p>
          <p className="mt-1 text-sm text-stone-600">今日のひとことや日記一覧を見る</p>
          <p className="mt-3 text-sm text-amber-700 group-hover:text-amber-800">マイページを見る →</p>
        </Link>

        <Link
          href="/order"
          className="group rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <p className="text-sm font-semibold text-stone-900">はじめての方はこちら</p>
          <p className="mt-1 text-sm text-stone-600">お名前と生年月日で無料鑑定をはじめる</p>
          <p className="mt-3 text-sm text-amber-700 group-hover:text-amber-800">入力画面へ →</p>
        </Link>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
        <h2 className="font-semibold text-stone-800">このサービスでできること</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>無料の数秘リーディングと鑑定書PDFの閲覧</li>
          <li>今日のヒント・日々の記録への導線（順次拡張）</li>
          <li>保存データにもとづく再閲覧（マイページ）</li>
        </ul>
      </section>
    </div>
  );
}
