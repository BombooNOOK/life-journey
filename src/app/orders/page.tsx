import Link from "next/link";

import { LifeJourneyDiaryCard } from "@/components/journal/LifeJourneyDiaryCard";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { listViewerProfiles, resolveActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">ログイン情報を確認できませんでした</p>
          <p className="mt-2">いちどログアウトして、もう一度ログインしてください。</p>
        </div>
      </div>
    );
  }

  const [profiles, activeProfileId] = await Promise.all([
    listViewerProfiles(viewerEmail),
    resolveActiveProfileId(viewerEmail),
  ]);
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let fetchError: string | null = null;
  try {
    orders = await prisma.order.findMany({
      where: { email: viewerEmail, profileId: activeProfileId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "一覧を取得できませんでした。";
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">データベースに接続できませんでした</p>
          <p className="mt-2 whitespace-pre-wrap">{fetchError}</p>
          <p className="mt-2 text-xs text-red-800">
            `DATABASE_URL` を確認し、`npx prisma db push` を実行してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        <p className="mt-1 text-sm text-stone-600">
          保存した鑑定結果と、最近の記録をここから確認できます。
        </p>
      </div>

      <ProfileSwitcher profiles={profiles} activeProfileId={activeProfileId} />

      <LifeJourneyDiaryCard />

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/order"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
        >
          新しく無料鑑定をする
        </Link>
        <Link
          href="/journal"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
        >
          今日の記録を書く
        </Link>
        <Link
          href="/orders/bookshelf"
          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
        >
          本棚を見る
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">保存済み鑑定</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-stone-600">まだ保存された鑑定はありません。</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/orders/${o.id}`} className="font-medium text-stone-900 hover:underline">
                    {o.fullNameDisplay}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {o.createdAt.toLocaleString("ja-JP")} · {o.email}
                  </p>
                </div>
                <Link
                  href={`/orders/${o.id}`}
                  className="text-sm text-stone-600 hover:text-stone-900"
                >
                  詳細 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
