import { redirect } from "next/navigation";

import { AccountDeleteForm } from "@/components/orders/AccountDeleteForm";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { accountDeleteBlockMessageForSettings } from "@/lib/account/deleteUserAccount";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { resolveSubscriptionCancelState } from "@/lib/stripe/subscriptionCancelState";

export const dynamic = "force-dynamic";

export default async function AccountDeletePage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/account/delete");
  }

  const settings = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        isAdmin: true,
      },
    }),
  );

  if (settings?.isAdmin === true) {
    redirect("/orders/account");
  }

  const cancelState = await resolveSubscriptionCancelState(settings);
  const blockMessage = accountDeleteBlockMessageForSettings(settings, cancelState.cancelAtPeriodEnd);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="アカウント削除"
        description="削除内容をよくご確認ください"
      />

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <AccountDeleteForm blockMessage={blockMessage} />
      </section>
    </div>
  );
}
