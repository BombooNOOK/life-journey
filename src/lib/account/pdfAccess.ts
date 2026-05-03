import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

/** 製本用（高画質）PDFを出せるか（管理者ページで付与） */
export async function resolveSubscriberPdfAccess(viewerEmail: string | null | undefined): Promise<boolean> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return false;
  try {
    const row = await prisma.accountSettings.findUnique({
      where: { email },
      select: { subscriberPdfAccess: true },
    });
    return row?.subscriberPdfAccess === true;
  } catch (e) {
    // マイグレーション未適用などでカラムが無い環境でもページ全体が落ちないようにする
    if (process.env.NODE_ENV === "development") {
      console.warn("[resolveSubscriberPdfAccess] fallback false:", e);
    }
    return false;
  }
}
