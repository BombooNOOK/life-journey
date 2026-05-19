import Link from "next/link";

import { PlanCards } from "@/components/plans/PlanCards";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const viewerEmail = await getViewerEmailFromCookie();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">プラン</h1>
        <p className="mt-1 text-sm text-stone-600">
          Life Journey Diary を継続して使うための月額プランです。初回14日間は無料でお試しできます。
        </p>
        {!viewerEmail ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            プラン申込の前に
            <Link href="/login?returnTo=/plans" className="mx-1 font-medium underline">
              ログイン
            </Link>
            してください。
          </p>
        ) : null}
      </div>

      <PlanCards />
    </div>
  );
}
