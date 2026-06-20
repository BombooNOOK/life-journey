import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export type AboutCtaAudience = {
  showReturningUserCtas: boolean;
};

/**
 * 「Life Journey Diaryとは」の導線出し分け。
 * ログインだけではなく、マイページ用プロフィールまたは鑑定Orderがある場合に既存ユーザー扱い。
 */
export async function resolveAboutCtaAudience(
  viewerEmail: string | null | undefined,
): Promise<AboutCtaAudience> {
  if (!viewerEmail?.trim()) {
    return { showReturningUserCtas: false };
  }

  const { profiles } = await listProfilesAndActiveProfileId(viewerEmail);
  if (profiles.length > 0) {
    return { showReturningUserCtas: true };
  }

  const email = normalizeEmail(viewerEmail);
  if (!email) {
    return { showReturningUserCtas: false };
  }

  const kanteiOrder = await prisma.order.findFirst({
    where: { email },
    select: { id: true },
  });

  return { showReturningUserCtas: kanteiOrder != null };
}
