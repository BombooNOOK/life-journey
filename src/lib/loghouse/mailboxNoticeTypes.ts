/** クライアントからも安全に import できるポスト通知の型・定数（DBアクセスなし） */

export const MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY = "fortune_report_ready" as const;

export type MailboxNoticeType =
  | typeof MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY
  | "daily_acorn_delivery"
  | "subscription_acorn_delivery"
  | "system_notice"
  | "season_event"
  | "memory_letter"
  | (string & {});

export type MailboxNoticeView = {
  id: string;
  type: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionRoute: string | null;
  relatedOrderId: string | null;
  createdAt: string;
  readAt: string | null;
  unread: boolean;
};
