import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DiaryJournalListHome } from "@/components/journal/DiaryJournalListHome";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

function ListFallback() {
  return <p className="text-sm text-stone-500">日記一覧を読み込み中…</p>;
}

export default async function OrdersJournalListPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/list");
  }

  const { profiles, activeProfileId } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );
  const activeProfileNickname =
    profiles.find((p) => p.id === activeProfileId)?.nickname ?? "メイン";

  return (
    <Suspense fallback={<ListFallback />}>
      <DiaryJournalListHome
        profiles={profiles}
        activeProfileId={activeProfileId}
        activeProfileNickname={activeProfileNickname}
      />
    </Suspense>
  );
}
