import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";
import { MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY } from "@/lib/loghouse/mailboxNoticeTypes";

/** プレビュー／UI確認用の仮お手紙 */
export const MAILBOX_PREVIEW_FIXTURES: MailboxNoticeView[] = [
  {
    id: "preview-goat-thanks",
    type: "memory_letter",
    title: "今日もありがとう",
    message:
      "今日もログハウスに来てくれてありがとう。\n森で過ごした時間が、やさしい1日につながりますように。",
    actionLabel: null,
    actionRoute: null,
    relatedOrderId: null,
    createdAt: new Date().toISOString(),
    readAt: null,
    unread: true,
  },
  {
    id: "preview-system-notice",
    type: "system_notice",
    title: "新しいお知らせがあります",
    message:
      "BambooNOOKからのお知らせです。\n今後のお知らせはこのポストに届きます。",
    actionLabel: null,
    actionRoute: null,
    relatedOrderId: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
  {
    id: "preview-fortune-ready",
    type: MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
    title: "鑑定書が届きました",
    message:
      "あなたの鑑定書が本棚に届いています。\n必要なときに、森の本棚から開いてください。",
    actionLabel: "本棚で見る",
    actionRoute: "/orders/bookshelf#bookshelf-kantei-books",
    relatedOrderId: "preview-order",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    readAt: null,
    unread: true,
  },
];

export function getMailboxPreviewNotice(noticeId: string): MailboxNoticeView | null {
  return MAILBOX_PREVIEW_FIXTURES.find((n) => n.id === noticeId) ?? null;
}
