import Link from "next/link";

import { LifeJourneyDiaryCard } from "@/components/journal/LifeJourneyDiaryCard";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

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

  let profiles: Awaited<ReturnType<typeof listProfilesAndActiveProfileId>>["profiles"] = [];
  let activeProfileId = "";
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let fetchError: string | null = null;
  try {
    const loaded = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );
    profiles = loaded.profiles;
    activeProfileId = loaded.activeProfileId;
    orders = await withPrismaConnectionRetry(() =>
      prisma.order.findMany({
        where: { email: viewerEmail, profileId: activeProfileId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "一覧を取得できませんでした。";
  }

  if (fetchError) {
    const showDevHint = process.env.NODE_ENV === "development";
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">マイページを読み込めませんでした</p>
          <p className="mt-2 text-stone-800">
            まずは下の「詳細」を確認してください（ここに出ている内容が、実際の原因に近いです）。接続の一時切れのときは、数分あけてから再読み込みしてください。
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-red-800">詳細</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-red-200/80 bg-white/80 px-3 py-2 font-mono text-xs text-red-950">
            {fetchError}
          </p>
          {!showDevHint ? (
            <p className="mt-3 text-xs text-red-800">
              本番で続く場合は、Vercel の `DATABASE_URL` が Neon の<strong>プーラー用</strong>
              接続になっているか、未適用のマイグレーションがないかを確認してください。
            </p>
          ) : (
            <p className="mt-3 text-xs text-red-800">
              開発時: `DATABASE_URL` と `npx prisma db push` / `migrate` を確認してください。
            </p>
          )}
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
          href={`/order?profile=${encodeURIComponent(activeProfileId)}`}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
        >
          新しく無料鑑定をする
        </Link>
        <Link
          href={`/journal?profile=${encodeURIComponent(activeProfileId)}`}
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
