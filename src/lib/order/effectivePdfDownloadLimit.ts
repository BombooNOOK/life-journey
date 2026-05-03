import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

/**
 * メールに紐づく AccountSettings の鑑定PDF上限（行が無ければ null）。
 * Order 行が古い値のままでも、管理者が変えた値を画面・API で優先するために使う。
 */
export async function fetchAccountPdfDownloadLimitOrNull(
  orderEmail: string,
): Promise<number | null> {
  const email = normalizeEmail(orderEmail);
  if (!email) return null;
  try {
    const s = await prisma.accountSettings.findUnique({
      where: { email },
      select: { pdfDownloadLimitPerOrder: true },
    });
    if (!s) return null;
    return Math.max(0, Math.min(999, Math.trunc(s.pdfDownloadLimitPerOrder)));
  } catch {
    return null;
  }
}

/** アカウントに設定があればそれを正とし、なければ鑑定行の値にフォールバックする */
export function combinePdfDownloadLimit(
  orderPdfDownloadLimit: number | null | undefined,
  accountPdfDownloadLimitPerOrder: number | null,
): number {
  if (typeof accountPdfDownloadLimitPerOrder === "number" && Number.isFinite(accountPdfDownloadLimitPerOrder)) {
    return Math.max(0, Math.min(999, Math.trunc(accountPdfDownloadLimitPerOrder)));
  }
  return Math.max(0, orderPdfDownloadLimit ?? 2);
}
