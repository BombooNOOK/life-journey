import { redirect } from "next/navigation";

import { ForestBookshelfClient } from "@/components/orders/forest-bookshelf/ForestBookshelfClient";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { diaryCoverImagePath } from "@/lib/journal/coverAssets";
import { listDiaryBooksForViewer } from "@/lib/journal/listDiaryBooks";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { listKanteiOrdersForProfile } from "@/lib/profile/orderPerProfile";

export const dynamic = "force-dynamic";

export default async function BookshelfPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );
  const activeProfileLabel =
    profiles.find((p) => p.id === activeProfileId)?.nickname ?? "メイン";

  const entitlementCtx = await loadEntitlementContext(viewerEmail);
  const entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));
  const canUseContinuedFeatures = entitlement.canUseContinuedFeatures;

  const [orders, diaryBookRows] = await Promise.all([
    listKanteiOrdersForProfile({
      viewerEmail,
      profileId: activeProfileId,
    }),
    listDiaryBooksForViewer({
      email: viewerEmail,
      profileId: activeProfileId,
    }),
  ]);

  const kanteiBooks = orders.map((order) => {
    const romanizedName = order.fullNameRomanDisplay?.trim() || order.fullNameDisplay;
    return {
      id: order.id,
      title: `鑑定書（${romanizedName}）`,
      createdLabel: order.createdAt.toLocaleDateString("ja-JP"),
      subtitle: `${order.fullNameDisplay}さんの鑑定書です。`,
      href: `/orders/${order.id}/read`,
      coverSrc: "/images/kantei-cover.png?v=1",
    };
  });

  const diaryBooks = diaryBookRows.map((book) => {
    const periodLabel = `${book.startDate.replace(/-/g, "/")} 〜 ${book.endDate.replace(/-/g, "/")}`;
    return {
      id: book.id,
      title: book.title,
      periodLabel,
      createdLabel: new Date(book.createdAt).toLocaleDateString("ja-JP"),
      entryCount: book.entryCount,
      href: `/orders/bookshelf/diary-book/${book.id}`,
      coverSrc: diaryCoverImagePath(book.coverTheme, "owl"),
    };
  });

  return (
    <ForestBookshelfClient
      activeProfileLabel={activeProfileLabel}
      activeProfileId={activeProfileId}
      entitlement={entitlement}
      kanteiBooks={kanteiBooks}
      diaryBooks={diaryBooks}
      blockCreate={!canUseContinuedFeatures}
      deployRevision={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null}
    />
  );
}
