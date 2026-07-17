import Link from "next/link";
import { notFound } from "next/navigation";

import { DiaryBookBindingOrderPanel } from "@/components/orders/DiaryBookBindingOrderPanel";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  getPendingDiaryBookBindingForBook,
  loadDiaryBookBindingSnapshotForBook,
} from "@/lib/commerce/createDiaryBookBindingRequestForBook";
import { diaryBookBindingOverviewValue } from "@/lib/journal/diaryBookBindingOffer";
import { getBookPlan } from "@/lib/order/bookBindingPlan";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bookId: string }> };

export default async function DiaryBookBindingPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) notFound();

  const { bookId } = await params;
  const snapshot = await loadDiaryBookBindingSnapshotForBook({
    viewerEmail,
    bookId,
  });

  if ("error" in snapshot) {
    const isOverLimit = snapshot.error.includes("個別相談");
    return (
      <div className="space-y-6">
        <div>
          <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
            ← 本棚へ
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">日記ブック製本版の注文</h1>
        </div>
        <div
          className={[
            "rounded-xl border p-5 text-sm",
            isOverLimit
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          <p className="font-medium">{snapshot.error}</p>
          {!isOverLimit ? (
            <p className="mt-2 text-xs">
              <Link href="/orders/bookshelf" className="underline">
                本棚に戻る
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const plan = getBookPlan(snapshot.pageCount);
  const rangeLabel = `${snapshot.startDate.replace(/-/g, "/")} 〜 ${snapshot.endDate.replace(/-/g, "/")}`;
  const pendingResult = await getPendingDiaryBookBindingForBook({ viewerEmail, bookId });
  const hasIssuedCode = pendingResult.ok && pendingResult.pending != null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">日記ブック製本版の注文</h1>
        {!hasIssuedCode ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            この日記ブックを、紙の本として注文できます。
            <br />
            「製本版を注文する」を押すと、製本コードが発行されます。
            <br />
            発行されたコードをコピーし、BASEの商品ページで注文する際に入力してください。
          </p>
        ) : null}
      </div>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 text-sm text-stone-800">
        <h2 className="font-semibold text-stone-900">注文対象の日記ブック</h2>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-xs text-stone-500">タイトル</dt>
            <dd className="font-medium">{snapshot.displayTitle}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">対象期間</dt>
            <dd>{rangeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">総ページ数（製本想定）</dt>
            <dd>{snapshot.pageCount} ページ</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">製本プラン</dt>
            <dd>{diaryBookBindingOverviewValue(plan)}</dd>
          </div>
        </dl>
      </section>

      <DiaryBookBindingOrderPanel
        bookId={snapshot.diaryBookId}
        pageCount={snapshot.pageCount}
        planId={snapshot.planId}
        orderable={plan.orderable}
      />

      <ul className="list-inside list-disc space-y-0.5 text-xs leading-relaxed text-stone-500">
        <li>BASEでお支払い（製本コード入力が必要）</li>
        <li>受注生産のため、注文後のキャンセルは原則できません</li>
        <li>森の定期便・どんぐりとは別料金です</li>
      </ul>
    </div>
  );
}
