import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DiaryBookFlipReader } from "@/components/journal/DiaryBookFlipReader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getDiaryBookWithEntriesForViewer } from "@/lib/journal/listDiaryBookEntries";

type Props = { params: Promise<{ bookId: string }> };

export const dynamic = "force-dynamic";

export default async function DiaryBookReadPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { bookId } = await params;
  const payload = await getDiaryBookWithEntriesForViewer({
    bookId,
    viewerEmail,
  });

  if (!payload) {
    return (
      <div className="space-y-4">
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          指定の日記ブックは見つかりませんでした。表示中のプロフィールと一致しているか確認してください。
        </div>
      </div>
    );
  }

  const { book, profileId } = payload;
  const rangeLabel = `${book.startDate.replace(/-/g, "/")} 〜 ${book.endDate.replace(/-/g, "/")}`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{book.title}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {rangeLabel} · {book.entryCount}件の日記
          {book.needsContentRefresh ? (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
              更新が必要
            </span>
          ) : null}
        </p>
        <p className="mt-2">
          <Link
            href={`/orders/bookshelf/diary-book/${book.id}/edit-includes`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            本に入れる日記を編集する
          </Link>
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-stone-500">日記ブックを読み込み中…</p>}>
        <DiaryBookFlipReader
          bookId={book.id}
          title={book.title}
          startDate={book.startDate}
          endDate={book.endDate}
          coverTheme={book.coverTheme}
          profileId={profileId}
        />
      </Suspense>
    </div>
  );
}
