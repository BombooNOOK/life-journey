"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MailboxSenderRow } from "@/components/orders/mailbox/MailboxListPieces";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { LJD_PAGE_BG_CLASS, LJD_PAPER_CARD_CLASS, LJD_PAPER_PRIMARY_BTN_CLASS } from "@/lib/ljd/ljdPaperSurface";
import {
  LOG_HOUSE_MAILBOX_DETAIL_BACK_LABEL,
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_PAGE_TITLE,
  LOG_HOUSE_MAILBOX_UNREAD_LABEL,
} from "@/lib/loghouse/logHouseMailboxCopy";
import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";
import { presentMailboxNotice } from "@/lib/loghouse/mailboxPresentation";

type Props = {
  notice: MailboxNoticeView;
  backHref?: string;
  backLabel?: string;
};

/** お手紙詳細（別ページ）。開いた時点で既読にする */
export function LogHouseMailboxDetailClient({
  notice: initialNotice,
  backHref = LOG_HOUSE_MAILBOX_PAGE_PATH,
  backLabel = LOG_HOUSE_MAILBOX_DETAIL_BACK_LABEL,
}: Props) {
  const router = useRouter();
  const [notice, setNotice] = useState(initialNotice);
  const markedRef = useRef(false);

  useEffect(() => {
    setNotice(initialNotice);
  }, [initialNotice]);

  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    const noticeId = notice.id;
    const alreadyRead = !notice.unread;

    void (async () => {
      try {
        // サーバー側で既に既読でも POST は冪等。revalidatePath + refresh で /orders の未読キャッシュを落とす
        const res = await fetch(
          `/api/loghouse/mailbox/${encodeURIComponent(noticeId)}/read`,
          { method: "POST" },
        );
        if (res.ok) {
          const json = (await res.json()) as { notice?: MailboxNoticeView };
          if (json.notice) {
            setNotice(json.notice);
          } else if (!alreadyRead) {
            setNotice((prev) => ({
              ...prev,
              unread: false,
              readAt: prev.readAt ?? new Date().toISOString(),
            }));
          }
        }
        router.refresh();
      } catch {
        markedRef.current = false;
      }
    })();
  }, [notice.id, notice.unread, router]);

  const post = presentMailboxNotice(notice);

  return (
    <div className={`min-h-[100dvh] ${LJD_PAGE_BG_CLASS}`}>
      <div className="mx-auto w-full max-w-md space-y-5 px-4 pb-12 pt-5 sm:space-y-6 sm:pt-6">
        <MyPageSubpageHeader
          title={LOG_HOUSE_MAILBOX_PAGE_TITLE}
          backHref={backHref}
          backLabel={backLabel}
        />

        <article className={`overflow-hidden ${LJD_PAPER_CARD_CLASS}`}>
          <div className="border-b border-[#ebe4d8]/90 px-4 py-4">
            <MailboxSenderRow post={post} />
            {!post.isRead ? (
              <p className="mt-3 text-[11px] font-semibold text-emerald-800">
                {LOG_HOUSE_MAILBOX_UNREAD_LABEL}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 px-4 py-5">
            <h2 className="text-lg font-semibold leading-snug tracking-wide text-[#3d3226]">
              {post.title}
            </h2>
            <p className="lj-read-desc whitespace-pre-line text-[15px] leading-7 text-[#4f4033]">
              {post.body}
            </p>
          </div>

          {post.actionLabel && post.actionTarget ? (
            <div className="border-t border-[#ebe4d8]/90 px-4 py-4">
              <Link
                href={post.actionTarget}
                className={`inline-flex min-h-[48px] w-full items-center justify-center px-4 text-sm font-semibold ${LJD_PAPER_PRIMARY_BTN_CLASS}`}
              >
                {post.actionLabel}
              </Link>
            </div>
          ) : null}
        </article>
      </div>
    </div>
  );
}
