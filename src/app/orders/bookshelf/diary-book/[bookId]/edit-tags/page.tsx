import Link from "next/link";
import { redirect } from "next/navigation";

import { DiaryBookEditTagsPanel } from "@/components/journal/DiaryBookEditTagsPanel";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE,
  loadDiaryBookSettingsEditEligibility,
} from "@/lib/journal/diaryBookSettingsEdit";
import { diaryBookTagScopeFromRow } from "@/lib/journal/diaryBookTagFilter";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type Props = { params: Promise<{ bookId: string }> };

export const dynamic = "force-dynamic";

export default async function DiaryBookEditTagsPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { bookId } = await params;
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  if (!activeProfileId) redirect("/orders");

  const eligibility = await loadDiaryBookSettingsEditEligibility({
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

  if (!eligibility.canEditSettings) {
    return (
      <div className="space-y-4">
        <Link
          href={`/orders/bookshelf/diary-book/${eligibility.book.id}`}
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {eligibility.book.title}を読む
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE}
        </div>
      </div>
    );
  }

  const row = await prisma.diaryBook.findFirst({
    where: {
      id: eligibility.book.id,
      email: viewerEmail,
      profileId: activeProfileId,
    },
  });

  if (!row) {
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

  const tagScope = diaryBookTagScopeFromRow(row);
  const rangeLabel = `${row.startDate.replace(/-/g, "/")} 〜 ${row.endDate.replace(/-/g, "/")}`;

  return (
    <DiaryBookEditTagsPanel
      bookId={row.id}
      bookTitle={row.title}
      rangeLabel={rangeLabel}
      initialTagFilter={tagScope.tagFilter}
      initialTagFilterMode={tagScope.tagFilterMode}
    />
  );
}
