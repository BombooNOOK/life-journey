import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

function clampLimit(n: unknown): number {
  const x = typeof n === "bigint" ? Number(n) : Number(n);
  if (!Number.isFinite(x)) return 2;
  return Math.max(0, Math.min(999, Math.trunc(x)));
}

/**
 * メールに紐づく AccountSettings の鑑定PDF上限（行が無ければ null）。
 * env に応じて Raw SQL にフォールバックし、findFirst(insensitive) は使わない（実行環境で例外になり得るため）。
 */
export async function fetchAccountPdfDownloadLimitOrNull(
  orderEmail: string,
): Promise<number | null> {
  const email = normalizeEmail(orderEmail);
  if (!email) return null;

  const url = process.env.DATABASE_URL ?? "";
  const isPostgres =
    url.startsWith("postgresql") ||
    url.startsWith("postgres") ||
    url.startsWith("prisma+postgres") ||
    url.startsWith("prisma+postgresql");

  /** 大文字小文字違いの重複行があっても、鑑定PDF上限は最大の行を採用 */
  if (isPostgres) {
    try {
      const rows = await prisma.$queryRaw<Array<{ m: number | null }>>`
        SELECT MAX("pdfDownloadLimitPerOrder") AS m
        FROM "AccountSettings"
        WHERE LOWER(TRIM("email")) = LOWER(TRIM(${email}))
      `;
      const v = rows[0]?.m;
      if (v !== undefined && v !== null) return clampLimit(v);
    } catch {
      /* 列未適用など */
    }
  }

  try {
    const exact = await prisma.accountSettings.findUnique({
      where: { email },
      select: { pdfDownloadLimitPerOrder: true },
    });
    if (exact) return clampLimit(exact.pdfDownloadLimitPerOrder);
  } catch {
    /* noop */
  }

  // メール表記ゆれ（大文字小文字）で findUnique が外れたとき（PostgreSQL で mode: insensitive が使える想定）
  try {
    const hit = await prisma.accountSettings.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { pdfDownloadLimitPerOrder: true },
    });
    if (hit) return clampLimit(hit.pdfDownloadLimitPerOrder);
  } catch {
    /* SQLite 等で未サポートのとき */
  }

  return null;
}

/**
 * 鑑定1件の表示・API用の上限。
 * - アカウント設定が取れた場合は **注文行とアカウントの大きい方**
 * - 取れないときは注文行のみ
 */
export function combinePdfDownloadLimit(
  orderPdfDownloadLimit: number | null | undefined,
  accountPdfDownloadLimitPerOrder: number | null | undefined,
): number {
  const orderVal = clampLimit(orderPdfDownloadLimit ?? 2);
  if (accountPdfDownloadLimitPerOrder === undefined || accountPdfDownloadLimitPerOrder === null) {
    return orderVal;
  }
  const acc = clampLimit(accountPdfDownloadLimitPerOrder);
  return Math.max(orderVal, acc);
}
