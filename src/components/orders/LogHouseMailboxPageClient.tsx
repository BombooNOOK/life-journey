"use client";

import { useCallback, useEffect, useState } from "react";

import {
  MailboxEmptyState,
  MailboxIntroBanner,
  MailboxNoticeList,
} from "@/components/orders/mailbox/MailboxListPieces";
import { LogHouseTourMailboxAssist } from "@/components/orders/loghouse-room/LogHouseTourMailboxAssist";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { LJD_PAGE_BG_CLASS } from "@/lib/ljd/ljdPaperSurface";
import {
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
} from "@/lib/loghouse/logHouseMailboxCopy";
import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";
import { presentMailboxNotices } from "@/lib/loghouse/mailboxPresentation";
import { readLoghouseTourReturnHref, readLoghouseTourStep } from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import { LOGHOUSE_TOUR_RETURN_LABEL } from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  initialNotices: MailboxNoticeView[];
  /** プレビュー時は詳細を /preview/mailbox/[id] に向ける */
  detailHrefBase?: string;
  backHref?: string;
  backLabel?: string;
  /** false のとき API 再取得しない（プレビュー用） */
  refreshFromApi?: boolean;
};

/** ログハウス・ポスト一覧（半没入） */
export function LogHouseMailboxPageClient({
  initialNotices,
  detailHrefBase = LOG_HOUSE_MAILBOX_PAGE_PATH,
  backHref = "/orders",
  backLabel,
  refreshFromApi = true,
}: Props) {
  const [notices, setNotices] = useState(initialNotices);
  const [resolvedBackHref, setResolvedBackHref] = useState(backHref);
  const [resolvedBackLabel, setResolvedBackLabel] = useState(
    backLabel ?? LOG_HOUSE_RETURN_TO_LABEL,
  );

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  useEffect(() => {
    if (readLoghouseTourStep()) {
      setResolvedBackHref(readLoghouseTourReturnHref());
      setResolvedBackLabel(LOGHOUSE_TOUR_RETURN_LABEL);
      return;
    }
    setResolvedBackHref(backHref);
    setResolvedBackLabel(backLabel ?? LOG_HOUSE_RETURN_TO_LABEL);
  }, [backHref, backLabel]);

  const refreshNotices = useCallback(async () => {
    if (!refreshFromApi) return;
    try {
      const res = await fetch("/api/loghouse/mailbox", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { notices?: MailboxNoticeView[] };
      if (Array.isArray(json.notices)) {
        setNotices(json.notices);
      }
    } catch {
      /* keep current list */
    }
  }, [refreshFromApi]);

  useEffect(() => {
    if (!refreshFromApi) return;
    void refreshNotices();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshNotices();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshFromApi, refreshNotices]);

  const posts = presentMailboxNotices(notices);

  return (
    <div className={`min-h-[100dvh] ${LJD_PAGE_BG_CLASS}`}>
      <div className="mx-auto w-full max-w-md space-y-5 px-4 pb-12 pt-5 sm:space-y-6 sm:pt-6">
        <MyPageSubpageHeader
          title={LOG_HOUSE_MAILBOX_PAGE_TITLE}
          backHref={resolvedBackHref}
          backLabel={resolvedBackLabel}
        />

        <MailboxIntroBanner />

        <LogHouseTourMailboxAssist />

        {posts.length === 0 ? (
          <MailboxEmptyState />
        ) : (
          <MailboxNoticeList posts={posts} detailHrefBase={detailHrefBase} />
        )}
      </div>
    </div>
  );
}
