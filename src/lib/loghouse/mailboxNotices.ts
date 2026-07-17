import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
  type MailboxNoticeView,
} from "@/lib/loghouse/mailboxNoticeTypes";
import { parseSystemNoticeMailboxId } from "@/lib/loghouse/systemNoticeTypes";
import {
  countUnreadPublishedSystemNotices,
  getPublishedSystemNoticeForMailbox,
  listPublishedSystemNoticesForMailbox,
  markSystemNoticeRead,
} from "@/lib/loghouse/systemNotices";

export {
  MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
  type MailboxNoticeType,
  type MailboxNoticeView,
} from "@/lib/loghouse/mailboxNoticeTypes";

const FORTUNE_REPORT_READY_TITLE = "鑑定書が届きました";
const FORTUNE_REPORT_READY_MESSAGE =
  "あなたの鑑定書が本棚に届いています。\n必要なときに、森の本棚から開いてください。";

export function toMailboxNoticeView(row: {
  id: string;
  type: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionRoute: string | null;
  relatedOrderId: string | null;
  relatedLedgerId?: string | null;
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
    relatedLedgerId: row.relatedLedgerId ?? null,
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

function sortMailboxFeed(a: MailboxNoticeView, b: MailboxNoticeView): number {
  const aAt = Date.parse(a.createdAt);
  const bAt = Date.parse(b.createdAt);
  if (Number.isFinite(aAt) && Number.isFinite(bAt) && aAt !== bAt) {
    return bAt - aAt;
  }
  return b.id.localeCompare(a.id);
}

/**
 * 個人ポスト（LogHouseMailboxNotice）と公開中の森からのお知らせ（SystemNotice）を統合。
 * 並びは作成日／公開日（View.createdAt）の新しい順。
 */
export async function listMailboxNoticesForProfile(params: {
  email: string;
  profileId: string;
  take?: number;
}): Promise<MailboxNoticeView[]> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return [];

  const take = params.take ?? 40;
  const [personalRows, systemNotices] = await Promise.all([
    prisma.logHouseMailboxNotice.findMany({
      where: { email, profileId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    listPublishedSystemNoticesForMailbox({ email, profileId, take }),
  ]);

  const personal = personalRows.map(toMailboxNoticeView);
  return [...personal, ...systemNotices].sort(sortMailboxFeed).slice(0, take);
}

export async function countUnreadMailboxNotices(params: {
  email: string;
  profileId: string;
}): Promise<number> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return 0;

  const [personalUnread, systemUnread] = await Promise.all([
    prisma.logHouseMailboxNotice.count({
      where: { email, profileId, readAt: null },
    }),
    countUnreadPublishedSystemNotices({ email, profileId }),
  ]);
  return personalUnread + systemUnread;
}

export async function getMailboxNoticeForProfile(params: {
  email: string;
  profileId: string;
  noticeId: string;
}): Promise<MailboxNoticeView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const noticeId = params.noticeId.trim();
  if (!email || !profileId || !noticeId) return null;

  const systemId = parseSystemNoticeMailboxId(noticeId);
  if (systemId) {
    return getPublishedSystemNoticeForMailbox({ email, profileId, noticeId: systemId });
  }

  const row = await prisma.logHouseMailboxNotice.findFirst({
    where: { id: noticeId, email, profileId },
  });
  return row ? toMailboxNoticeView(row) : null;
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

  const systemId = parseSystemNoticeMailboxId(noticeId);
  if (systemId) {
    return markSystemNoticeRead({ email, profileId, noticeId: systemId });
  }

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
