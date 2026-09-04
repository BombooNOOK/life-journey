import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import {
  resolveP0IdentityOwnership,
  type P0OwnershipResolution,
  type P0OwnershipResolverDeps,
} from "@/lib/account/p0IdentityOwnership";
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

export type EnsureDefaultProfileDeps = P0OwnershipResolverDeps & {
  db?: typeof prisma;
  /**
   * Optional ownership override for tests.
   * Production callers omit this — ownership comes from verified UID → AccountIdentity.
   */
  resolveOwnership?: () => Promise<P0OwnershipResolution>;
};

/**
 * AI-X6.7C1.5A2-I3 — Identity-first skip rule for default Profile bootstrap.
 *
 * When the verified session is BOUND to an AccountIdentity that already owns
 * one or more non-archived Profiles, do NOT create a new Profile merely because
 * Profile.email differs from the current session email.
 *
 * Current email alone never selects or invents ownership.
 */
export function shouldSkipEmailBootstrapForIdentityOwnedProfiles(input: {
  ownership: P0OwnershipResolution;
  identityOwnedNonArchivedCount: number;
}): boolean {
  return (
    input.ownership.state === "BOUND" &&
    Boolean(input.ownership.identityId) &&
    input.identityOwnedNonArchivedCount > 0
  );
}

export async function listViewerProfiles(viewerEmail: string): Promise<ViewerProfile[]> {
  const email = normalizeEmail(viewerEmail);
  if (!email) return [];
  await ensureDefaultProfile(email);
  return listViewerProfilesUnderAuthority(email);
}

/**
 * `listViewerProfiles` と `resolveActiveProfileId` を同時に呼ぶと Prisma が二重に走るため、マイページ等ではこちらを使う.
 *
 * Multiple-profile selection rule (unchanged):
 * - Prefer `lj_profile_id` cookie when it matches a listed non-archived profile
 * - Else first profile by existing list order (`createdAt` asc under authority helpers)
 */
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

/**
 * Ensure a default Profile exists for the viewer — identity-safe (I3).
 *
 * Order:
 * 1. Resolve verified UID → AccountIdentity ownership (when available)
 * 2. If BOUND and any non-archived Profile has that identityId → return (no create)
 * 3. Else legacy: if any non-archived Profile matches session email → return
 * 4. Else create default Profile for session email (may attach identityId via dual-write)
 *
 * Does NOT update Profile.email. Does NOT claim foreign/null-identity rows.
 * Does NOT create LegacyActorClaim.
 */
export async function ensureDefaultProfile(
  email: string,
  deps: EnsureDefaultProfileDeps = {},
): Promise<void> {
  const db = deps.db ?? prisma;
  const resolveOwnership =
    deps.resolveOwnership ??
    (() => resolveP0IdentityOwnership(deps));

  const ownership = await resolveOwnership();
  if (ownership.state === "BOUND" && ownership.identityId) {
    const identityOwnedCount = await db.profile.count({
      where: { identityId: ownership.identityId, isArchived: false },
    });
    if (
      shouldSkipEmailBootstrapForIdentityOwnedProfiles({
        ownership,
        identityOwnedNonArchivedCount: identityOwnedCount,
      })
    ) {
      return;
    }
    // BOUND but no identity-owned Profile: fall through to legacy email path.
    // Do NOT auto-claim NULL-identity historical rows by email alone.
  }

  const count = await db.profile.count({
    where: { email, isArchived: false },
  });
  if (count > 0) return;
  try {
    const identityFields = await resolveP0ProfileCreateIdentityFields(deps);
    await db.profile.create({
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
