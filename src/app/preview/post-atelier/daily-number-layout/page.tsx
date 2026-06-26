import Link from "next/link";
import { notFound } from "next/navigation";

import { DailyNumberLayoutDebugClient } from "./DailyNumberLayoutDebugClient";
import { DailyNumberLayoutRulerNav } from "@/components/admin/post-atelier/DailyNumberLayoutRulerNav";
import { parseLayoutRulerReturnTo, parseLayoutRulerSlide } from "@/lib/admin/post-atelier/daily-number/layoutRulerUrls";

type Props = {
  searchParams: Promise<{ returnTo?: string; slide?: string }>;
};

export default async function DailyNumberLayoutDebugPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const returnTo = parseLayoutRulerReturnTo(params.returnTo);
  const draftId = returnTo?.split("/").pop();
  const initialSlide = parseLayoutRulerSlide(params.slide) ?? "cover";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[900px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">こころ予報・画像レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          テンプレート PNG と同じ 819×1024 座標で測ります。編集画面のプレビューは縮小表示のため、5px
          マスの見た目はこことは一致しません。
        </p>

        {draftId ? (
          <div className="mt-6">
            <DailyNumberLayoutRulerNav draftId={draftId} variant="ruler" />
          </div>
        ) : null}

        <div className="mt-8">
          <DailyNumberLayoutDebugClient initialSlide={initialSlide} returnTo={returnTo} />
        </div>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          {returnTo ? (
            <Link href={returnTo} className="text-violet-800 underline hover:text-violet-950">
              ← 編集画面へ戻る
            </Link>
          ) : null}
          <Link href="/preview/post-atelier" className="text-stone-600 underline hover:text-stone-900">
            投稿アトリエ確認ハブへ
          </Link>
          <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
            校正メニューへ
          </Link>
        </p>
      </div>
    </div>
  );
}
