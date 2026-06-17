import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { effectiveProfileLimit } from "@/lib/profile/effectiveProfileLimit";

export async function loadMyPageSettingsContext(viewerEmail: string) {
  const { profiles, activeProfileId } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );
  const settings = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: { profileLimit: true, subscriptionPlan: true },
    }),
  );
  const entitlementCtx = await withPrismaConnectionRetry(() =>
    loadEntitlementContext(viewerEmail),
  );
  const entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return {
    profiles,
    activeProfileId,
    activeProfile,
    profileLimit: effectiveProfileLimit(settings),
    subscriptionPlan: settings?.subscriptionPlan ?? null,
    entitlement,
  };
}
