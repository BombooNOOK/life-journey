import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { journalProfileIdsForQuery } from "@/lib/profile/activeProfile";

/** 1プロフィール1鑑定: 同一スコープに既存 Order があるか（レガシー profileId="" 含む） */
export async function findExistingOrderForProfile(params: {
  viewerEmail: string;
  profileId: string;
}): Promise<{ id: string } | null> {
  const order = await findKanteiOrderForProfile(params);
  return order ? { id: order.id } : null;
}

/** 日記コメント生成に使う鑑定書（プロフィール単位・レガシー profileId="" 含む） */
export async function findKanteiOrderForProfile(params: {
  viewerEmail: string;
  profileId: string;
}): Promise<{
  id: string;
  birthMonth: number;
  birthDay: number;
  numerologyJson: string | null;
} | null> {
  const email = normalizeEmail(params.viewerEmail);
  if (!email) return null;

  const profileIds = journalProfileIdsForQuery(params.profileId, email);
  return prisma.order.findFirst({
    where: {
      email,
      profileId: { in: profileIds },
    },
    select: {
      id: true,
      birthMonth: true,
      birthDay: true,
      numerologyJson: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
