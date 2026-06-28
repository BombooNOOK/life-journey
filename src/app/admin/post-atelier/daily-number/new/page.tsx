import Link from "next/link";
import { notFound } from "next/navigation";

import { DailyNumberPostEditor } from "@/components/admin/post-atelier/DailyNumberPostEditor";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import type { DailyNumberDraftFormValues } from "@/lib/admin/post-atelier/daily-number/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ err?: string }>;
};

const DEFAULT_VALUES: DailyNumberDraftFormValues = {
  scheduledDate: "",
  companionType: "owl",
  messageType: "base",
  coverVariantMode: "A",
  messageSeasonMode: "base",
  status: "draft",
  internalMemo: "",
};

export default async function DailyNumberNewPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const params = await searchParams;
  const err = params.err?.trim();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/post-atelier" className="text-sm text-stone-600 hover:text-stone-900">
          ← 投稿アトリエ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">今日のこころ予報を作成</h1>
        <p className="mt-1 text-sm text-stone-600">
          投稿予定日から今日のすうじを計算し、表紙・個別ページの文案を生成します（画像合成は次段階）。
        </p>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{err}</div>
      ) : null}

      <DailyNumberPostEditor mode="create" initialValues={DEFAULT_VALUES} />
    </div>
  );
}
