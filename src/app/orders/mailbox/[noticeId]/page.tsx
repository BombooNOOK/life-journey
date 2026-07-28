import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { LogHouseMailboxDetailClient } from "@/components/orders/LogHouseMailboxDetailClient";
import { LogHouseLoadErrorPanel } from "@/components/orders/LogHouseLoadErrorPanel";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  LOG_HOUSE_MAILBOX_DETAIL_BACK_LABEL,
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
} from "@/lib/loghouse/logHouseMailboxCopy";
import {
  getMailboxNoticeForProfile,
  markMailboxNoticeRead,
} from "@/lib/loghouse/mailboxNotices";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ noticeId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `お手紙｜${LOG_HOUSE_MAILBOX_PAGE_TITLE}`,
  };
}

/** notFound() / redirect() を load error UI で潰さない */
function isNextNavigationError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
  ) {
    return (error as { digest: string }).digest.startsWith("NEXT_");
  }
  return false;
}

export default async function LogHouseMailboxDetailPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  const { noticeId } = await params;
  const detailPath = `${LOG_HOUSE_MAILBOX_PAGE_PATH}/${encodeURIComponent(noticeId)}`;

  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(detailPath)}`);
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
            backHref={LOG_HOUSE_MAILBOX_PAGE_PATH}
            backLabel={LOG_HOUSE_MAILBOX_DETAIL_BACK_LABEL}
          />
          <p className="text-sm text-stone-600">ポストを使うには、プロフィールが必要です。</p>
          <Link href="/orders" className="text-sm text-emerald-900 underline-offset-2 hover:underline">
            {LOG_HOUSE_RETURN_TO_LABEL}
          </Link>
        </div>
      );
    }

    let notice = await withPrismaConnectionRetry(() =>
      getMailboxNoticeForProfile({
        email: viewerEmail,
        profileId: activeProfileId,
        noticeId,
      }),
    );

    if (!notice) {
      notFound();
    }

    // 開いた時点で既読にする（DBのみ）。revalidatePath は RSC 描画中に呼べないため
    // クライアントの POST /api/loghouse/mailbox/.../read + router.refresh に任せる。
    if (notice.unread) {
      notice =
        (await withPrismaConnectionRetry(() =>
          markMailboxNoticeRead({
            email: viewerEmail,
            profileId: activeProfileId,
            noticeId,
          }),
        )) ?? notice;
    }

    return <LogHouseMailboxDetailClient notice={notice} />;
  } catch (e) {
    if (isNextNavigationError(e)) throw e;
    return (
      <LogHouseLoadErrorPanel
        detail={e instanceof Error ? e.message : "お手紙を読み込めませんでした。"}
      />
    );
  }
}
