"use client";

import { useEffect, useState } from "react";

import {
  MailboxEmptyState,
  MailboxIntroBanner,
  MailboxNoticeList,
} from "@/components/orders/mailbox/MailboxListPieces";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { LJD_PAGE_BG_CLASS } from "@/lib/ljd/ljdPaperSurface";
import {
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
} from "@/lib/loghouse/logHouseMailboxCopy";
import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";
import { presentMailboxNotices } from "@/lib/loghouse/mailboxPresentation";

type Props = {
  initialNotices: MailboxNoticeView[];
  /** プレビュー時は詳細を /preview/mailbox/[id] に向ける */
  detailHrefBase?: string;
  backHref?: string;
  backLabel?: string;
};

/** ログハウス・ポスト一覧（半没入） */
export function LogHouseMailboxPageClient({
  initialNotices,
  detailHrefBase = LOG_HOUSE_MAILBOX_PAGE_PATH,
  backHref = "/orders",
  backLabel = LOG_HOUSE_RETURN_TO_LABEL,
}: Props) {
  const [notices, setNotices] = useState(initialNotices);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const posts = presentMailboxNotices(notices);

  return (
    <div className={`min-h-[100dvh] ${LJD_PAGE_BG_CLASS}`}>
      <div className="mx-auto w-full max-w-md space-y-5 px-4 pb-12 pt-5 sm:space-y-6 sm:pt-6">
        <MyPageSubpageHeader
          title={LOG_HOUSE_MAILBOX_PAGE_TITLE}
          backHref={backHref}
          backLabel={backLabel}
        />

        <MailboxIntroBanner />

        {posts.length === 0 ? (
          <MailboxEmptyState />
        ) : (
          <MailboxNoticeList posts={posts} detailHrefBase={detailHrefBase} />
        )}
      </div>
    </div>
  );
}
