import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

function envAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
  return new Set(emails);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  try {
    const normalized = normalizeEmail(email);
    if (!normalized) return false;
    if (envAdminEmails().has(normalized)) return true;
    const row = await prisma.accountSettings.findUnique({
      where: { email: normalized },
      select: { isAdmin: true },
    });
    return row?.isAdmin === true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[isAdminEmail] fallback false:", e);
    }
    return false;
  }
}
