/** 森からのお知らせ（クライアント可） */

export const SYSTEM_NOTICE_STATUSES = ["draft", "published", "unpublished"] as const;
export type SystemNoticeStatus = (typeof SYSTEM_NOTICE_STATUSES)[number];

export const SYSTEM_NOTICE_STATUS_LABELS: Record<SystemNoticeStatus, string> = {
  draft: "下書き",
  published: "公開中",
  unpublished: "非公開",
};

export const SYSTEM_NOTICE_SENDER_NAME = "森からのお知らせ" as const;

/** ポスト一覧での合成 ID 接頭辞（個人 Post と区別） */
export const SYSTEM_NOTICE_MAILBOX_ID_PREFIX = "sys:" as const;

export const MAILBOX_NOTICE_TYPE_FOREST_SYSTEM = "system_notice" as const;

export function toSystemNoticeMailboxId(noticeId: string): string {
  return `${SYSTEM_NOTICE_MAILBOX_ID_PREFIX}${noticeId}`;
}

export function parseSystemNoticeMailboxId(mailboxId: string): string | null {
  const trimmed = mailboxId.trim();
  if (!trimmed.startsWith(SYSTEM_NOTICE_MAILBOX_ID_PREFIX)) return null;
  const id = trimmed.slice(SYSTEM_NOTICE_MAILBOX_ID_PREFIX.length).trim();
  return id || null;
}

export function isSystemNoticeStatus(value: string): value is SystemNoticeStatus {
  return (SYSTEM_NOTICE_STATUSES as readonly string[]).includes(value);
}
