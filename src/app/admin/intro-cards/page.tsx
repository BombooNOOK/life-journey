import Link from "next/link";
import { notFound } from "next/navigation";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { ADMIN_INTRO_CARDS } from "@/lib/admin/introCardAssets";

export const dynamic = "force-dynamic";

export default async function AdminIntroCardsPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">対面紹介用カード</h1>
        <p className="mt-1 text-sm text-stone-600">
          対面でサッと見せるための紹介カードです。見せたい方を選んでください。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADMIN_INTRO_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.99]"
          >
            <p className="text-base font-semibold text-stone-900">{card.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{card.description}</p>
            <p className="mt-4 text-sm font-medium text-emerald-800">カードを開く →</p>
          </Link>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        画像ファイル：
        <code className="mx-1 rounded bg-stone-100 px-1 py-0.5">public/images/admin/intro-card-app.png</code>
        と
        <code className="mx-1 rounded bg-stone-100 px-1 py-0.5">intro-card-shop.png</code>
      </p>
    </div>
  );
}
