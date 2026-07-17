import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  MAILBOX_NOTICE_TYPE_FOREST_SYSTEM,
  SYSTEM_NOTICE_STATUS_LABELS,
  isSystemNoticeStatus,
  toSystemNoticeMailboxId,
  type SystemNoticeStatus,
} from "@/lib/loghouse/systemNoticeTypes";
import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";

export type SystemNoticeAdminView = {
  id: string;
  title: string;
  body: string;
  status: SystemNoticeStatus;
  statusLabel: string;
  publishedAt: string | null;
  unpublishedAt: string | null;
  actionLabel: string | null;
  actionRoute: string | null;
  authorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

function toAdminView(row: {
  id: string;
  title: string;
  body: string;
  status: string;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  actionLabel: string | null;
  actionRoute: string | null;
  authorEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SystemNoticeAdminView {
  const status: SystemNoticeStatus = isSystemNoticeStatus(row.status) ? row.status : "draft";
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status,
    statusLabel: SYSTEM_NOTICE_STATUS_LABELS[status],
    publishedAt: row.publishedAt?.toISOString() ?? null,
    unpublishedAt: row.unpublishedAt?.toISOString() ?? null,
    actionLabel: row.actionLabel,
    actionRoute: row.actionRoute,
    authorEmail: row.authorEmail,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSystemNoticesForAdmin(take = 100): Promise<SystemNoticeAdminView[]> {
  const rows = await prisma.systemNotice.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take,
  });
  return rows.map(toAdminView);
}

export async function getSystemNoticeForAdmin(id: string): Promise<SystemNoticeAdminView | null> {
  const row = await prisma.systemNotice.findUnique({ where: { id: id.trim() } });
  return row ? toAdminView(row) : null;
}

export type UpsertSystemNoticeInput = {
  title: string;
  body: string;
  actionLabel?: string | null;
  actionRoute?: string | null;
  authorEmail?: string | null;
};

function normalizeUpsertInput(input: UpsertSystemNoticeInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("タイトルを入力してください。");
  if (!body) throw new Error("本文を入力してください。");
  const actionLabel = input.actionLabel?.trim() || null;
  const actionRoute = input.actionRoute?.trim() || null;
  return {
    title,
    body,
    actionLabel,
    actionRoute,
    authorEmail: input.authorEmail?.trim() || null,
  };
}

export async function createSystemNoticeDraft(
  input: UpsertSystemNoticeInput,
): Promise<SystemNoticeAdminView> {
  const data = normalizeUpsertInput(input);
  const row = await prisma.systemNotice.create({
    data: {
      ...data,
      status: "draft",
    },
  });
  return toAdminView(row);
}

export async function updateSystemNoticeDraft(
  id: string,
  input: UpsertSystemNoticeInput,
): Promise<SystemNoticeAdminView> {
  const noticeId = id.trim();
  if (!noticeId) throw new Error("ID が不正です。");
  const data = normalizeUpsertInput(input);
  const row = await prisma.systemNotice.update({
    where: { id: noticeId },
    data,
  });
  return toAdminView(row);
}

export async function publishSystemNotice(id: string): Promise<SystemNoticeAdminView> {
  const noticeId = id.trim();
  if (!noticeId) throw new Error("ID が不正です。");
  const existing = await prisma.systemNotice.findUnique({ where: { id: noticeId } });
  if (!existing) throw new Error("お知らせが見つかりません。");
  if (!existing.title.trim() || !existing.body.trim()) {
    throw new Error("タイトルと本文を入力してから公開してください。");
  }

  const row = await prisma.systemNotice.update({
    where: { id: noticeId },
    data: {
      status: "published",
      publishedAt: existing.publishedAt ?? new Date(),
      unpublishedAt: null,
    },
  });
  return toAdminView(row);
}

export async function unpublishSystemNotice(id: string): Promise<SystemNoticeAdminView> {
  const noticeId = id.trim();
  if (!noticeId) throw new Error("ID が不正です。");
  const row = await prisma.systemNotice.update({
    where: { id: noticeId },
    data: {
      status: "unpublished",
      unpublishedAt: new Date(),
    },
  });
  return toAdminView(row);
}

/** 公開中のお知らせをポスト用 View に変換（既読付き） */
export async function listPublishedSystemNoticesForMailbox(params: {
  email: string;
  profileId: string;
  take?: number;
}): Promise<MailboxNoticeView[]> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return [];

  const take = params.take ?? 40;
  const rows = await prisma.systemNotice.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const reads = await prisma.systemNoticeReadState.findMany({
    where: { email, profileId, noticeId: { in: ids } },
    select: { noticeId: true, readAt: true },
  });
  const readAtByNoticeId = new Map(reads.map((r) => [r.noticeId, r.readAt]));

  return rows.map((row) => {
    const readAt = readAtByNoticeId.get(row.id) ?? null;
    const sortAt = row.publishedAt ?? row.createdAt;
    return {
      id: toSystemNoticeMailboxId(row.id),
      type: MAILBOX_NOTICE_TYPE_FOREST_SYSTEM,
      title: row.title,
      message: row.body,
      actionLabel: row.actionLabel,
      actionRoute: row.actionRoute,
      relatedOrderId: null,
      relatedLedgerId: null,
      createdAt: sortAt.toISOString(),
      readAt: readAt?.toISOString() ?? null,
      unread: readAt == null,
    } satisfies MailboxNoticeView;
  });
}

export async function countUnreadPublishedSystemNotices(params: {
  email: string;
  profileId: string;
}): Promise<number> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return 0;

  const published = await prisma.systemNotice.findMany({
    where: { status: "published" },
    select: { id: true },
  });
  if (published.length === 0) return 0;

  const readCount = await prisma.systemNoticeReadState.count({
    where: {
      email,
      profileId,
      noticeId: { in: published.map((p) => p.id) },
    },
  });
  return Math.max(0, published.length - readCount);
}

export async function getPublishedSystemNoticeForMailbox(params: {
  email: string;
  profileId: string;
  noticeId: string;
}): Promise<MailboxNoticeView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const noticeId = params.noticeId.trim();
  if (!email || !profileId || !noticeId) return null;

  const row = await prisma.systemNotice.findFirst({
    where: { id: noticeId, status: "published" },
  });
  if (!row) return null;

  const read = await prisma.systemNoticeReadState.findUnique({
    where: {
      noticeId_email_profileId: { noticeId, email, profileId },
    },
    select: { readAt: true },
  });
  const sortAt = row.publishedAt ?? row.createdAt;
  return {
    id: toSystemNoticeMailboxId(row.id),
    type: MAILBOX_NOTICE_TYPE_FOREST_SYSTEM,
    title: row.title,
    message: row.body,
    actionLabel: row.actionLabel,
    actionRoute: row.actionRoute,
    relatedOrderId: null,
    relatedLedgerId: null,
    createdAt: sortAt.toISOString(),
    readAt: read?.readAt.toISOString() ?? null,
    unread: read == null,
  };
}

export async function markSystemNoticeRead(params: {
  email: string;
  profileId: string;
  noticeId: string;
}): Promise<MailboxNoticeView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const noticeId = params.noticeId.trim();
  if (!email || !profileId || !noticeId) return null;

  const row = await prisma.systemNotice.findFirst({
    where: { id: noticeId, status: "published" },
  });
  if (!row) return null;

  const read =
    (
      await prisma.systemNoticeReadState.upsert({
        where: {
          noticeId_email_profileId: { noticeId, email, profileId },
        },
        create: { noticeId, email, profileId, readAt: new Date() },
        update: {},
        select: { readAt: true },
      })
    ).readAt;

  const sortAt = row.publishedAt ?? row.createdAt;
  return {
    id: toSystemNoticeMailboxId(row.id),
    type: MAILBOX_NOTICE_TYPE_FOREST_SYSTEM,
    title: row.title,
    message: row.body,
    actionLabel: row.actionLabel,
    actionRoute: row.actionRoute,
    relatedOrderId: null,
    relatedLedgerId: null,
    createdAt: sortAt.toISOString(),
    readAt: read.toISOString(),
    unread: false,
  };
}
