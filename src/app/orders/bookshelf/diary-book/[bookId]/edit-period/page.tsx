import Link from "next/link";
import { redirect } from "next/navigation";

import { DiaryBookEditPeriodPanel } from "@/components/journal/DiaryBookEditPeriodPanel";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE,
  loadDiaryBookPeriodEditEligibility,
} from "@/lib/journal/diaryBookPeriodEdit";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type Props = { params: Promise<{ bookId: string }> };

export const dynamic = "force-dynamic";

export default async function DiaryBookEditPeriodPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { bookId } = await params;
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  if (!activeProfileId) redirect("/orders");

  const eligibility = await loadDiaryBookPeriodEditEligibility({
    bookId,
    viewerEmail,
  });

  if (!eligibility.ok) {
    return (
      <div className="space-y-4">
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          指定のあしあとブックは見つかりませんでした。
        </div>
      </div>
    );
  }

  if (eligibility.book.profileId !== activeProfileId) {
    return (
      <div className="space-y-4">
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          表示中のプロフィールと一致しないあしあとブックです。プロフィールを切り替えてからお試しください。
        </div>
      </div>
    );
  }

  if (!eligibility.canEditPeriod) {
    return (
      <div className="space-y-4">
        <Link
          href={`/orders/bookshelf/diary-book/${eligibility.book.id}`}
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {eligibility.book.title}を読む
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">対象期間を変更する</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          {DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE}
        </div>
        <Link
          href="/orders/bookshelf"
          className="inline-block text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          本棚へ戻る
        </Link>
      </div>
    );
  }

  const currentRangeLabel = `${eligibility.book.startDate.replace(/-/g, "/")} 〜 ${eligibility.book.endDate.replace(/-/g, "/")}`;

  return (
    <DiaryBookEditPeriodPanel
      bookId={eligibility.book.id}
      bookTitle={eligibility.book.title}
      initialStartDate={eligibility.book.startDate}
      initialEndDate={eligibility.book.endDate}
      currentRangeLabel={currentRangeLabel}
      pageTemplate={eligibility.book.pageTemplate}
    />
  );
}
