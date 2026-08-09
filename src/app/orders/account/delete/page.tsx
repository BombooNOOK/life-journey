import { redirect } from "next/navigation";

import { AccountDeleteForm } from "@/components/orders/AccountDeleteForm";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { accountDeleteBlockMessageForSettings } from "@/lib/account/deleteUserAccount";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { resolveSubscriptionCancelState } from "@/lib/stripe/subscriptionCancelState";

export const dynamic = "force-dynamic";

const ADMIN_ACCOUNT_DELETE_BLOCK_MESSAGE =
  "管理者アカウントはここから削除できません。別のテスト用アカウントをご利用ください。" as const;

const FIREBASE_ADMIN_NOT_CONFIGURED_MESSAGE =
  "現在、アカウントの削除を完了できません。しばらくしてから再度お試しいただくか、お問い合わせください。" as const;

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

  const cancelState = await resolveSubscriptionCancelState(settings);
  let blockMessage = accountDeleteBlockMessageForSettings(settings, cancelState.cancelAtPeriodEnd);

  if (!blockMessage && (settings?.isAdmin === true || (await isAdminEmail(viewerEmail)))) {
    blockMessage = ADMIN_ACCOUNT_DELETE_BLOCK_MESSAGE;
  }

  if (
    !blockMessage &&
    process.env.NODE_ENV === "production" &&
    !isFirebaseAdminConfigured()
  ) {
    blockMessage = FIREBASE_ADMIN_NOT_CONFIGURED_MESSAGE;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="アカウントを削除する"
        description="削除すると、あしあとやログイン情報も消えます。内容をよくご確認ください"
      />

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <AccountDeleteForm blockMessage={blockMessage} />
      </section>
    </div>
  );
}
