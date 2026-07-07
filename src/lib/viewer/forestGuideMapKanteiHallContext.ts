import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export type ForestGuideMapKanteiHallBranch =
  | "guestOrNoResident"
  | "residentNoKantei"
  | "hasKantei";

export type ForestGuideMapKanteiHallContext = {
  branch: ForestGuideMapKanteiHallBranch;
};

/** 案内図・鑑定のへやの行き先（住民票・鑑定の有無で分岐） */
export async function resolveForestGuideMapKanteiHallContext(
  viewerEmail: string | null | undefined,
): Promise<ForestGuideMapKanteiHallContext> {
  if (!viewerEmail?.trim()) {
    return { branch: "guestOrNoResident" };
  }

  const email = normalizeEmail(viewerEmail);
  if (!email) {
    return { branch: "guestOrNoResident" };
  }

  const { activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  if (activeProfileId) {
    const kanteiOrder = await findKanteiOrderForProfile({
      viewerEmail,
      profileId: activeProfileId,
    });
    if (kanteiOrder != null) {
      return { branch: "hasKantei" };
    }
  }

  const account = await prisma.accountSettings.findUnique({
    where: { email },
    select: {
      forestResidentNumber: true,
      forestResidentIssuedAt: true,
    },
  });

  const hasResidentCard = Boolean(
    account?.forestResidentNumber && account?.forestResidentIssuedAt,
  );

  if (hasResidentCard) {
    return { branch: "residentNoKantei" };
  }

  return { branch: "guestOrNoResident" };
}
