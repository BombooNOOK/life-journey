import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { HitoyasumiChairPageClient } from "@/components/orders/HitoyasumiChairPageClient";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION,
  LOG_HOUSE_HITOYASUMI_PAGE_PATH,
  LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
  description: LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION,
};

type Props = {
  searchParams: Promise<{ view?: string; draftId?: string }>;
};

export default async function HitoyasumiChairPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(LOG_HOUSE_HITOYASUMI_PAGE_PATH)}`);
  }

  const params = await searchParams;
  const initialScreen =
    params.view === "browse"
      ? "browse"
      : params.view === "movie_compose"
        ? "movie_compose"
        : "entrance";
  const initialDraftId =
    typeof params.draftId === "string" && params.draftId.trim()
      ? params.draftId.trim()
      : null;

  try {
    const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );

    if (!activeProfileId || profiles.length === 0) {
      return (
        <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          <MyPageSubpageHeader title={LOG_HOUSE_HITOYASUMI_PAGE_TITLE} />
          <p className="text-sm text-stone-600">椅子を使うには、プロフィールが必要です。</p>
          <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
            {LOG_HOUSE_RETURN_TO_LABEL}
          </Link>
        </div>
      );
    }

    return (
      <HitoyasumiChairPageClient
        profileId={activeProfileId}
        initialScreen={initialScreen}
        initialDraftId={initialDraftId}
      />
    );
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "ひとやすみの椅子を読み込めませんでした。"}
      />
    );
  }
}
