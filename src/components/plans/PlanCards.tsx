"use client";

export function PlanCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="flex flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">森の定期便</h2>
        <p className="mt-1 text-2xl font-bold text-emerald-900">毎月どんぐり100こ</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          毎月どんぐり100こが届き、森でのあしあとづくりに使える予定です。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          将来的には、あしあとを森のお預かり棚にしまっておける機能も準備しています。
        </p>
        <p className="mt-2 text-sm font-medium text-stone-700">現在準備中です。</p>
        <div className="mt-5">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600"
          >
            準備中
          </button>
        </div>
      </article>

      <article className="flex flex-col rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">どんぐり50こ</h2>
        <p className="mt-1 text-2xl font-bold text-amber-900">200円予定</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          必要な時だけ、どんぐりを受け取れるように準備中です。
        </p>
        <p className="mt-2 text-sm font-medium text-stone-700">現在準備中です。</p>
        <div className="mt-5">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600"
          >
            準備中
          </button>
        </div>
      </article>
    </div>
  );
}
