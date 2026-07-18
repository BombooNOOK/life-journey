import { notFound } from "next/navigation";

import { LogHouseMailboxDetailClient } from "@/components/orders/LogHouseMailboxDetailClient";
import { getMailboxPreviewNotice } from "@/lib/loghouse/mailboxPreviewFixture";
import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

type Props = {
  params: Promise<{ noticeId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

/** お手紙詳細プレビュー（フィクスチャ・ログイン不要） */
export default async function MailboxPreviewDetailPage({ params, searchParams }: Props) {
  const { noticeId } = await params;
  const query = searchParams ? await searchParams : {};
  const notice = getMailboxPreviewNotice(noticeId);
  if (!notice) {
    notFound();
  }

  const returnTo = query.returnTo?.trim();
  const mailboxListHref = returnTo
    ? `/preview/mailbox?returnTo=${encodeURIComponent(resolveSafeReturnTo(returnTo) ?? "/preview/loghouse-tour")}`
    : "/preview/mailbox";

  return (
    <LogHouseMailboxDetailClient
      notice={notice}
      backHref={mailboxListHref}
      backLabel="ポストに戻る"
    />
  );
}
