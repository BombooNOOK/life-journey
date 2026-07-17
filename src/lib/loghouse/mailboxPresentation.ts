import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { MAILBOX_GOAT_FACE_ICON_SRC } from "@/lib/loghouse/mailboxAssets";
import {
  MAILBOX_NOTICE_TYPE_BIRTHDAY_ACORN_DELIVERY,
  MAILBOX_NOTICE_TYPE_DAILY_ACORN_DELIVERY,
  MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
  type MailboxNoticeView,
} from "@/lib/loghouse/mailboxNoticeTypes";
import {
  DONGURI_BIRTHDAY_MAIL_TITLE,
  DONGURI_DAILY_MAIL_TITLE,
} from "@/lib/loghouse/donguriTypes";
import {
  MAILBOX_NOTICE_TYPE_FOREST_SYSTEM,
  SYSTEM_NOTICE_SENDER_NAME,
} from "@/lib/loghouse/systemNoticeTypes";

/** ユーザー向けのポスト表示形（DBの MailboxNoticeView を拡張しやすい形に寄せる） */
export type MailboxPostKind = "letter" | "notice" | "delivery" | "reward";

export type MailboxSenderType = "goat" | "system" | "fortune" | "shop";

export type MailboxPostPresentation = {
  id: string;
  kind: MailboxPostKind;
  senderName: string;
  senderType: MailboxSenderType;
  title: string;
  preview: string;
  body: string;
  dateLabel: string;
  isRead: boolean;
  actionLabel?: string;
  actionTarget?: string;
  noticeType: string;
};

type SenderMeta = {
  kind: MailboxPostKind;
  senderName: string;
  senderType: MailboxSenderType;
  /** 既知タイプでは DB タイトルよりこちらを優先 */
  titleOverride?: string;
};

function metaForNoticeType(type: string): SenderMeta {
  switch (type) {
    case MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY:
      return {
        kind: "delivery",
        senderName: "鑑定のへや",
        senderType: "fortune",
        titleOverride: "鑑定書が届きました",
      };
    case "memory_letter":
      return {
        kind: "letter",
        senderName: "ヤギさん郵便",
        senderType: "goat",
      };
    case MAILBOX_NOTICE_TYPE_DAILY_ACORN_DELIVERY:
    case "subscription_acorn_delivery":
      return {
        kind: "delivery",
        senderName: "ヤギさん郵便",
        senderType: "goat",
        titleOverride: DONGURI_DAILY_MAIL_TITLE,
      };
    case MAILBOX_NOTICE_TYPE_BIRTHDAY_ACORN_DELIVERY:
      return {
        kind: "delivery",
        senderName: "ヤギさん郵便",
        senderType: "goat",
        titleOverride: DONGURI_BIRTHDAY_MAIL_TITLE,
      };
    case "season_event":
    case MAILBOX_NOTICE_TYPE_FOREST_SYSTEM:
    case "system_notice":
      return {
        kind: "notice",
        senderName: SYSTEM_NOTICE_SENDER_NAME,
        senderType: "system",
      };
    default:
      return {
        kind: "notice",
        senderName: "森からのお知らせ",
        senderType: "system",
      };
  }
}

export function mailboxMessagePreview(message: string, maxChars = 42): string {
  const oneLine = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
  if (oneLine.length <= maxChars) return oneLine;
  return `${oneLine.slice(0, maxChars).trimEnd()}…`;
}

export function mailboxDateLabel(iso: string, now = new Date()): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "";

  const createdKey = calendarDayKeyInJapanFromDate(created);
  const todayKey = calendarDayKeyInJapanFromDate(now);
  if (createdKey === todayKey) return "今日";

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (createdKey === calendarDayKeyInJapanFromDate(yesterday)) return "昨日";

  return created.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function presentMailboxNotice(
  notice: MailboxNoticeView,
  now = new Date(),
): MailboxPostPresentation {
  const meta = metaForNoticeType(notice.type);
  return {
    id: notice.id,
    kind: meta.kind,
    senderName: meta.senderName,
    senderType: meta.senderType,
    title: meta.titleOverride ?? notice.title,
    preview: mailboxMessagePreview(notice.message),
    body: notice.message,
    dateLabel: mailboxDateLabel(notice.createdAt, now),
    isRead: !notice.unread,
    actionLabel: notice.actionLabel ?? undefined,
    actionTarget: notice.actionRoute ?? undefined,
    noticeType: notice.type,
  };
}

export function presentMailboxNotices(
  notices: MailboxNoticeView[],
  now = new Date(),
): MailboxPostPresentation[] {
  return notices.map((n) => presentMailboxNotice(n, now));
}

/** 差出人アイコン（ヤギ以外は当面顔アイコンなし＝頭文字） */
export function mailboxSenderIconSrc(senderType: MailboxSenderType): string | null {
  if (senderType === "goat") return MAILBOX_GOAT_FACE_ICON_SRC;
  return null;
}

export function mailboxSenderInitial(senderName: string): string {
  const trimmed = senderName.trim();
  return trimmed ? trimmed.slice(0, 1) : "森";
}
