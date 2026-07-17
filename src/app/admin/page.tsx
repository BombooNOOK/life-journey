import { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminUserDirectory, type AdminDirectoryRow } from "@/components/admin/AdminUserDirectory";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { backfillMissingMemberNumbers } from "@/lib/account/accountMemberNumber";
import { prisma } from "@/lib/db";
import { formatAdminEffectiveProfileLimitLabel } from "@/lib/profile/effectiveProfileLimit";
import { journalWithCompanionPath } from "@/lib/journal/journalNav";
import { COMPANION_WRITING_FORMAL_TITLE } from "@/lib/journal/companionWriting/types";
import { LOG_HOUSE_SHORT_LABEL, LOG_HOUSE_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  searchParams: Promise<{ q?: string; saved?: string; err?: string }>;
};

type UserRow = {
  email: string;
  sourceOrderCount: number;
  sourceJournalCount: number;
  profileIds: string[];
  profileNames: string[];
  /** AccountSettings.createdAt（プラン開始日の暫定表示用） */
  accountSettingsCreatedAt: Date | null;
  firstAppraisalAt: Date | null;
  /** 登録順の会員番号（AccountSettings.memberNumber） */
  memberNumber: number | null;
  isAdmin: boolean;
  isMonitor: boolean;
  profileLimit: number;
  /** 鑑定PDFの無料ダウンロード上限（鑑定1件あたり） */
  pdfDownloadLimitPerOrder: number;
  /** 鑑定書の高画質PDFダウンロード権限 */
  subscriberPdfAccess: boolean;
};

type ProfileMeta = { id: string; nickname: string };

function isPostgresDb(): boolean {
  const u = process.env.DATABASE_URL ?? "";
  if (u.startsWith("file:") || u.includes("sqlite")) return false;
  return (
    u.startsWith("postgresql") ||
    u.startsWith("postgres") ||
    u.startsWith("prisma+postgres") ||
    u.startsWith("prisma+postgresql")
  );
}

function countCell(v: bigint | number): number {
  const n = typeof v === "bigint" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function derivePlanLabel(subscriberPdfAccess: boolean): string {
  return subscriberPdfAccess ? "森の定期便" : "フリープラン";
}

function formatPlanStartedAt(row: UserRow): string {
  if (!row.subscriberPdfAccess) return "—";
  if (!row.accountSettingsCreatedAt) return "未設定";
  return row.accountSettingsCreatedAt.toLocaleDateString("ja-JP");
}

function formatFirstAppraisalAt(at: Date | null): string {
  if (!at) return "未設定";
  return at.toLocaleDateString("ja-JP");
}

/** LIKE 用に % _ を検索語から外す（ワイルドカード注入回避の簡易版） */
function likePatternFromKeyword(keyword: string): string {
  const safe = keyword.replace(/[%_]/g, "");
  return `%${safe}%`;
}

/** メールごとの鑑定 PDF 上限の実効値（AccountSettings が読めないときも Order から表示できる） */
async function loadOrderPdfMaxByNormalizedEmailPostgres(keyword: string): Promise<Map<string, number>> {
  const kw = keyword.trim();
  const rows =
    kw.length > 0
      ? await prisma.$queryRaw<Array<{ e: string; m: number | bigint | null }>>`
          SELECT LOWER(TRIM("email")) AS e, MAX("pdfDownloadLimit")::int AS m
          FROM "Order"
          WHERE LOWER(TRIM("email")) LIKE LOWER(${likePatternFromKeyword(kw)})
          GROUP BY LOWER(TRIM("email"))
        `
      : await prisma.$queryRaw<Array<{ e: string; m: number | bigint | null }>>`
          SELECT LOWER(TRIM("email")) AS e, MAX("pdfDownloadLimit")::int AS m
          FROM "Order"
          GROUP BY LOWER(TRIM("email"))
        `;
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = normalizeEmail(r.e);
    const raw = r.m;
    const n = raw == null ? 2 : typeof raw === "bigint" ? Number(raw) : Number(raw);
    if (!Number.isFinite(n)) continue;
    map.set(key, Math.max(0, Math.min(999, Math.trunc(n))));
  }
  return map;
}

type RawEmailCount = { e: string; c: bigint | number };

/** PostgreSQL: Prisma の groupBy / insensitive より確実にメール別件数を取る */
async function loadRowsPostgres(
  keyword: string,
  matchedProfileEmails: Set<string>,
): Promise<UserRow[]> {
  const kw = keyword.trim();
  const pattern = kw ? likePatternFromKeyword(kw) : "";

  const [orderRows, journalRows, settingsList, orderPdfMaxByEmail, firstPurchaseRows] =
    await Promise.all([
    kw
      ? prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "Order"
          WHERE LOWER(TRIM("email")) LIKE LOWER(${pattern})
          GROUP BY LOWER(TRIM("email"))
        `
      : prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "Order"
          GROUP BY LOWER(TRIM("email"))
        `,
    kw
      ? prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "JournalEntry"
          WHERE LOWER(TRIM("email")) LIKE LOWER(${pattern})
          GROUP BY LOWER(TRIM("email"))
        `
      : prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "JournalEntry"
          GROUP BY LOWER(TRIM("email"))
        `,
    fetchAccountSettingsForAdminList(kw),
      loadOrderPdfMaxByNormalizedEmailPostgres(kw),
      kw
        ? prisma.$queryRaw<Array<{ e: string; firstAt: Date | null }>>`
            SELECT LOWER(TRIM("email")) AS e, MIN("createdAt") AS "firstAt"
            FROM "Order"
            WHERE LOWER(TRIM("email")) LIKE LOWER(${pattern})
            GROUP BY LOWER(TRIM("email"))
          `
        : prisma.$queryRaw<Array<{ e: string; firstAt: Date | null }>>`
            SELECT LOWER(TRIM("email")) AS e, MIN("createdAt") AS "firstAt"
            FROM "Order"
            GROUP BY LOWER(TRIM("email"))
          `,
    ]);

  const orderCountByEmail = new Map<string, number>();
  for (const r of orderRows) {
    const key = normalizeEmail(r.e);
    orderCountByEmail.set(key, (orderCountByEmail.get(key) ?? 0) + countCell(r.c));
  }
  const journalCountByEmail = new Map<string, number>();
  for (const r of journalRows) {
    const key = normalizeEmail(r.e);
    journalCountByEmail.set(key, (journalCountByEmail.get(key) ?? 0) + countCell(r.c));
  }

  const settingsByEmail = collapseAccountSettingsByNormalizedEmail(settingsList);
  const firstPurchaseAtByEmail = new Map<string, Date | null>();
  for (const row of firstPurchaseRows) {
    firstPurchaseAtByEmail.set(normalizeEmail(row.e), row.firstAt ?? null);
  }

  if (kw.length > 0 && matchedProfileEmails.size > 0) {
    const matchedEmails = Array.from(matchedProfileEmails);
    const [extraOrderRows, extraJournalRows, extraFirstPurchaseRows, extraSettingsRows] =
      await Promise.all([
        prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "Order"
          WHERE LOWER(TRIM("email")) IN (${Prisma.join(matchedEmails)})
          GROUP BY LOWER(TRIM("email"))
        `,
        prisma.$queryRaw<RawEmailCount[]>`
          SELECT LOWER(TRIM("email")) AS e, COUNT(*)::bigint AS c
          FROM "JournalEntry"
          WHERE LOWER(TRIM("email")) IN (${Prisma.join(matchedEmails)})
          GROUP BY LOWER(TRIM("email"))
        `,
        prisma.$queryRaw<Array<{ e: string; firstAt: Date | null }>>`
          SELECT LOWER(TRIM("email")) AS e, MIN("createdAt") AS "firstAt"
          FROM "Order"
          WHERE LOWER(TRIM("email")) IN (${Prisma.join(matchedEmails)})
          GROUP BY LOWER(TRIM("email"))
        `,
        prisma.accountSettings.findMany({
          where: { email: { in: matchedEmails } },
          select: {
            id: true,
            email: true,
            createdAt: true,
            isAdmin: true,
            isMonitor: true,
            profileLimit: true,
            updatedAt: true,
            pdfDownloadLimitPerOrder: true,
            subscriberPdfAccess: true,
          },
        }),
      ]);
    for (const r of extraOrderRows) {
      orderCountByEmail.set(normalizeEmail(r.e), countCell(r.c));
    }
    for (const r of extraJournalRows) {
      journalCountByEmail.set(normalizeEmail(r.e), countCell(r.c));
    }
    for (const r of extraFirstPurchaseRows) {
      firstPurchaseAtByEmail.set(normalizeEmail(r.e), r.firstAt ?? null);
    }
    const merged = collapseAccountSettingsByNormalizedEmail([...settingsList, ...extraSettingsRows]);
    for (const [k, v] of merged.entries()) settingsByEmail.set(k, v);
  }

  const emails = new Set<string>([
    ...orderCountByEmail.keys(),
    ...journalCountByEmail.keys(),
    ...settingsByEmail.keys(),
    ...matchedProfileEmails,
  ]);
  return Array.from(emails)
    .map((email) => {
      const setting = settingsByEmail.get(email);
      const fromAccount = setting?.pdfDownloadLimitPerOrder ?? 2;
      const fromOrders = orderPdfMaxByEmail.get(email) ?? 2;
      return {
        email,
        sourceOrderCount: orderCountByEmail.get(email) ?? 0,
        sourceJournalCount: journalCountByEmail.get(email) ?? 0,
        profileIds: [],
        profileNames: [],
        accountSettingsCreatedAt: setting?.createdAt ?? null,
        firstAppraisalAt: firstPurchaseAtByEmail.get(email) ?? null,
        memberNumber: setting?.memberNumber ?? null,
        isAdmin: setting?.isAdmin ?? false,
        isMonitor: setting?.isMonitor ?? false,
        profileLimit: setting?.profileLimit ?? 1,
        pdfDownloadLimitPerOrder: Math.max(fromAccount, fromOrders),
        subscriberPdfAccess: setting?.subscriberPdfAccess ?? false,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, 2000);
}

type AccountSettingsAdminRow = {
  id: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  isMonitor?: boolean | null;
  profileLimit: number;
  updatedAt: Date;
  pdfDownloadLimitPerOrder?: number | null;
  subscriberPdfAccess?: boolean | null;
  memberNumber?: number | null;
};

type CollapsedAccountSettings = {
  id: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  isMonitor: boolean;
  profileLimit: number;
  pdfDownloadLimitPerOrder: number;
  subscriberPdfAccess: boolean;
  memberNumber: number | null;
  updatedAt: Date;
};

/**
 * email の大小区別で AccountSettings が複数行あっても、PDF 上限などは「実効値」が一覧に出るようマージする。
 * （updatedAt だけ新しい行を採用すると、別行にだけ保存した上限 6 が 2 表示になる）
 */
function collapseAccountSettingsByNormalizedEmail(
  settingsList: AccountSettingsAdminRow[],
): Map<string, CollapsedAccountSettings> {
  const groups = new Map<string, AccountSettingsAdminRow[]>();
  for (const s of settingsList) {
    const key = normalizeEmail(s.email);
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  const out = new Map<string, CollapsedAccountSettings>();
  for (const [key, arr] of groups) {
    let latest = arr[0]!;
    let earliestCreatedAt = arr[0]!.createdAt;
    for (const s of arr) {
      if (s.updatedAt > latest.updatedAt) latest = s;
      if (s.createdAt < earliestCreatedAt) earliestCreatedAt = s.createdAt;
    }
    const pdfDownloadLimitPerOrder = Math.max(
      ...arr.map((s) => (s.pdfDownloadLimitPerOrder != null ? s.pdfDownloadLimitPerOrder : 2)),
    );
    const subscriberPdfAccess = arr.some((s) => s.subscriberPdfAccess === true);
    const isAdmin = arr.some((s) => s.isAdmin === true);
    const isMonitor = arr.some((s) => s.isMonitor === true);
    const profileLimit = Math.max(...arr.map((s) => s.profileLimit));
    const memberNumbers = arr
      .map((s) => s.memberNumber)
      .filter((n): n is number => n != null && Number.isFinite(n));
    const memberNumber = memberNumbers.length > 0 ? Math.min(...memberNumbers) : null;

    out.set(key, {
      id: latest.id,
      email: latest.email,
      createdAt: earliestCreatedAt,
      isAdmin,
      isMonitor,
      profileLimit,
      pdfDownloadLimitPerOrder,
      subscriberPdfAccess,
      memberNumber,
      updatedAt: latest.updatedAt,
    });
  }
  return out;
}

/**
 * PostgreSQL: 初回 AccountSettings マイグレーションに必ずある列だけで Raw SELECT（本番が追いついていないときも落ちない）。
 * pdf / subscriber 列はマイグレーション済みなら別クエリでマージ（列が無ければ黙ってデフォルト表示）。
 */
async function fetchAccountSettingsForAdminList(keyword: string): Promise<AccountSettingsAdminRow[]> {
  const kw = keyword.trim();

  if (isPostgresDb()) {
    let base: AccountSettingsAdminRow[];
    try {
      if (!kw) {
        base = await prisma.$queryRaw<AccountSettingsAdminRow[]>`
          SELECT "id", "email", "createdAt", "isAdmin", "profileLimit", "updatedAt"
          FROM "AccountSettings"
          ORDER BY "updatedAt" DESC
        `;
      } else {
        const pattern = likePatternFromKeyword(kw);
        base = await prisma.$queryRaw<AccountSettingsAdminRow[]>`
          SELECT "id", "email", "createdAt", "isAdmin", "profileLimit", "updatedAt"
          FROM "AccountSettings"
          WHERE LOWER(TRIM("email")) LIKE LOWER(${pattern})
          ORDER BY "updatedAt" DESC
        `;
      }
    } catch (e) {
      console.error("[admin] fetchAccountSettings base (raw) failed:", e);
      return [];
    }

    const ids = base.map((r) => r.id);
    if (ids.length === 0) return base;

    try {
      const extras = await prisma.$queryRaw<
        Array<{
          id: string;
          pdfDownloadLimitPerOrder: number | null;
          subscriberPdfAccess: boolean | null;
          isMonitor: boolean | null;
          memberNumber: number | null;
        }>
      >`
        SELECT "id", "pdfDownloadLimitPerOrder", "subscriberPdfAccess", "isMonitor", "memberNumber"
        FROM "AccountSettings"
        WHERE "id" IN (${Prisma.join(ids)})
      `;
      const byId = new Map(extras.map((x) => [x.id, x]));
      return base.map((row) => {
        const x = byId.get(row.id);
        return {
          ...row,
          pdfDownloadLimitPerOrder: x?.pdfDownloadLimitPerOrder ?? null,
          subscriberPdfAccess: x?.subscriberPdfAccess ?? null,
          isMonitor: x?.isMonitor ?? null,
          memberNumber: x?.memberNumber ?? null,
        };
      });
    } catch {
      // memberNumber 列未適用時など: PDF / monitor だけ再試行
      try {
        const extras = await prisma.$queryRaw<
          Array<{
            id: string;
            pdfDownloadLimitPerOrder: number | null;
            subscriberPdfAccess: boolean | null;
            isMonitor: boolean | null;
          }>
        >`
          SELECT "id", "pdfDownloadLimitPerOrder", "subscriberPdfAccess", "isMonitor"
          FROM "AccountSettings"
          WHERE "id" IN (${Prisma.join(ids)})
        `;
        const byId = new Map(extras.map((x) => [x.id, x]));
        return base.map((row) => {
          const x = byId.get(row.id);
          return {
            ...row,
            pdfDownloadLimitPerOrder: x?.pdfDownloadLimitPerOrder ?? null,
            subscriberPdfAccess: x?.subscriberPdfAccess ?? null,
            isMonitor: x?.isMonitor ?? null,
            memberNumber: null,
          };
        });
      } catch {
        return base.map((row) => ({
          ...row,
          pdfDownloadLimitPerOrder: null,
          subscriberPdfAccess: null,
          isMonitor: null,
          memberNumber: null,
        }));
      }
    }
  }

  try {
    return await prisma.accountSettings.findMany({
      where: kw ? { email: { contains: kw } } : {},
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        isMonitor: true,
        profileLimit: true,
        pdfDownloadLimitPerOrder: true,
        subscriberPdfAccess: true,
        memberNumber: true,
        updatedAt: true,
      },
    });
  } catch (e) {
    console.warn("[admin] fetchAccountSettings findMany fallback:", e);
    return prisma.accountSettings.findMany({
      where: kw ? { email: { contains: kw } } : {},
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        isMonitor: true,
        profileLimit: true,
        updatedAt: true,
      },
    });
  }
}

/** メール部分一致（失敗時は大小区別あり）。SQLite 等のフォールバック */
function emailContainsWhere(keyword: string, preferInsensitive: boolean) {
  if (!preferInsensitive) {
    return { email: { contains: keyword } };
  }
  return {
    email: {
      contains: keyword,
      mode: "insensitive" as const,
    },
  };
}

async function searchMatchedEmailsByProfileId(keyword: string): Promise<Set<string>> {
  const kw = keyword.trim();
  if (!kw) return new Set();
  const rows = await prisma.profile.findMany({
    where: {
      id: { contains: kw, mode: "insensitive" },
      isArchived: false,
    },
    select: { email: true },
    take: 200,
  });
  return new Set(rows.map((r) => normalizeEmail(r.email)));
}

async function loadProfileMetaByEmails(emails: string[]): Promise<Map<string, ProfileMeta[]>> {
  if (emails.length === 0) return new Map();
  const rows = await prisma.profile.findMany({
    where: {
      email: { in: emails },
      isArchived: false,
    },
    orderBy: { createdAt: "asc" },
    select: { email: true, id: true, nickname: true },
  });
  const out = new Map<string, ProfileMeta[]>();
  for (const row of rows) {
    const key = normalizeEmail(row.email);
    const arr = out.get(key) ?? [];
    arr.push({ id: row.id, nickname: row.nickname });
    out.set(key, arr);
  }
  return out;
}

async function loadRowsWithEmailMode(
  keyword: string,
  insensitive: boolean,
  matchedProfileEmails: Set<string>,
): Promise<UserRow[]> {
  const where = keyword ? emailContainsWhere(keyword, insensitive) : {};

  const [orderGroups, journalGroups, settings, orderPdfMaxByEmail] = await Promise.all([
    prisma.order.groupBy({
      by: ["email"],
      where,
      _count: { _all: true },
      orderBy: { email: "asc" },
    }),
    prisma.journalEntry.groupBy({
      by: ["email"],
      where,
      _count: { _all: true },
      orderBy: { email: "asc" },
    }),
    fetchAccountSettingsForAdminList(keyword),
    isPostgresDb()
      ? loadOrderPdfMaxByNormalizedEmailPostgres(keyword)
      : Promise.resolve(new Map<string, number>()),
  ]);

  const orderCountByEmail = new Map<string, number>();
  for (const g of orderGroups) {
    const key = normalizeEmail(g.email);
    orderCountByEmail.set(key, (orderCountByEmail.get(key) ?? 0) + g._count._all);
  }
  const journalCountByEmail = new Map<string, number>();
  for (const g of journalGroups) {
    const key = normalizeEmail(g.email);
    journalCountByEmail.set(key, (journalCountByEmail.get(key) ?? 0) + g._count._all);
  }

  const settingsByEmail = collapseAccountSettingsByNormalizedEmail(settings);

  if (keyword.trim().length > 0 && matchedProfileEmails.size > 0) {
    const matchedEmails = Array.from(matchedProfileEmails);
    const [extraOrderGroups, extraJournalGroups, extraSettings] = await Promise.all([
      prisma.order.groupBy({
        by: ["email"],
        where: { email: { in: matchedEmails } },
        _count: { _all: true },
      }),
      prisma.journalEntry.groupBy({
        by: ["email"],
        where: { email: { in: matchedEmails } },
        _count: { _all: true },
      }),
      prisma.accountSettings.findMany({
        where: { email: { in: matchedEmails } },
        select: {
          id: true,
          email: true,
          createdAt: true,
          isAdmin: true,
          isMonitor: true,
          profileLimit: true,
          updatedAt: true,
          pdfDownloadLimitPerOrder: true,
          subscriberPdfAccess: true,
        },
      }),
    ]);
    for (const g of extraOrderGroups) {
      orderCountByEmail.set(normalizeEmail(g.email), g._count._all);
    }
    for (const g of extraJournalGroups) {
      journalCountByEmail.set(normalizeEmail(g.email), g._count._all);
    }
    const merged = collapseAccountSettingsByNormalizedEmail([...settings, ...extraSettings]);
    for (const [k, v] of merged.entries()) settingsByEmail.set(k, v);
  }

  const emails = new Set<string>([
    ...orderCountByEmail.keys(),
    ...journalCountByEmail.keys(),
    ...settingsByEmail.keys(),
    ...matchedProfileEmails,
  ]);
  return Array.from(emails)
    .map((email) => {
      const setting = settingsByEmail.get(email);
      const fromAccount = setting?.pdfDownloadLimitPerOrder ?? 2;
      const fromOrders = orderPdfMaxByEmail.get(email) ?? 2;
      return {
        email,
        sourceOrderCount: orderCountByEmail.get(email) ?? 0,
        sourceJournalCount: journalCountByEmail.get(email) ?? 0,
        profileIds: [],
        profileNames: [],
        accountSettingsCreatedAt: setting?.createdAt ?? null,
        firstAppraisalAt: null,
        memberNumber: setting?.memberNumber ?? null,
        isAdmin: setting?.isAdmin ?? false,
        isMonitor: setting?.isMonitor ?? false,
        profileLimit: setting?.profileLimit ?? 1,
        pdfDownloadLimitPerOrder: Math.max(fromAccount, fromOrders),
        subscriberPdfAccess: setting?.subscriberPdfAccess ?? false,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, 2000);
}

async function loadRows(keyword: string, matchedProfileEmails: Set<string>): Promise<UserRow[]> {
  const kw = keyword.trim().toLowerCase();
  if (isPostgresDb()) {
    try {
      return await loadRowsPostgres(kw, matchedProfileEmails);
    } catch (e) {
      console.warn("[admin] loadRowsPostgres failed, falling back to Prisma:", e);
    }
  }
  try {
    return await loadRowsWithEmailMode(kw, true, matchedProfileEmails);
  } catch (e) {
    console.warn("[admin] loadRows insensitive failed, retrying:", e);
    return loadRowsWithEmailMode(kw, false, matchedProfileEmails);
  }
}

export default async function AdminPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) notFound();

  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const flashSaved = params.saved;
  const flashErr = params.err;
  const companionWritingHref = journalWithCompanionPath("/admin");
  const loginToCompanionHref = `/login?returnTo=${encodeURIComponent(companionWritingHref)}`;
  let rows: UserRow[] = [];
  let loadError: string | null = null;
  try {
    await backfillMissingMemberNumbers(200);
    const matchedProfileEmails = await searchMatchedEmailsByProfileId(q);
    rows = await loadRows(q, matchedProfileEmails);
    const profileMetaByEmail = await loadProfileMetaByEmails(rows.map((r) => r.email));
    rows = rows.map((row) => {
      const metas = profileMetaByEmail.get(row.email) ?? [];
      return {
        ...row,
        profileIds: metas.map((m) => m.id),
        profileNames: metas.map((m) => m.nickname),
      };
    });
  } catch (e) {
    console.error("[admin] loadRows:", e);
    loadError =
      process.env.NODE_ENV === "development"
        ? e instanceof Error
          ? e.message
          : String(e)
        : "ユーザー一覧の取得に失敗しました";
  }

  const directoryRows: AdminDirectoryRow[] = rows.map((row) => ({
    email: row.email,
    memberNumber: row.memberNumber,
    registeredAt:
      row.accountSettingsCreatedAt?.toISOString() ??
      row.firstAppraisalAt?.toISOString() ??
      null,
    profileIds: row.profileIds,
    profileNames: row.profileNames,
    planLabel: derivePlanLabel(row.subscriberPdfAccess),
    planStartedLabel: formatPlanStartedAt(row),
    firstAppraisalLabel: formatFirstAppraisalAt(row.firstAppraisalAt),
    sourceOrderCount: row.sourceOrderCount,
    sourceJournalCount: row.sourceJournalCount,
    isAdmin: row.isAdmin,
    isMonitor: row.isMonitor,
    profileLimit: row.profileLimit,
    monitorLimitLabel: row.isMonitor
      ? formatAdminEffectiveProfileLimitLabel({
          isMonitor: true,
          profileLimit: row.profileLimit,
        })
      : null,
    pdfDownloadLimitPerOrder: row.pdfDownloadLimitPerOrder,
    subscriberPdfAccess: row.subscriberPdfAccess,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← {LOG_HOUSE_TO_LABEL}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">管理者ページ</h1>
        <p className="mt-1 text-sm text-stone-600">
          ユーザー検索と、プロフィール上限（1 /
          3）、鑑定書PDFの無料ダウンロード上限、鑑定書の高画質PDFダウンロード権限、管理者権限の切り替えを行います。
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/admin/kantei-book-binding"
            className="text-sm font-medium text-violet-800 underline-offset-2 hover:underline"
          >
            鑑定書 製本申込予定一覧 →
          </Link>
          <Link
            href="/admin/diary-book-binding"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            日記 製本申込予定一覧 →
          </Link>
          <Link
            href="/admin/journal-backup-restore"
            className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
          >
            日記バックアップ復元 →
          </Link>
          <Link
            href="/admin/profile-management"
            className="text-sm font-medium text-red-900 underline-offset-2 hover:underline"
          >
            プロフィール管理 →
          </Link>
          <Link
            href="/admin/support-inquiries"
            className="text-sm font-medium text-sky-900 underline-offset-2 hover:underline"
          >
            お問い合わせ一覧 →
          </Link>
          <Link
            href="/admin/intro-cards"
            className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            対面紹介用カード →
          </Link>
          <Link
            href="/admin/post-atelier"
            className="text-sm font-medium text-violet-900 underline-offset-2 hover:underline"
          >
            BambooNOOK 投稿アトリエ →
          </Link>
          <Link
            href="/admin/system-notices"
            className="text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
          >
            森からのお知らせ →
          </Link>
        </p>
      </div>

      <section
        className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 p-4"
        aria-labelledby="admin-verification-shortcuts-heading"
      >
        <h2 id="admin-verification-shortcuts-heading" className="text-sm font-semibold text-emerald-950">
          実機確認用ショートカット（検証中のみ）
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          伴走導線の本番確認用です。公開 GO 前に削除予定。
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href={companionWritingHref}
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            {COMPANION_WRITING_FORMAL_TITLE} →
          </Link>
          <Link
            href="/orders/calendar"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            カレンダー →
          </Link>
          <Link
            href="/orders"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            {LOG_HOUSE_SHORT_LABEL} →
          </Link>
          <Link
            href={loginToCompanionHref}
            className="font-medium text-stone-700 underline-offset-2 hover:underline"
          >
            ログインして伴走へ →
          </Link>
        </p>
      </section>

      <form action="/admin" className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="メール / プロフィールIDで検索"
          className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          検索
        </button>
      </form>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">データを読み込めませんでした</p>
          <p className="mt-2 whitespace-pre-wrap text-red-800">{loadError}</p>
        </div>
      ) : null}

      {flashSaved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          保存しました（変更が一覧に反映されていればOKです）。
        </div>
      ) : null}

      {flashErr ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-medium">保存に失敗しました</p>
          <p className="mt-1 text-xs text-red-800">
            ブラウザを更新するか、時間をおいて再度お試しください。続く場合はサーバーログを確認してください。
          </p>
        </div>
      ) : null}

      {!loadError ? <AdminUserDirectory rows={directoryRows} /> : null}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        最初の管理者は、環境変数 <code>ADMIN_EMAILS</code>（カンマ区切り）で指定すると安全です。
      </div>
    </div>
  );
}
