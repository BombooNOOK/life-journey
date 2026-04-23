import Link from "next/link";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let fetchError: string | null = null;
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "一覧を取得できませんでした。";
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">保存済み注文</h1>
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">保存済み注文</h1>
      {orders.length === 0 ? (
        <p className="text-stone-600">まだ注文がありません。</p>
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
    </div>
  );
}
