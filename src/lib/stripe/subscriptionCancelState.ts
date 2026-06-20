import { isPaidSubscriber } from "@/lib/entitlement/resolveUserEntitlement";
import { getStripeClient } from "@/lib/stripe/client";
import { loadSubscription } from "@/lib/stripe/webhookHandlers";

export type SubscriptionCancelState = {
  isPaidPlan: boolean;
  cancelAtPeriodEnd: boolean;
  periodEndLabel: string | null;
  canRequestCancel: boolean;
};

export type AccountSubscriptionSettings = {
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  stripeSubscriptionId?: string | null;
};

function formatPeriodEndLabel(unixSeconds: number | null | undefined): string | null {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toLocaleDateString("ja-JP");
}

export function buildSubscriptionCancelState(params: {
  settings: AccountSubscriptionSettings | null | undefined;
  cancelAtPeriodEnd: boolean;
  periodEndUnix: number | null;
}): SubscriptionCancelState {
  const isPaidPlan = isPaidSubscriber(params.settings ?? null);
  const periodEndLabel = formatPeriodEndLabel(params.periodEndUnix);

  return {
    isPaidPlan,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
    periodEndLabel,
    canRequestCancel: isPaidPlan && !params.cancelAtPeriodEnd,
  };
}

export function freeSubscriptionCancelState(
  settings: AccountSubscriptionSettings | null | undefined = null,
): SubscriptionCancelState {
  return buildSubscriptionCancelState({
    settings,
    cancelAtPeriodEnd: false,
    periodEndUnix: null,
  });
}

export async function resolveSubscriptionCancelState(
  settings: AccountSubscriptionSettings | null | undefined,
): Promise<SubscriptionCancelState> {
  const subscriptionId = settings?.stripeSubscriptionId?.trim();
  if (!subscriptionId || !isPaidSubscriber(settings ?? null)) {
    return freeSubscriptionCancelState(settings);
  }

  try {
    const subscription = await loadSubscription(subscriptionId);
    return buildSubscriptionCancelState({
      settings,
      cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
      periodEndUnix: subscription.current_period_end ?? null,
    });
  } catch (error) {
    console.warn("[stripe] subscription cancel state lookup failed", {
      subscriptionId,
      error,
    });
    return freeSubscriptionCancelState(settings);
  }
}

export async function requestSubscriptionCancelAtPeriodEnd(
  stripeSubscriptionId: string,
): Promise<{ periodEndLabel: string | null }> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return {
    periodEndLabel: formatPeriodEndLabel(subscription.current_period_end),
  };
}
