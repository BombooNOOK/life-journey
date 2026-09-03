import { normalizeEmail } from "@/lib/auth/viewer";
import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { prisma } from "@/lib/db";
import {
  birthdayGiftDateKey,
  isAccountBirthdayInJapan,
  japanCalendarYearFromDate,
} from "@/lib/loghouse/birthdayAcornGift";
import {
  authorizeDonguriSpendUnderValueAuthority,
  donguriCreateIdentityFields,
  shouldUseDonguriIdentityMutation,
  shouldUseDonguriIdentityRead,
  sumDonguriBalanceUnderValueAuthority,
} from "@/lib/value/donguriIdentityAuthority";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";
import {
  DONGURI_ADMIN_ADJUSTMENT_TITLE,
  DONGURI_ADMIN_ADJUSTMENT_USER_TITLE,
  DONGURI_BIRTHDAY_GIFT_AMOUNT,
  DONGURI_BIRTHDAY_GIFT_DESCRIPTION,
  DONGURI_BIRTHDAY_GIFT_TITLE,
  DONGURI_BIRTHDAY_MAIL_BODY,
  DONGURI_BIRTHDAY_MAIL_TITLE,
  DONGURI_DAILY_DELIVERY_DESCRIPTION,
  DONGURI_DAILY_DELIVERY_TITLE,
  DONGURI_DAILY_MAIL_BODY,
  DONGURI_DAILY_MAIL_TITLE,
  DONGURI_DIARY_SAVE_COST,
  DONGURI_DIARY_SAVE_DESCRIPTION,
  DONGURI_DIARY_SAVE_TITLE,
  DONGURI_PAGE_PATH,
  DONGURI_REASON_LABELS,
  DONGURI_WELCOME_GIFT_AMOUNT,
  DONGURI_WELCOME_GIFT_DESCRIPTION,
  DONGURI_WELCOME_GIFT_TITLE,
  DONGURI_WELCOME_MAIL_BODY,
  DONGURI_WELCOME_MAIL_TITLE,
  donguriReasonLabel,
  type DonguriChoView,
  type DonguriCreatedBy,
  type DonguriLedgerEntryView,
  type DonguriReason,
} from "@/lib/loghouse/donguriTypes";
import {
  MAILBOX_NOTICE_TYPE_BIRTHDAY_ACORN_DELIVERY,
  MAILBOX_NOTICE_TYPE_DAILY_ACORN_DELIVERY,
} from "@/lib/loghouse/mailboxNoticeTypes";

export type {
  DonguriAdminLedgerRow,
  DonguriChoView,
  DonguriLedgerEntryView,
  DonguriLedgerKind,
} from "@/lib/loghouse/donguriTypes";
export { formatDonguriDelta, getStubDonguriChoView } from "@/lib/loghouse/donguriTypes";

function toView(row: {
  id: string;
  amount: number;
  reason: string;
  title: string;
  description: string | null;
  dateKey: string | null;
  relatedNoticeId: string | null;
  relatedDiaryId?: string | null;
  createdBy: string;
  createdAt: Date;
}): DonguriLedgerEntryView {
  return {
    id: row.id,
    kind: row.amount >= 0 ? "delivery" : "spend",
    label: donguriReasonLabel(row.reason),
    reason: row.reason,
    title: row.title,
    description: row.description,
    delta: row.amount,
    dateKey: row.dateKey,
    relatedNoticeId: row.relatedNoticeId,
    relatedDiaryId: row.relatedDiaryId ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function sumDonguriBalance(params: {
  email: string;
  profileId: string;
}): Promise<number> {
  const profileId = params.profileId.trim();
  if (!profileId) return 0;

  if (shouldUseDonguriIdentityRead()) {
    const result = await sumDonguriBalanceUnderValueAuthority({ profileId });
    return result.ok ? result.balance : 0;
  }

  const email = normalizeEmail(params.email);
  if (!email) return 0;

  const agg = await prisma.logHouseDonguriLedgerEntry.aggregate({
    where: { email, profileId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/** アカウント全体（全プロフィール合算）。管理者一覧向け */
export async function sumDonguriBalanceForEmail(emailRaw: string): Promise<number> {
  const email = normalizeEmail(emailRaw);
  if (!email) return 0;
  const agg = await prisma.logHouseDonguriLedgerEntry.aggregate({
    where: { email },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function listDonguriLedgerEntries(params: {
  email: string;
  profileId?: string | null;
  take?: number;
}): Promise<DonguriLedgerEntryView[]> {
  const profileId = params.profileId?.trim() || null;
  const take = params.take ?? 80;

  if (shouldUseDonguriIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    if (ownership.state !== "BOUND" || !ownership.identityId) return [];
    const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: profileId
        ? { identityId: ownership.identityId, profileId }
        : { identityId: ownership.identityId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(toView);
  }

  const email = normalizeEmail(params.email);
  if (!email) return [];

  const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
    where: profileId ? { email, profileId } : { email },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toView);
}

export async function getDonguriChoView(params: {
  email: string;
  profileId: string;
  now?: Date;
}): Promise<DonguriChoView> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!profileId) {
    return { balance: 0, todayDelivery: null, recent: [] };
  }
  if (!shouldUseDonguriIdentityRead() && !email) {
    return { balance: 0, todayDelivery: null, recent: [] };
  }

  const now = params.now ?? new Date();
  const todayKey = calendarDayKeyInJapanFromDate(now);

  let todayWhere:
    | { email: string; profileId: string; reason: string; dateKey: string }
    | { identityId: string; profileId: string; reason: string; dateKey: string }
    | null = email
    ? { email, profileId, reason: "daily_delivery", dateKey: todayKey }
    : null;

  if (shouldUseDonguriIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    if (ownership.state === "BOUND" && ownership.identityId) {
      todayWhere = {
        identityId: ownership.identityId,
        profileId,
        reason: "daily_delivery",
        dateKey: todayKey,
      };
    } else {
      todayWhere = null;
    }
  }

  const [balance, recent, todayRow] = await Promise.all([
    sumDonguriBalance({ email: email || params.email, profileId }),
    listDonguriLedgerEntries({ email: email || params.email, profileId, take: 20 }),
    todayWhere
      ? prisma.logHouseDonguriLedgerEntry.findFirst({ where: todayWhere })
      : Promise.resolve(null),
  ]);

  return {
    balance,
    todayDelivery: todayRow
      ? { label: DONGURI_REASON_LABELS.daily_delivery, delta: todayRow.amount }
      : null,
    recent: recent.map((row) =>
      row.reason === "adjustment"
        ? {
            ...row,
            // ユーザー帳では事務メモを出さず、柔らかい表示名だけにする
            title: DONGURI_ADMIN_ADJUSTMENT_USER_TITLE,
            description: null,
          }
        : row,
    ),
  };
}

export type AppendDonguriEntryInput = {
  email: string;
  profileId: string;
  amount: number;
  reason: DonguriReason;
  title: string;
  description?: string | null;
  dateKey?: string | null;
  createdBy?: DonguriCreatedBy;
  relatedNoticeId?: string | null;
  relatedDiaryId?: string | null;
};

export async function appendDonguriLedgerEntry(
  input: AppendDonguriEntryInput,
): Promise<DonguriLedgerEntryView> {
  const email = normalizeEmail(input.email);
  const profileId = input.profileId.trim();
  if (!email || !profileId) {
    throw new Error("email / profileId が必要です");
  }
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    throw new Error("amount は 0 以外の整数が必要です");
  }

  let identityFields: { identityId?: string } = {};
  if (shouldUseDonguriIdentityMutation()) {
    // User-initiated path: authorize by identity. Admin createdBy bypasses
    // user spend auth but still dual-writes identity when BOUND (not from email alone).
    if ((input.createdBy ?? "system") === "user") {
      const spend = await authorizeDonguriSpendUnderValueAuthority({ profileId });
      if (!spend.ok) {
        throw new Error(`donguri_spend_denied:${spend.state}`);
      }
      identityFields = spend.writeIdentityId
        ? { identityId: spend.writeIdentityId }
        : {};
    } else {
      const ownership = await resolveValueIdentityOwnership();
      identityFields = donguriCreateIdentityFields({ ownership });
    }
  }

  const row = await prisma.logHouseDonguriLedgerEntry.create({
    data: {
      email,
      profileId,
      amount: Math.trunc(input.amount),
      reason: input.reason,
      title: input.title,
      description: input.description ?? null,
      dateKey: input.dateKey ?? null,
      createdBy: input.createdBy ?? "system",
      relatedNoticeId: input.relatedNoticeId ?? null,
      relatedDiaryId: input.relatedDiaryId ?? null,
      ...identityFields,
    },
  });
  return toView(row);
}

/**
 * ログハウス来訪時：1日1回だけどんぐり +1 とポストお手紙を届ける。
 * 既に配達済みなら何もしない。
 */
export async function ensureDailyAcornDelivery(params: {
  email: string;
  profileId: string;
  now?: Date;
}): Promise<{ delivered: boolean; balance: number }> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) {
    return { delivered: false, balance: 0 };
  }

  let identityFields: { identityId?: string } = {};
  if (shouldUseDonguriIdentityMutation()) {
    const ownership = await resolveValueIdentityOwnership();
    if (ownership.state !== "BOUND" || !ownership.identityId) {
      return { delivered: false, balance: 0 };
    }
    identityFields = donguriCreateIdentityFields({ ownership });
  }

  const now = params.now ?? new Date();
  const dateKey = calendarDayKeyInJapanFromDate(now);

  try {
    const existingWhere = shouldUseDonguriIdentityRead() && identityFields.identityId
      ? {
          identityId: identityFields.identityId,
          profileId,
          reason: "daily_delivery" as const,
          dateKey,
        }
      : {
          email,
          profileId,
          reason: "daily_delivery" as const,
          dateKey,
        };
    const existing = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: existingWhere,
      select: { id: true },
    });
    if (existing) {
      return { delivered: false, balance: await sumDonguriBalance({ email, profileId }) };
    }

    await prisma.$transaction(async (tx) => {
      const ledger = await tx.logHouseDonguriLedgerEntry.create({
        data: {
          email,
          profileId,
          amount: 1,
          reason: "daily_delivery",
          title: DONGURI_DAILY_DELIVERY_TITLE,
          description: DONGURI_DAILY_DELIVERY_DESCRIPTION,
          dateKey,
          createdBy: "system",
          ...identityFields,
        },
      });

      const notice = await tx.logHouseMailboxNotice.create({
        data: {
          email,
          profileId,
          type: MAILBOX_NOTICE_TYPE_DAILY_ACORN_DELIVERY,
          title: DONGURI_DAILY_MAIL_TITLE,
          message: DONGURI_DAILY_MAIL_BODY,
          actionLabel: "どんぐり帳を見る",
          actionRoute: DONGURI_PAGE_PATH,
          relatedLedgerId: ledger.id,
        },
      });

      await tx.logHouseDonguriLedgerEntry.update({
        where: { id: ledger.id },
        data: { relatedNoticeId: notice.id },
      });
    });

    return { delivered: true, balance: await sumDonguriBalance({ email, profileId }) };
  } catch (e) {
    // 競合で unique 違反など：既配達扱いに寄せる
    console.error("[daily acorn delivery failed]", {
      email,
      profileId,
      dateKey,
      error: e instanceof Error ? e.message : e,
    });
    return { delivered: false, balance: await sumDonguriBalance({ email, profileId }) };
  }
}

/** 管理者手動付与（確認ダイアログ後に呼ぶ） */
export async function grantDonguriByAdmin(params: {
  email: string;
  profileId: string;
  amount: number;
  description: string;
  notifyMailbox: boolean;
}): Promise<{ entry: DonguriLedgerEntryView; noticeId: string | null }> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const amount = Math.trunc(params.amount);
  if (!email || !profileId) throw new Error("email / profileId が必要です");
  if (!Number.isFinite(amount) || amount === 0) throw new Error("付与数は 0 以外にしてください");

  const description = params.description.trim() || "管理者からのおとどけ";
  const title = DONGURI_REASON_LABELS.admin_grant;

  if (!params.notifyMailbox) {
    const entry = await appendDonguriLedgerEntry({
      email,
      profileId,
      amount,
      reason: "admin_grant",
      title,
      description,
      createdBy: "admin",
    });
    return { entry, noticeId: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    const ledger = await tx.logHouseDonguriLedgerEntry.create({
      data: {
        email,
        profileId,
        amount,
        reason: "admin_grant",
        title,
        description,
        createdBy: "admin",
      },
    });

    const abs = Math.abs(amount);
    const notice = await tx.logHouseMailboxNotice.create({
      data: {
        email,
        profileId,
        type: "system_notice",
        title,
        message: [
          `どんぐりが${abs}こ届きました。`,
          description,
        ].join("\n"),
        actionLabel: "どんぐり帳を見る",
        actionRoute: DONGURI_PAGE_PATH,
        relatedLedgerId: ledger.id,
      },
    });

    const updated = await tx.logHouseDonguriLedgerEntry.update({
      where: { id: ledger.id },
      data: { relatedNoticeId: notice.id },
    });

    return { ledger: updated, noticeId: notice.id };
  });

  return { entry: toView(result.ledger), noticeId: result.noticeId };
}

/**
 * 管理者による残高調整（台帳に adjustment を追加。残高の直接更新はしない）。
 * ポスト通知は送らない（テスト調整用）。
 */
export async function adjustDonguriByAdmin(params: {
  email: string;
  profileId: string;
  amount: number;
  description?: string | null;
}): Promise<{
  entry: DonguriLedgerEntryView;
  previousBalance: number;
  nextBalance: number;
}> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const amount = Math.trunc(params.amount);
  if (!email || !profileId) throw new Error("email / profileId が必要です");
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("調整数は 0 以外の整数にしてください");
  }

  const previousBalance = await sumDonguriBalance({ email, profileId });
  const description = params.description?.trim() || null;

  const entry = await appendDonguriLedgerEntry({
    email,
    profileId,
    amount,
    reason: "adjustment",
    title: DONGURI_ADMIN_ADJUSTMENT_TITLE,
    description,
    createdBy: "admin",
  });

  const nextBalance = previousBalance + amount;
  return { entry, previousBalance, nextBalance };
}

/** 指定残高になるよう adjustment を追加（例: 不足時導線確認で 2こにする） */
export async function adjustDonguriByAdminToTarget(params: {
  email: string;
  profileId: string;
  targetBalance: number;
  description?: string | null;
}): Promise<{
  entry: DonguriLedgerEntryView;
  previousBalance: number;
  nextBalance: number;
}> {
  const target = Math.trunc(params.targetBalance);
  if (!Number.isFinite(target)) {
    throw new Error("目標残高が不正です");
  }

  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) throw new Error("email / profileId が必要です");

  const previousBalance = await sumDonguriBalance({ email, profileId });
  const amount = target - previousBalance;
  if (amount === 0) {
    throw new Error(`すでに ${target}こです。調整は不要です。`);
  }

  return adjustDonguriByAdmin({
    email,
    profileId,
    amount,
    description:
      params.description?.trim() ||
      `残高を${target}こに調整（不足時導線確認）`,
  });
}

/**
 * アカウント代表プロフィール（最初に作成された Profile）の誕生日に、
 * 1アカウント年1回だけ birthday_gift +20 とポストをお届けする。
 * 台帳の profileId は代表プロフィール。お手紙は訪問中の activeProfileId へ。
 */
export async function ensureBirthdayAcornGift(params: {
  email: string;
  /** お手紙を届けるプロフィール（ログハウス訪問中） */
  activeProfileId: string;
  now?: Date;
}): Promise<{ delivered: boolean }> {
  const email = normalizeEmail(params.email);
  const activeProfileId = params.activeProfileId.trim();
  if (!email || !activeProfileId) return { delivered: false };

  const now = params.now ?? new Date();
  const year = japanCalendarYearFromDate(now);
  const dateKey = birthdayGiftDateKey(year);

  try {
    const already = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { email, reason: "birthday_gift", dateKey },
      select: { id: true },
    });
    if (already) return { delivered: false };

    const representative = await prisma.profile.findFirst({
      where: { email },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!representative) return { delivered: false };

    const order = await prisma.order.findFirst({
      where: { email, profileId: representative.id },
      orderBy: { createdAt: "asc" },
      select: { birthMonth: true, birthDay: true },
    });
    if (!order) return { delivered: false };

    if (
      !isAccountBirthdayInJapan({
        birthMonth: order.birthMonth,
        birthDay: order.birthDay,
        now,
      })
    ) {
      return { delivered: false };
    }

    await prisma.$transaction(async (tx) => {
      const ledger = await tx.logHouseDonguriLedgerEntry.create({
        data: {
          email,
          profileId: representative.id,
          amount: DONGURI_BIRTHDAY_GIFT_AMOUNT,
          reason: "birthday_gift",
          title: DONGURI_BIRTHDAY_GIFT_TITLE,
          description: DONGURI_BIRTHDAY_GIFT_DESCRIPTION,
          dateKey,
          createdBy: "system",
        },
      });

      const notice = await tx.logHouseMailboxNotice.create({
        data: {
          email,
          profileId: activeProfileId,
          type: MAILBOX_NOTICE_TYPE_BIRTHDAY_ACORN_DELIVERY,
          title: DONGURI_BIRTHDAY_MAIL_TITLE,
          message: DONGURI_BIRTHDAY_MAIL_BODY,
          actionLabel: "どんぐり帳を見る",
          actionRoute: DONGURI_PAGE_PATH,
          relatedLedgerId: ledger.id,
        },
      });

      await tx.logHouseDonguriLedgerEntry.update({
        where: { id: ledger.id },
        data: { relatedNoticeId: notice.id },
      });
    });

    return { delivered: true };
  } catch (e) {
    console.error("[birthday acorn gift failed]", {
      email,
      activeProfileId,
      dateKey,
      error: e instanceof Error ? e.message : e,
    });
    return { delivered: false };
  }
}

export function diarySaveLedgerDateKey(journalEntryId: string): string {
  return `entry:${journalEntryId.trim()}`;
}

/**
 * 森にあしあとを残す：日記1件につき -3（二重消費防止）。
 * 残高不足時は charged:false / insufficient:true。
 */
export async function chargeDiarySaveAcorns(params: {
  email: string;
  profileId: string;
  journalEntryId: string;
}): Promise<{
  charged: boolean;
  alreadyCharged: boolean;
  insufficient: boolean;
  balance: number;
  entry: DonguriLedgerEntryView | null;
}> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const journalEntryId = params.journalEntryId.trim();
  if (!email || !profileId || !journalEntryId) {
    return {
      charged: false,
      alreadyCharged: false,
      insufficient: false,
      balance: 0,
      entry: null,
    };
  }

  if (shouldUseDonguriIdentityMutation()) {
    const spend = await authorizeDonguriSpendUnderValueAuthority({ profileId });
    if (!spend.ok) {
      return {
        charged: false,
        alreadyCharged: false,
        insufficient: false,
        balance: 0,
        entry: null,
      };
    }
  }

  const dateKey = diarySaveLedgerDateKey(journalEntryId);
  const existing = await prisma.logHouseDonguriLedgerEntry.findFirst({
    where: {
      OR: [
        { relatedDiaryId: journalEntryId, reason: "diary_save" },
        { email, profileId, reason: "diary_save", dateKey },
      ],
    },
  });
  if (existing) {
    return {
      charged: false,
      alreadyCharged: true,
      insufficient: false,
      balance: await sumDonguriBalance({ email, profileId }),
      entry: toView(existing),
    };
  }

  const balance = await sumDonguriBalance({ email, profileId });
  if (balance < DONGURI_DIARY_SAVE_COST) {
    return {
      charged: false,
      alreadyCharged: false,
      insufficient: true,
      balance,
      entry: null,
    };
  }

  try {
    const entry = await appendDonguriLedgerEntry({
      email,
      profileId,
      amount: -DONGURI_DIARY_SAVE_COST,
      reason: "diary_save",
      title: DONGURI_DIARY_SAVE_TITLE,
      description: DONGURI_DIARY_SAVE_DESCRIPTION,
      dateKey,
      createdBy: "user",
      relatedDiaryId: journalEntryId,
    });
    return {
      charged: true,
      alreadyCharged: false,
      insufficient: false,
      balance: await sumDonguriBalance({ email, profileId }),
      entry,
    };
  } catch (e) {
    // unique 競合 → 既課金扱い
    const again = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { relatedDiaryId: journalEntryId, reason: "diary_save" },
    });
    if (again) {
      return {
        charged: false,
        alreadyCharged: true,
        insufficient: false,
        balance: await sumDonguriBalance({ email, profileId }),
        entry: toView(again),
      };
    }
    console.error("[diary save acorn charge failed]", {
      email,
      profileId,
      journalEntryId,
      error: e instanceof Error ? e.message : e,
    });
    throw e;
  }
}

/** 森の住民登録お祝い +50（アカウントにつき1回） */
export async function ensureWelcomeAcornGift(params: {
  email: string;
  profileId: string;
}): Promise<{ delivered: boolean }> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) return { delivered: false };

  const already = await prisma.logHouseDonguriLedgerEntry.findFirst({
    where: { email, reason: "welcome_gift" },
    select: { id: true },
  });
  if (already) return { delivered: false };

  const dateKey = "welcome";
  try {
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.logHouseDonguriLedgerEntry.create({
        data: {
          email,
          profileId,
          amount: DONGURI_WELCOME_GIFT_AMOUNT,
          reason: "welcome_gift",
          title: DONGURI_WELCOME_GIFT_TITLE,
          description: DONGURI_WELCOME_GIFT_DESCRIPTION,
          dateKey,
          createdBy: "system",
        },
      });

      const notice = await tx.logHouseMailboxNotice.create({
        data: {
          email,
          profileId,
          type: MAILBOX_NOTICE_TYPE_DAILY_ACORN_DELIVERY,
          title: DONGURI_WELCOME_MAIL_TITLE,
          message: DONGURI_WELCOME_MAIL_BODY,
          actionLabel: "どんぐり帳を見る",
          actionRoute: DONGURI_PAGE_PATH,
          relatedLedgerId: ledger.id,
        },
      });

      await tx.logHouseDonguriLedgerEntry.update({
        where: { id: ledger.id },
        data: { relatedNoticeId: notice.id },
      });
    });
    return { delivered: true };
  } catch (e) {
    console.error("[welcome acorn gift failed]", {
      email,
      profileId,
      error: e instanceof Error ? e.message : e,
    });
    return { delivered: false };
  }
}
