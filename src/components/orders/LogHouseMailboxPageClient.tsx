"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  LOG_HOUSE_MAILBOX_EMPTY,
  LOG_HOUSE_MAILBOX_LATER_LABEL,
  LOG_HOUSE_MAILBOX_PAGE_DESCRIPTION,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
} from "@/lib/loghouse/logHouseMailboxCopy";
import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNotices";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  initialNotices: MailboxNoticeView[];
};

/** ログハウス・ポスト（ヤギの郵便屋さん） */
export function LogHouseMailboxPageClient({ initialNotices }: Props) {
  const [notices, setNotices] = useState(initialNotices);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const markRead = useCallback(async (noticeId: string) => {
    setBusyId(noticeId);
    try {
      const res = await fetch(`/api/loghouse/mailbox/${encodeURIComponent(noticeId)}/read`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { notice?: MailboxNoticeView };
      if (json.notice) {
        setNotices((prev) => prev.map((n) => (n.id === noticeId ? json.notice! : n)));
      }
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title={LOG_HOUSE_MAILBOX_PAGE_TITLE}
        description={LOG_HOUSE_MAILBOX_PAGE_DESCRIPTION}
        backHref="/orders"
        backLabel={LOG_HOUSE_RETURN_TO_LABEL}
      />

      {notices.length === 0 ? (
        <p className="rounded-2xl border border-stone-200/80 bg-[#fffdf9] px-4 py-6 text-center text-sm text-stone-600">
          {LOG_HOUSE_MAILBOX_EMPTY}
        </p>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={[
                "rounded-2xl border px-4 py-4 shadow-sm",
                notice.unread
                  ? "border-amber-200/90 bg-[#fffdf6]"
                  : "border-stone-200/80 bg-[#fffdf9]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-900">{notice.title}</h2>
                {notice.unread ? (
                  <span className="shrink-0 text-[11px] text-amber-800/90" aria-label="未読">
                    🌰 未読
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                {notice.message}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {notice.actionRoute && notice.actionLabel ? (
                  <Link
                    href={notice.actionRoute}
                    onClick={() => {
                      if (notice.unread) void markRead(notice.id);
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-300/80 bg-emerald-50/90 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
                  >
                    {busyId === notice.id ? (
                      <OwlLoadingInline label="…" size="sm" />
                    ) : (
                      notice.actionLabel
                    )}
                  </Link>
                ) : null}
                {notice.unread ? (
                  <button
                    type="button"
                    disabled={busyId === notice.id}
                    onClick={() => void markRead(notice.id)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-stone-300/80 bg-white px-4 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
                  >
                    {LOG_HOUSE_MAILBOX_LATER_LABEL}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
