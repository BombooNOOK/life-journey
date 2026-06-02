import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900">お支払いは完了していません</h1>
      <p className="text-sm leading-relaxed text-stone-700">
        必要に応じてもう一度プランを選択してください。
      </p>
      <Link
        href="/plans"
        className="inline-flex min-h-[44px] items-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-950 hover:bg-violet-100"
      >
        プランを選び直す →
      </Link>
    </div>
  );
}
