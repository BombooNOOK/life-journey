import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { GardenPageClient } from "@/components/orders/GardenPageClient";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  GARDEN_PAGE_DESCRIPTION,
  GARDEN_PAGE_PATH,
  GARDEN_PAGE_TITLE,
} from "@/lib/garden/gardenCopy";
import { loadGardenStateForProfile } from "@/lib/garden/gardenPlant";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: GARDEN_PAGE_TITLE,
  description: GARDEN_PAGE_DESCRIPTION,
};

export default async function GardenPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(GARDEN_PAGE_PATH)}`);
  }

  let activeProfileId = "";
  let profiles: Awaited<ReturnType<typeof listProfilesAndActiveProfileId>>["profiles"] = [];
  try {
    const listed = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );
    activeProfileId = listed.activeProfileId;
    profiles = listed.profiles;
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "プロフィールを読み込めませんでした。"}
      />
    );
  }

  if (!activeProfileId || profiles.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <MyPageSubpageHeader title={GARDEN_PAGE_TITLE} description={GARDEN_PAGE_DESCRIPTION} />
        <p className="text-sm text-stone-600">
          お庭を使うには、プロフィールが必要です。ログハウスの設定から追加できます。
        </p>
        <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
          {LOG_HOUSE_RETURN_TO_LABEL}
        </Link>
      </div>
    );
  }

  try {
    const state = await withPrismaConnectionRetry(() =>
      loadGardenStateForProfile({
        email: viewerEmail,
        profileId: activeProfileId,
      }),
    );

    return <GardenPageClient initialState={state} />;
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "お庭を読み込めませんでした。"}
      />
    );
  }
}
