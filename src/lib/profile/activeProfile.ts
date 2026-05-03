import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export const PROFILE_COOKIE_KEY = "lj_profile_id";
const LEGACY_PROFILE_ID = "";

export type ViewerProfile = {
  id: string;
  nickname: string;
};

export async function listViewerProfiles(viewerEmail: string): Promise<ViewerProfile[]> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return [];
  await ensureDefaultProfile(email);
  const rows = await prisma.profile.findMany({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });
  return rows;
}

/** `listViewerProfiles` と `resolveActiveProfileId` を同時に呼ぶと Prisma が二重に走るため、マイページ等ではこちらを使う */
export async function listProfilesAndActiveProfileId(
  viewerEmail: string,
): Promise<{ profiles: ViewerProfile[]; activeProfileId: string }> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return { profiles: [], activeProfileId: LEGACY_PROFILE_ID };
  await ensureDefaultProfile(email);
  const profiles = await prisma.profile.findMany({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });
  if (profiles.length === 0) {
    return { profiles: [], activeProfileId: LEGACY_PROFILE_ID };
  }
  const store = await cookies();
  const cookieProfileId = store.get(PROFILE_COOKIE_KEY)?.value ?? "";
  const activeProfileId =
    cookieProfileId && profiles.some((p) => p.id === cookieProfileId)
      ? cookieProfileId
      : profiles[0].id;
  return { profiles, activeProfileId };
}

export async function resolveActiveProfileId(viewerEmail: string): Promise<string> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return LEGACY_PROFILE_ID;
  await ensureDefaultProfile(email);
  const all = await listViewerProfiles(email);
  if (all.length === 0) return LEGACY_PROFILE_ID;
  const store = await cookies();
  const cookieProfileId = store.get(PROFILE_COOKIE_KEY)?.value ?? "";
  if (cookieProfileId && all.some((p) => p.id === cookieProfileId)) return cookieProfileId;
  return all[0].id;
}

export async function profileByIdForViewer(profileId: string, viewerEmail: string): Promise<ViewerProfile | null> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return null;
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, email, isArchived: false },
    select: { id: true, nickname: true },
  });
  return profile;
}

function defaultProfileIdForEmail(email: string): string {
  return `legacy:${createHash("md5").update(email).digest("hex")}`;
}

async function ensureDefaultProfile(email: string): Promise<void> {
  const count = await prisma.profile.count({
    where: { email, isArchived: false },
  });
  if (count > 0) return;
  try {
    await prisma.profile.create({
      data: {
        id: defaultProfileIdForEmail(email),
        email,
        nickname: "メイン",
      },
    });
  } catch (e) {
    // 並列リクエストで同じ既定プロフィール ID を二重作成しようとした場合（本棚の Promise.all など）
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }
}
