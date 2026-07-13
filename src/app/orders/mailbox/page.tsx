import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { LogHouseMailboxPageClient } from "@/components/orders/LogHouseMailboxPageClient";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  LOG_HOUSE_MAILBOX_PAGE_DESCRIPTION,
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
} from "@/lib/loghouse/logHouseMailboxCopy";
import { listMailboxNoticesForProfile } from "@/lib/loghouse/mailboxNotices";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LOG_HOUSE_MAILBOX_PAGE_TITLE,
  description: LOG_HOUSE_MAILBOX_PAGE_DESCRIPTION,
};

export default async function LogHouseMailboxPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(LOG_HOUSE_MAILBOX_PAGE_PATH)}`);
  }

  try {
    const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );

    if (!activeProfileId || profiles.length === 0) {
      return (
        <div className="mx-auto w-full max-w-md space-y-4">
          <MyPageSubpageHeader
            title={LOG_HOUSE_MAILBOX_PAGE_TITLE}
            description={LOG_HOUSE_MAILBOX_PAGE_DESCRIPTION}
          />
          <p className="text-sm text-stone-600">ポストを使うには、プロフィールが必要です。</p>
          <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
            {LOG_HOUSE_BACK_TO_LABEL}
          </Link>
        </div>
      );
    }

    const notices = await withPrismaConnectionRetry(() =>
      listMailboxNoticesForProfile({
        email: viewerEmail,
        profileId: activeProfileId,
      }),
    );

    return <LogHouseMailboxPageClient initialNotices={notices} />;
  } catch (e) {
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "ポストを読み込めませんでした。"}
      />
    );
  }
}
