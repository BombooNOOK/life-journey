import { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  toggleAdminRole,
  toggleSubscriberPdfAccess,
  updatePdfDownloadLimitPerOrder,
  updateProfileLimit,
} from "@/app/admin/actions";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{ q?: string; saved?: string; err?: string }>;
};

type UserRow = {
  email: string;
  sourceOrderCount: number;
  sourceJournalCount: number;
  isAdmin: boolean;
  profileLimit: number;
  /** 鑑定PDFの無料ダウンロード上限（鑑定1件あたり） */
  pdfDownloadLimitPerOrder: number;
  /** 製本用（高画質）PDFのダウンロード可否 */
  subscriberPdfAccess: boolean;
};

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

/** LIKE 用に % _ を検索語から外す（ワイルドカード注入回避の簡易版） */
function likePatternFromKeyword(keyword: string): string {
  const safe = keyword.replace(/[%_]/g, "");
  return `%${safe}%`;
}

type RawEmailCount = { e: string; c: bigint | number };

/** PostgreSQL: Prisma の groupBy / insensitive より確実にメール別件数を取る */
async function loadRowsPostgres(keyword: string): Promise<UserRow[]> {
  const kw = keyword.trim();
  const pattern = kw ? likePatternFromKeyword(kw) : "";

  const [orderRows, journalRows, settingsList] = await Promise.all([
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

  const settingsByEmail = new Map<
    string,
    {
      id: string;
      email: string;
      isAdmin: boolean;
      profileLimit: number;
      pdfDownloadLimitPerOrder: number;
      subscriberPdfAccess: boolean;
      updatedAt: Date;
    }
  >();

  for (const s of settingsList) {
    const key = normalizeEmail(s.email);
    const prev = settingsByEmail.get(key);
    const pdfLimit = s.pdfDownloadLimitPerOrder ?? 2;
    const subPdf = s.subscriberPdfAccess ?? false;
    const merged = {
      id: s.id,
      email: s.email,
      isAdmin: s.isAdmin,
      profileLimit: s.profileLimit,
      pdfDownloadLimitPerOrder: pdfLimit,
      subscriberPdfAccess: subPdf,
      updatedAt: s.updatedAt,
    };
    if (!prev || prev.updatedAt < merged.updatedAt) {
      settingsByEmail.set(key, merged);
    }
  }

  const emails = new Set<string>([
    ...orderCountByEmail.keys(),
    ...journalCountByEmail.keys(),
    ...settingsByEmail.keys(),
  ]);
  return Array.from(emails)
    .map((email) => {
      const setting = settingsByEmail.get(email);
      return {
        email,
        sourceOrderCount: orderCountByEmail.get(email) ?? 0,
        sourceJournalCount: journalCountByEmail.get(email) ?? 0,
        isAdmin: setting?.isAdmin ?? false,
        profileLimit: setting?.profileLimit ?? 1,
        pdfDownloadLimitPerOrder: setting?.pdfDownloadLimitPerOrder ?? 2,
        subscriberPdfAccess: setting?.subscriberPdfAccess ?? false,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, 200);
}

type AccountSettingsAdminRow = {
  id: string;
  email: string;
  isAdmin: boolean;
  profileLimit: number;
  updatedAt: Date;
  pdfDownloadLimitPerOrder?: number | null;
  subscriberPdfAccess?: boolean | null;
};

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
          SELECT "id", "email", "isAdmin", "profileLimit", "updatedAt"
          FROM "AccountSettings"
          ORDER BY "updatedAt" DESC
        `;
      } else {
        const pattern = likePatternFromKeyword(kw);
        base = await prisma.$queryRaw<AccountSettingsAdminRow[]>`
          SELECT "id", "email", "isAdmin", "profileLimit", "updatedAt"
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
        Array<{ id: string; pdfDownloadLimitPerOrder: number | null; subscriberPdfAccess: boolean | null }>
      >`
        SELECT "id", "pdfDownloadLimitPerOrder", "subscriberPdfAccess"
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
        };
      });
    } catch {
      return base.map((row) => ({
        ...row,
        pdfDownloadLimitPerOrder: null,
        subscriberPdfAccess: null,
      }));
    }
  }

  try {
    return await prisma.accountSettings.findMany({
      where: kw ? { email: { contains: kw } } : {},
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        profileLimit: true,
        pdfDownloadLimitPerOrder: true,
        subscriberPdfAccess: true,
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
        isAdmin: true,
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

async function loadRowsWithEmailMode(keyword: string, insensitive: boolean): Promise<UserRow[]> {
  const where = keyword ? emailContainsWhere(keyword, insensitive) : {};

  const [orderGroups, journalGroups, settings] = await Promise.all([
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

  const settingsByEmail = new Map<
    string,
    {
      id: string;
      email: string;
      isAdmin: boolean;
      profileLimit: number;
      pdfDownloadLimitPerOrder: number;
      subscriberPdfAccess: boolean;
      updatedAt: Date;
    }
  >();
  for (const s of settings) {
    const key = normalizeEmail(s.email);
    const prev = settingsByEmail.get(key);
    const merged = {
      id: s.id,
      email: s.email,
      isAdmin: s.isAdmin,
      profileLimit: s.profileLimit,
      pdfDownloadLimitPerOrder: s.pdfDownloadLimitPerOrder ?? 2,
      subscriberPdfAccess: s.subscriberPdfAccess ?? false,
      updatedAt: s.updatedAt,
    };
    if (!prev || prev.updatedAt < merged.updatedAt) {
      settingsByEmail.set(key, merged);
    }
  }

  const emails = new Set<string>([
    ...orderCountByEmail.keys(),
    ...journalCountByEmail.keys(),
    ...settingsByEmail.keys(),
  ]);
  return Array.from(emails)
    .map((email) => {
      const setting = settingsByEmail.get(email);
      return {
        email,
        sourceOrderCount: orderCountByEmail.get(email) ?? 0,
        sourceJournalCount: journalCountByEmail.get(email) ?? 0,
        isAdmin: setting?.isAdmin ?? false,
        profileLimit: setting?.profileLimit ?? 1,
        pdfDownloadLimitPerOrder: setting?.pdfDownloadLimitPerOrder ?? 2,
        subscriberPdfAccess: setting?.subscriberPdfAccess ?? false,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, 200);
}

async function loadRows(keyword: string): Promise<UserRow[]> {
  const kw = keyword.trim().toLowerCase();
  if (isPostgresDb()) {
    try {
      return await loadRowsPostgres(kw);
    } catch (e) {
      console.warn("[admin] loadRowsPostgres failed, falling back to Prisma:", e);
    }
  }
  try {
    return await loadRowsWithEmailMode(kw, true);
  } catch (e) {
    console.warn("[admin] loadRows insensitive failed, retrying:", e);
    return loadRowsWithEmailMode(kw, false);
  }
}

export default async function AdminPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) notFound();

  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const flashSaved = params.saved;
  const flashErr = params.err;
  let rows: UserRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await loadRows(q);
  } catch (e) {
    console.error("[admin] loadRows:", e);
    loadError =
      process.env.NODE_ENV === "development"
        ? e instanceof Error
          ? e.message
          : String(e)
        : "ユーザー一覧の取得に失敗しました";
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">管理者ページ</h1>
        <p className="mt-1 text-sm text-stone-600">
          ユーザー検索と、プロフィール上限（1 /
          3）、鑑定書PDFの無料ダウンロード上限、製本用（高画質）PDFの付与、管理者権限の切り替えを行います。
        </p>
      </div>

      <form action="/admin" className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="メールで検索"
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

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">鑑定</th>
              <th className="px-4 py-3 font-medium">日記</th>
              <th className="px-4 py-3 font-medium">プロフィール上限</th>
              <th className="px-4 py-3 font-medium">PDF無料回数</th>
              <th className="px-4 py-3 font-medium">製本PDF</th>
              <th className="px-4 py-3 font-medium">管理者</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.email} className="border-t border-stone-100">
                <td className="px-4 py-3 text-stone-800">{row.email}</td>
                <td className="px-4 py-3 text-stone-600">{row.sourceOrderCount}</td>
                <td className="px-4 py-3 text-stone-600">{row.sourceJournalCount}</td>
                <td className="px-4 py-3">
                  <form action={updateProfileLimit} className="flex items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <select
                      name="profileLimit"
                      defaultValue={String(row.profileLimit)}
                      className="rounded-md border border-stone-300 px-2 py-1"
                    >
                      <option value="1">1</option>
                      <option value="3">3</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      上限更新
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={updatePdfDownloadLimitPerOrder} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <input
                      type="number"
                      name="pdfDownloadLimitPerOrder"
                      min={0}
                      max={999}
                      defaultValue={String(row.pdfDownloadLimitPerOrder)}
                      className="w-20 rounded-md border border-stone-300 px-2 py-1"
                      title="鑑定1件あたりの無料PDFダウンロード回数（閲覧・DL共通）"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      更新
                    </button>
                  </form>
                  <p className="mt-1 text-[10px] leading-tight text-stone-400">
                    保存するとこのメールの既存鑑定にも上限を反映します
                  </p>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleSubscriberPdfAccess} className="flex items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <input
                      type="hidden"
                      name="subscriberPdfAccess"
                      value={row.subscriberPdfAccess ? "0" : "1"}
                    />
                    <span className={row.subscriberPdfAccess ? "text-violet-700" : "text-stone-500"}>
                      {row.subscriberPdfAccess ? "ON" : "OFF"}
                    </span>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                      title="サブスク加入者向け・製本用（高画質）PDF"
                    >
                      切替
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleAdminRole} className="flex items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <input type="hidden" name="isAdmin" value={row.isAdmin ? "0" : "1"} />
                    <span className={row.isAdmin ? "text-emerald-700" : "text-stone-500"}>
                      {row.isAdmin ? "ON" : "OFF"}
                    </span>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      切替
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-stone-500">保存は即時反映</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        最初の管理者は、環境変数 <code>ADMIN_EMAILS</code>（カンマ区切り）で指定すると安全です。
      </div>
    </div>
  );
}
