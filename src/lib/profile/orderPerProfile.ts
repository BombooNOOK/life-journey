import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { journalProfileIdsForQuery } from "@/lib/profile/activeProfile";
import {
  findKanteiOrderForIdentity,
  listKanteiOrdersForIdentity,
  shouldUseOrderIdentityRead,
} from "@/lib/value/orderIdentityAuthority";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

const KANTEI_ORDER_CORE_SELECT = {
  id: true,
  birthYear: true,
  birthMonth: true,
  birthDay: true,
  birthDate: true,
  numerologyJson: true,
} as const;

export const KANTEI_ORDER_BOOKSHELF_SELECT = {
  id: true,
  kanteiCode: true,
  fullNameDisplay: true,
  fullNameRomanDisplay: true,
  createdAt: true,
  pdfDownloadCount: true,
  pdfDownloadLimit: true,
} as const;

function viewerEmailWhere(email: string) {
  return { email: { equals: email, mode: "insensitive" as const } };
}

async function countActiveProfiles(email: string): Promise<number> {
  return prisma.profile.count({ where: { email, isArchived: false } });
}

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
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthDate: string;
  numerologyJson: string | null;
} | null> {
  if (shouldUseOrderIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    return findKanteiOrderForIdentity({
      ownership,
      profileId: params.profileId,
    });
  }

  const email = normalizeEmail(params.viewerEmail);
  if (!email) return null;

  const profileIds = journalProfileIdsForQuery(params.profileId, email);
  const scoped = await prisma.order.findFirst({
    where: {
      ...viewerEmailWhere(email),
      profileId: { in: profileIds },
    },
    select: KANTEI_ORDER_CORE_SELECT,
    orderBy: { createdAt: "desc" },
  });
  if (scoped) return scoped;

  if ((await countActiveProfiles(email)) <= 1) {
    return prisma.order.findFirst({
      where: viewerEmailWhere(email),
      select: KANTEI_ORDER_CORE_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  return null;
}

/** 本棚に並べる鑑定書一覧（プロフィール紐づけのレガシー互換を含む） */
export async function listKanteiOrdersForProfile(params: {
  viewerEmail: string;
  profileId: string;
  take?: number;
}) {
  if (shouldUseOrderIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    return listKanteiOrdersForIdentity({
      ownership,
      profileId: params.profileId,
      take: params.take,
    });
  }

  const email = normalizeEmail(params.viewerEmail);
  if (!email) return [];

  const take = params.take ?? 20;
  const profileIds = journalProfileIdsForQuery(params.profileId, email);
  const scoped = await prisma.order.findMany({
    where: {
      ...viewerEmailWhere(email),
      profileId: { in: profileIds },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: KANTEI_ORDER_BOOKSHELF_SELECT,
  });
  if (scoped.length > 0) return scoped;

  if ((await countActiveProfiles(email)) <= 1) {
    return prisma.order.findMany({
      where: viewerEmailWhere(email),
      orderBy: { createdAt: "desc" },
      take,
      select: KANTEI_ORDER_BOOKSHELF_SELECT,
    });
  }

  return [];
}

/** ログハウス・再開判定用：本棚と同じ条件で鑑定の有無を見る */
export async function resolvePrimaryKanteiOrderForProfile(params: {
  viewerEmail: string;
  profileId: string;
}): Promise<{ id: string } | null> {
  const orders = await listKanteiOrdersForProfile({ ...params, take: 1 });
  return orders[0] ?? null;
}
