import Link from "next/link";
import { redirect } from "next/navigation";

import { DiaryBookEditIncludesPanel } from "@/components/journal/DiaryBookEditIncludesPanel";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type Props = { params: Promise<{ bookId: string }> };

export const dynamic = "force-dynamic";

export default async function DiaryBookEditIncludesPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { bookId } = await params;
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  if (!activeProfileId) redirect("/orders");

  const row = await prisma.diaryBook.findFirst({
    where: {
      id: bookId.trim(),
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

  const rangeLabel = `${row.startDate.replace(/-/g, "/")} 〜 ${row.endDate.replace(/-/g, "/")}`;

  return (
    <DiaryBookEditIncludesPanel bookId={row.id} bookTitle={row.title} rangeLabel={rangeLabel} />
  );
}
