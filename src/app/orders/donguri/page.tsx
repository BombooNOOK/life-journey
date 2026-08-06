import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DonguriChoPageClient } from "@/components/orders/DonguriChoPageClient";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  DONGURI_BALANCE_LABEL,
  DONGURI_CHO_TITLE,
  DONGURI_UNIT,
} from "@/lib/loghouse/donguriCopy";
import { getDonguriChoView } from "@/lib/loghouse/donguriLedger";
import { DONGURI_PAGE_PATH } from "@/lib/loghouse/donguriTypes";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: DONGURI_CHO_TITLE,
  description: `${DONGURI_BALANCE_LABEL}を確認できます。`,
};

export default async function DonguriChoPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(DONGURI_PAGE_PATH)}`);
  }

  try {
    const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );

    if (!activeProfileId || profiles.length === 0) {
      return (
        <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          <MyPageSubpageHeader title={DONGURI_CHO_TITLE} />
          <p className="text-sm text-stone-600">どんぐり帳を使うには、プロフィールが必要です。</p>
          <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
            {LOG_HOUSE_RETURN_TO_LABEL}
          </Link>
        </div>
      );
    }

    const view = await withPrismaConnectionRetry(() =>
      getDonguriChoView({ email: viewerEmail, profileId: activeProfileId }),
    );

    return <DonguriChoPageClient view={view} unit={DONGURI_UNIT} profileId={activeProfileId} />;
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "どんぐり帳を読み込めませんでした。"}
      />
    );
  }
}
