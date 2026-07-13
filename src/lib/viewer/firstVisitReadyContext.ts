import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import { resolvePrimaryKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export type FirstVisitReadyBranch = "guest" | "needsKantei" | "hasKantei";

export type FirstVisitReadyContext = {
  branch: FirstVisitReadyBranch;
  journalEntryCount: number;
  /** 住民票カードが発行済みか（道しるべ再開先の判定用） */
  hasResidentCard: boolean;
};

/** /guide/first/ready の旧URL保険導線 */
export async function resolveFirstVisitReadyContext(
  viewerEmail: string | null | undefined,
): Promise<FirstVisitReadyContext> {
  if (!viewerEmail?.trim()) {
    return { branch: "guest", journalEntryCount: 0, hasResidentCard: false };
  }

  const [{ activeProfileId }, entitlementCtx, account] = await Promise.all([
    listProfilesAndActiveProfileId(viewerEmail),
    loadEntitlementContext(viewerEmail),
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail.trim().toLowerCase() },
      select: { forestResidentNumber: true, forestResidentIssuedAt: true },
    }),
  ]);

  const hasResidentCard = Boolean(
    account?.forestResidentNumber && account?.forestResidentIssuedAt,
  );

  if (!activeProfileId) {
    return {
      branch: "needsKantei",
      journalEntryCount: entitlementCtx.journalEntryCount,
      hasResidentCard,
    };
  }

  const kanteiOrder = await resolvePrimaryKanteiOrderForProfile({
    viewerEmail,
    profileId: activeProfileId,
  });

  if (kanteiOrder != null) {
    return {
      branch: "hasKantei",
      journalEntryCount: entitlementCtx.journalEntryCount,
      hasResidentCard,
    };
  }

  return {
    branch: "needsKantei",
    journalEntryCount: entitlementCtx.journalEntryCount,
    hasResidentCard,
  };
}

export async function resolveFirstVisitReadyContextFromCookie(): Promise<FirstVisitReadyContext> {
  const viewerEmail = await getViewerEmailFromCookie();
  return resolveFirstVisitReadyContext(viewerEmail);
}
