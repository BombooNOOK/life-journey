import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

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

const FORTUNE_REPORT_READY_TITLE = "ヤギの郵便屋さんからのお知らせ";
const FORTUNE_REPORT_READY_MESSAGE =
  "あなたの鑑定書ができあがりました。\nログハウスの本棚にしまってあります。\n\n時間のあるときに、\nゆっくり開いてみてください。";

export function toMailboxNoticeView(row: {
  id: string;
  type: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionRoute: string | null;
  relatedOrderId: string | null;
  createdAt: Date;
  readAt: Date | null;
}): MailboxNoticeView {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    actionLabel: row.actionLabel,
    actionRoute: row.actionRoute,
    relatedOrderId: row.relatedOrderId,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    unread: row.readAt == null,
  };
}

/** 鑑定書完成のお知らせをポストに届ける（同じ注文の重複は作らない） */
export async function ensureFortuneReportReadyMailboxNotice(params: {
  email: string;
  profileId: string;
  orderId: string;
}): Promise<void> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const orderId = params.orderId.trim();
  if (!email || !profileId || !orderId) return;

  const existing = await prisma.logHouseMailboxNotice.findFirst({
    where: {
      email,
      profileId,
      type: MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
      relatedOrderId: orderId,
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.logHouseMailboxNotice.create({
    data: {
      email,
      profileId,
      type: MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
      title: FORTUNE_REPORT_READY_TITLE,
      message: FORTUNE_REPORT_READY_MESSAGE,
      actionLabel: "本棚で見る",
      actionRoute: "/orders/bookshelf#bookshelf-kantei-books",
      relatedOrderId: orderId,
    },
  });
}

export async function listMailboxNoticesForProfile(params: {
  email: string;
  profileId: string;
  take?: number;
}): Promise<MailboxNoticeView[]> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return [];

  const rows = await prisma.logHouseMailboxNotice.findMany({
    where: { email, profileId },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 40,
  });
  return rows.map(toMailboxNoticeView);
}

export async function countUnreadMailboxNotices(params: {
  email: string;
  profileId: string;
}): Promise<number> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return 0;

  return prisma.logHouseMailboxNotice.count({
    where: { email, profileId, readAt: null },
  });
}

export async function markMailboxNoticeRead(params: {
  email: string;
  profileId: string;
  noticeId: string;
}): Promise<MailboxNoticeView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const noticeId = params.noticeId.trim();
  if (!email || !profileId || !noticeId) return null;

  const existing = await prisma.logHouseMailboxNotice.findFirst({
    where: { id: noticeId, email, profileId },
  });
  if (!existing) return null;

  if (existing.readAt) return toMailboxNoticeView(existing);

  const updated = await prisma.logHouseMailboxNotice.update({
    where: { id: existing.id },
    data: { readAt: new Date() },
  });
  return toMailboxNoticeView(updated);
}
