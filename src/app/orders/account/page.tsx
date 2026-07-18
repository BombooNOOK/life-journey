import { redirect } from "next/navigation";

import { MyPageLogoutButton } from "@/components/auth/AuthSessionPanels";
import { MyPageAccountSection } from "@/components/orders/MyPageAccountSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { effectiveProfileLimit } from "@/lib/profile/effectiveProfileLimit";
import { resolveSubscriptionCancelState } from "@/lib/stripe/subscriptionCancelState";

export const dynamic = "force-dynamic";

export default async function MyPageAccountPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/account");
  }

  const [settings, oldestProfile] = await withPrismaConnectionRetry(() =>
    Promise.all([
      prisma.accountSettings.findUnique({
        where: { email: viewerEmail },
        select: {
          createdAt: true,
          profileLimit: true,
          isMonitor: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          stripeSubscriptionId: true,
        },
      }),
      prisma.profile.findFirst({
        where: { email: viewerEmail, isArchived: false },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]),
  );

  const createdAt = settings?.createdAt ?? oldestProfile?.createdAt ?? null;
  const subscriptionCancelState = await resolveSubscriptionCancelState(settings);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="アカウント情報"
        description="登録情報・森の定期便・解約手続きなどを確認できます"
      />

      <MyPageAccountSection
        viewerEmail={viewerEmail}
        subscriptionPlan={settings?.subscriptionPlan ?? null}
        profileLimit={effectiveProfileLimit(settings)}
        isMonitor={settings?.isMonitor === true}
        registeredAtLabel={
          createdAt ? createdAt.toLocaleDateString("ja-JP") : "登録日を確認できません"
        }
        subscriptionCancelState={subscriptionCancelState}
      />

      <MyPageLogoutButton className="mt-4 border-t-0 pt-8" />
    </div>
  );
}
