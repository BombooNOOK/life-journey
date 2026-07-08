import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import { resolvePrimaryKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export type FirstVisitReadyBranch = "guest" | "needsKantei" | "hasKantei";

export type FirstVisitReadyContext = {
  branch: FirstVisitReadyBranch;
  journalEntryCount: number;
};

/** /guide/first/ready の旧URL保険導線 */
export async function resolveFirstVisitReadyContext(
  viewerEmail: string | null | undefined,
): Promise<FirstVisitReadyContext> {
  if (!viewerEmail?.trim()) {
    return { branch: "guest", journalEntryCount: 0 };
  }

  const [{ activeProfileId }, entitlementCtx] = await Promise.all([
    listProfilesAndActiveProfileId(viewerEmail),
    loadEntitlementContext(viewerEmail),
  ]);

  if (!activeProfileId) {
    return { branch: "needsKantei", journalEntryCount: entitlementCtx.journalEntryCount };
  }

  const kanteiOrder = await resolvePrimaryKanteiOrderForProfile({
    viewerEmail,
    profileId: activeProfileId,
  });

  if (kanteiOrder != null) {
    return { branch: "hasKantei", journalEntryCount: entitlementCtx.journalEntryCount };
  }

  return { branch: "needsKantei", journalEntryCount: entitlementCtx.journalEntryCount };
}

export async function resolveFirstVisitReadyContextFromCookie(): Promise<FirstVisitReadyContext> {
  const viewerEmail = await getViewerEmailFromCookie();
  return resolveFirstVisitReadyContext(viewerEmail);
}
