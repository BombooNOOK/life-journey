import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

function clampLimit(n: number): number {
  return Math.max(0, Math.min(999, Math.trunc(n)));
}

/**
 * メールに紐づく AccountSettings の鑑定PDF上限（行が無ければ null）。
 * findUnique の完全一致だけだと DB のメール表記ゆらぎで取り逃すため、複数手段で探す。
 */
export async function fetchAccountPdfDownloadLimitOrNull(
  orderEmail: string,
): Promise<number | null> {
  const email = normalizeEmail(orderEmail);
  if (!email) return null;

  try {
    const s = await prisma.accountSettings.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { pdfDownloadLimitPerOrder: true },
    });
    if (s) return clampLimit(s.pdfDownloadLimitPerOrder);
  } catch {
    /* 続行 */
  }

  try {
    const rows = await prisma.accountSettings.findMany({
      select: { email: true, pdfDownloadLimitPerOrder: true },
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
 * - アカウント設定が取れた場合は **注文行とアカウントの大きい方**（管理者が上限を上げたとき Order 未同期でも効く）
 * - 取れないときは注文行のみ
 */
export function combinePdfDownloadLimit(
  orderPdfDownloadLimit: number | null | undefined,
  accountPdfDownloadLimitPerOrder: number | null,
): number {
  const orderVal = Math.max(0, orderPdfDownloadLimit ?? 2);
  if (typeof accountPdfDownloadLimitPerOrder === "number" && Number.isFinite(accountPdfDownloadLimitPerOrder)) {
    const acc = clampLimit(accountPdfDownloadLimitPerOrder);
    return Math.max(orderVal, acc);
  }
  return orderVal;
}
