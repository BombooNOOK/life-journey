import { loadAccountSettingsForP0Read } from "@/lib/account/p0IdentityReads";
import { resolveP0IdentityOwnership } from "@/lib/account/p0IdentityOwnership";
import { isP0IdentityReadAuthorityEnabled } from "@/lib/account/p0IdentityReadAuthorityGate";
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

  let settings: {
    profileLimit: number | null;
    subscriptionPlan: string | null;
  } | null = null;

  if (isP0IdentityReadAuthorityEnabled()) {
    const ownership = await resolveP0IdentityOwnership();
    const loaded = await loadAccountSettingsForP0Read({ ownership });
    if (loaded.mode === "identity" && loaded.settings) {
      const full = await withPrismaConnectionRetry(() =>
        prisma.accountSettings.findUnique({
          where: { id: loaded.settings.id },
          select: { profileLimit: true, subscriptionPlan: true },
        }),
      );
      settings = full;
    } else if (loaded.mode === "mismatch") {
      // Fail closed: do not use conflicting email row
      settings = null;
    } else {
      settings = await withPrismaConnectionRetry(() =>
        prisma.accountSettings.findUnique({
          where: { email: viewerEmail },
          select: { profileLimit: true, subscriptionPlan: true },
        }),
      );
    }
  } else {
    settings = await withPrismaConnectionRetry(() =>
      prisma.accountSettings.findUnique({
        where: { email: viewerEmail },
        select: { profileLimit: true, subscriptionPlan: true },
      }),
    );
  }
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
