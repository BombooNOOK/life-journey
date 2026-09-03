import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import {
  listViewerProfilesUnderAuthority,
  profileByIdUnderAuthority,
} from "@/lib/account/p0IdentityReadAuthority";
import { resolveP0ProfileCreateIdentityFields } from "@/lib/account/p0IdentityWriteFields";
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
  return listViewerProfilesUnderAuthority(email);
}

/** `listViewerProfiles` と `resolveActiveProfileId` を同時に呼ぶと Prisma が二重に走るため、マイページ等ではこちらを使う */
export async function listProfilesAndActiveProfileId(
  viewerEmail: string,
): Promise<{ profiles: ViewerProfile[]; activeProfileId: string }> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return { profiles: [], activeProfileId: LEGACY_PROFILE_ID };
  await ensureDefaultProfile(email);
  const profiles = await listViewerProfilesUnderAuthority(email);
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
  return profileByIdUnderAuthority(profileId, viewerEmail);
}

export function defaultProfileIdForEmail(email: string): string {
  return `legacy:${createHash("md5").update(normalizeEmail(email)).digest("hex")}`;
}

/** 旧データ（profileId 空）を既定レガシープロフィールと同一視して読む */
export function journalProfileIdsForQuery(profileId: string, viewerEmail: string): string[] {
  const normalized = normalizeEmail(viewerEmail);
  if (!profileId) return [LEGACY_PROFILE_ID];
  if (profileId === defaultProfileIdForEmail(normalized)) {
    return [profileId, LEGACY_PROFILE_ID];
  }
  return [profileId];
}

async function ensureDefaultProfile(email: string): Promise<void> {
  const count = await prisma.profile.count({
    where: { email, isArchived: false },
  });
  if (count > 0) return;
  try {
    const identityFields = await resolveP0ProfileCreateIdentityFields();
    await prisma.profile.create({
      data: {
        id: defaultProfileIdForEmail(email),
        email,
        nickname: "メイン",
        ...identityFields,
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
