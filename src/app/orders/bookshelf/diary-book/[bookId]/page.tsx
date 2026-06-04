import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { DiaryBookFlipReader } from "@/components/journal/DiaryBookFlipReader";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { findDiaryBookRowForViewerOrAdmin } from "@/lib/journal/diaryBookAdminAccess";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { getDiaryBookMetaForViewer } from "@/lib/journal/listDiaryBookEntries";

type Props = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DiaryBookReadPage({ params, searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { bookId } = await params;
  const { returnTo: returnToRaw } = await searchParams;
  const backHref = parseSafeJournalReturnTo(returnToRaw ?? null) ?? "/orders/bookshelf";
  const backLabel = backHref.startsWith("/admin/") ? "製本申込一覧へ戻る" : "本棚へ戻る";

  const row = await findDiaryBookRowForViewerOrAdmin({ bookId, viewerEmail });
  if (!row) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="text-sm text-stone-600 hover:text-stone-900">
          ← {backLabel}
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          指定の日記ブックは見つかりませんでした。表示中のプロフィールと一致しているか確認してください。
        </div>
      </div>
    );
  }

  const adminBrowse =
    (await isAdminEmail(viewerEmail)) &&
    normalizeEmail(row.email) !== normalizeEmail(viewerEmail);

  const payload = await getDiaryBookMetaForViewer({
    bookId,
    viewerEmail,
  });

  if (!payload) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="text-sm text-stone-600 hover:text-stone-900">
          ← {backLabel}
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
      {adminBrowse ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-950">
          管理者として閲覧中です（申込ユーザーの日記ブック）。編集操作は行わず内容照合にご利用ください。
        </div>
      ) : null}
      <div>
        <Link href={backHref} className="text-sm text-stone-600 hover:text-stone-900">
          ← {backLabel}
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
        {adminBrowse ? null : (
          <p className="mt-2">
            <BookshelfEditIncludesNavButton
              bookId={book.id}
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            />
          </p>
        )}
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
