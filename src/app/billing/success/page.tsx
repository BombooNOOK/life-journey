import Link from "next/link";

import {
  LOG_HOUSE_SHORT_LABEL,
  LOG_HOUSE_TO_LABEL,
} from "@/lib/journal/logHouseLabels";

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900">お支払いが完了しました</h1>
      <p className="text-sm leading-relaxed text-stone-700">
        プラン反映まで少し時間がかかる場合があります。しばらくしてから{LOG_HOUSE_SHORT_LABEL}でご確認ください。
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/orders"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          {LOG_HOUSE_TO_LABEL}
        </Link>
        <Link
          href="/plans"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          プラン一覧
        </Link>
      </div>
    </div>
  );
}
