import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DiaryFlipReader } from "@/components/journal/DiaryFlipReader";
import {
  DEFAULT_BOOKSHELF_BOOK_SETTINGS,
  type DiaryBookshelfBookClientSettings,
} from "@/components/journal/DiaryBookshelfSettingsForm";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type Props = { params: Promise<{ year: string }> };

export const dynamic = "force-dynamic";

export default async function BookshelfDiaryYearPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/bookshelf");
  }
  const activeProfileId = await resolveActiveProfileId(viewerEmail);

  const { year: y } = await params;
  const year = Number(y);
  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    redirect("/orders/bookshelf");
  }

  const shelfBookDelegate = (prisma as unknown as {
    diaryBookshelfBook?: {
      findUnique: (args: {
        where: { email_profileId_year: { email: string; profileId: string; year: number } };
      }) => Promise<{
        displayTitle: string | null;
        coverTheme: string;
        periodStartMonth: number;
        periodEndMonth: number;
      } | null>;
    };
  }).diaryBookshelfBook;

  const shelfRow = shelfBookDelegate
    ? await shelfBookDelegate.findUnique({
        where: { email_profileId_year: { email: viewerEmail, profileId: activeProfileId, year } },
      })
    : null;

  const initialSettings: DiaryBookshelfBookClientSettings = shelfRow
    ? {
        displayTitle: shelfRow.displayTitle,
        coverTheme: shelfRow.coverTheme,
        periodStartMonth: shelfRow.periodStartMonth,
        periodEndMonth: shelfRow.periodEndMonth,
      }
    : DEFAULT_BOOKSHELF_BOOK_SETTINGS;

  const heading =
    shelfRow?.displayTitle?.trim() || `${year}年の記録`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{heading}</h1>
        <p className="mt-1 text-sm text-stone-600">
          上段で読むプレビュー、下段で製本前確認（本に入れるON/OFF）を行えます。製本では製本期間内かつONのページだけがカウントされます。
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-stone-500">{year}年の記録を読み込み中…</p>}
      >
        <DiaryFlipReader year={year} initialSettings={initialSettings} />
      </Suspense>
    </div>
  );
}
