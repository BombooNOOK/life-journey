import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export type FirstVisitReadyBranch = "guest" | "needsKantei" | "hasKantei";

export type FirstVisitReadyContext = {
  branch: FirstVisitReadyBranch;
};

/** /guide/first/ready の旧URL保険導線 */
export async function resolveFirstVisitReadyContext(
  viewerEmail: string | null | undefined,
): Promise<FirstVisitReadyContext> {
  if (!viewerEmail?.trim()) {
    return { branch: "guest" };
  }

  const { activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  if (!activeProfileId) {
    return { branch: "needsKantei" };
  }

  const kanteiOrder = await findKanteiOrderForProfile({
    viewerEmail,
    profileId: activeProfileId,
  });

  if (kanteiOrder != null) {
    return { branch: "hasKantei" };
  }

  return { branch: "needsKantei" };
}

export async function resolveFirstVisitReadyContextFromCookie(): Promise<FirstVisitReadyContext> {
  const viewerEmail = await getViewerEmailFromCookie();
  return resolveFirstVisitReadyContext(viewerEmail);
}
