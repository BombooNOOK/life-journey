import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { effectiveProfileLimit } from "@/lib/profile/effectiveProfileLimit";

export type AdminAccountProfileSummary = {
  isMonitor: boolean;
  storedProfileLimit: number;
  effectiveProfileLimit: number;
  profileCount: number;
};

export async function loadAdminAccountProfileSummary(
  email: string,
): Promise<AdminAccountProfileSummary> {
  const normalized = normalizeEmail(email);
  const [settings, profileCount] = await Promise.all([
    prisma.accountSettings.findUnique({
      where: { email: normalized },
      select: { profileLimit: true, isMonitor: true },
    }),
    prisma.profile.count({ where: { email: normalized, isArchived: false } }),
  ]);

  return {
    isMonitor: settings?.isMonitor === true,
    storedProfileLimit: settings?.profileLimit ?? 1,
    effectiveProfileLimit: effectiveProfileLimit(settings),
    profileCount,
  };
}
