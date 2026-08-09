import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DiaryJournalListHome } from "@/components/journal/DiaryJournalListHome";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

function ListFallback() {
  return <OwlSuspenseFallback label="あしあと帳を読み込んでいます…" />;
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
  const viewerIsAdmin = await isAdminEmail(viewerEmail);

  return (
    <Suspense fallback={<ListFallback />}>
      <DiaryJournalListHome
        profiles={profiles}
        activeProfileId={activeProfileId}
        activeProfileNickname={activeProfileNickname}
        viewerIsAdmin={viewerIsAdmin}
      />
    </Suspense>
  );
}
