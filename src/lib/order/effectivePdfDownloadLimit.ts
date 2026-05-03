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

  try {
    const exact = await prisma.accountSettings.findUnique({
      where: { email },
      select: { pdfDownloadLimitPerOrder: true },
    });
    if (exact) return clampLimit(exact.pdfDownloadLimitPerOrder);
  } catch {
    /* noop */
  }

  const url = process.env.DATABASE_URL ?? "";
  const isPostgres = url.startsWith("postgresql") || url.startsWith("postgres");

  if (isPostgres) {
    try {
      const rows = await prisma.$queryRaw<Array<{ pdfDownloadLimitPerOrder: number }>>`
        SELECT "pdfDownloadLimitPerOrder"
        FROM "AccountSettings"
        WHERE LOWER(TRIM("email")) = LOWER(TRIM(${email}))
        LIMIT 1
      `;
      const v = rows[0]?.pdfDownloadLimitPerOrder;
      if (v !== undefined && v !== null) return clampLimit(v);
    } catch {
      /* noop */
    }
  }

  try {
    const rows = await prisma.accountSettings.findMany({
      select: { email: true, pdfDownloadLimitPerOrder: true },
      take: 2000,
    });
    const hit = rows.find((r) => normalizeEmail(r.email) === email);
    if (hit) return clampLimit(hit.pdfDownloadLimitPerOrder);
  } catch {
    /* noop */
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
  accountPdfDownloadLimitPerOrder: number | null,
): number {
  const orderVal = clampLimit(orderPdfDownloadLimit ?? 2);
  if (typeof accountPdfDownloadLimitPerOrder === "number" && Number.isFinite(accountPdfDownloadLimitPerOrder)) {
    const acc = clampLimit(accountPdfDownloadLimitPerOrder);
    return Math.max(orderVal, acc);
  }
  return orderVal;
}
