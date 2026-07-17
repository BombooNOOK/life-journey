import { redirect } from "next/navigation";

import { AccountCancelPlanForm } from "@/components/orders/AccountCancelPlanForm";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { isPaidSubscriber } from "@/lib/entitlement/resolveUserEntitlement";
import { resolveSubscriptionCancelState } from "@/lib/stripe/subscriptionCancelState";

export const dynamic = "force-dynamic";

export default async function AccountCancelPlanPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/account/cancel-plan");
  }

  const settings = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
      },
    }),
  );

  if (!isPaidSubscriber(settings)) {
    redirect("/orders/account");
  }

  const cancelState = await resolveSubscriptionCancelState(settings);
  if (cancelState.cancelAtPeriodEnd) {
    redirect("/orders/account");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="森の定期便の解約"
        description="解約内容をご確認のうえ、お手続きください"
      />

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <AccountCancelPlanForm />
      </section>
    </div>
  );
}
