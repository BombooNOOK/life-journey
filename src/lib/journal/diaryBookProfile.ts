import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

export async function resolveDiaryBookProfileId(
  viewerEmail: string,
  rawProfileId: string | null | undefined,
): Promise<
  | { ok: true; profileId: string }
  | { ok: false; status: number; code: string; error: string }
> {
  const trimmed = rawProfileId?.trim() ?? "";
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = trimmed || activeProfileId;
  if (!profileId) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN_PROFILE",
      error: "指定プロフィールは利用できません。",
    };
  }
  if (trimmed) {
    const profile = await profileByIdForViewer(profileId, viewerEmail);
    if (!profile) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN_PROFILE",
        error: "指定プロフィールは利用できません。",
      };
    }
  }
  return { ok: true, profileId };
}
