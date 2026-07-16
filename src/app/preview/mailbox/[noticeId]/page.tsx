import { notFound } from "next/navigation";

import { LogHouseMailboxDetailClient } from "@/components/orders/LogHouseMailboxDetailClient";
import { getMailboxPreviewNotice } from "@/lib/loghouse/mailboxPreviewFixture";

type Props = {
  params: Promise<{ noticeId: string }>;
};

/** 開発用：お手紙詳細（ログイン不要・ヘッダーなし半没入） */
export default async function MailboxPreviewDetailPage({ params }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { noticeId } = await params;
  const notice = getMailboxPreviewNotice(noticeId);
  if (!notice) {
    notFound();
  }

  return (
    <LogHouseMailboxDetailClient
      notice={notice}
      backHref="/preview/mailbox"
      backLabel="ポストに戻る"
    />
  );
}
