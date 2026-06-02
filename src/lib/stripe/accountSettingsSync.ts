import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { SubscriptionPlanId } from "@/lib/stripe/plans";

export type SyncAccountSettingsFromStripeParams = {
  email: string;
  profileLimit: number;
  subscriptionPlan: SubscriptionPlanId | null;
  subscriptionStatus: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

/** Webhook から AccountSettings を upsert（subscriberPdfAccess は据え置き） */
export async function syncAccountSettingsFromStripe(
  params: SyncAccountSettingsFromStripeParams,
): Promise<void> {
  const email = normalizeEmail(params.email);
  if (!email) return;

  const existing = await prisma.accountSettings.findUnique({
    where: { email },
    select: { id: true, subscriberPdfAccess: true, isAdmin: true, pdfDownloadLimitPerOrder: true },
  });

  const stripeCustomerId = params.stripeCustomerId?.trim() || null;
  const stripeSubscriptionId = params.stripeSubscriptionId?.trim() || null;

  if (existing) {
    await prisma.accountSettings.update({
      where: { id: existing.id },
      data: {
        profileLimit: params.profileLimit,
        subscriptionPlan: params.subscriptionPlan,
        subscriptionStatus: params.subscriptionStatus,
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
      },
    });
    return;
  }

  await prisma.accountSettings.create({
    data: {
      email,
      profileLimit: params.profileLimit,
      subscriptionPlan: params.subscriptionPlan,
      subscriptionStatus: params.subscriptionStatus,
      stripeCustomerId,
      stripeSubscriptionId,
      isAdmin: false,
      subscriberPdfAccess: false,
      pdfDownloadLimitPerOrder: 2,
    },
  });
}

export async function findAccountSettingsStripeIds(email: string): Promise<{
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
} | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return prisma.accountSettings.findUnique({
    where: { email: normalized },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });
}
