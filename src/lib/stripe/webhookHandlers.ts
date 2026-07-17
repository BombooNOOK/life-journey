import type Stripe from "stripe";

import { normalizeEmail } from "@/lib/auth/viewer";
import { syncAccountSettingsFromStripe } from "@/lib/stripe/accountSettingsSync";
import { getStripeClient } from "@/lib/stripe/client";
import {
  isStripeSubscriptionEntitled,
  planFromPriceId,
  profileLimitForPlan,
  type SubscriptionPlanId,
} from "@/lib/stripe/plans";

function primaryPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price?.id ?? null;
}

function resolveEmail(
  subscription: Stripe.Subscription,
  fallbackEmail?: string | null,
): string | null {
  const metaEmail = subscription.metadata?.viewerEmail;
  if (typeof metaEmail === "string" && metaEmail.trim()) {
    return normalizeEmail(metaEmail);
  }
  return normalizeEmail(fallbackEmail) || null;
}

export async function applyStripeSubscriptionToAccount(params: {
  subscription: Stripe.Subscription;
  fallbackEmail?: string | null;
  fallbackPlan?: SubscriptionPlanId | null;
}): Promise<void> {
  const email = resolveEmail(params.subscription, params.fallbackEmail);
  if (!email) {
    console.warn("[stripe] subscription sync skipped: email missing", {
      subscriptionId: params.subscription.id,
    });
    return;
  }

  const priceId = primaryPriceId(params.subscription);
  const entitled = isStripeSubscriptionEntitled(params.subscription.status);
  let subscriptionPlan: SubscriptionPlanId | null = null;

  if (entitled) {
    subscriptionPlan = planFromPriceId(priceId) ?? params.fallbackPlan ?? null;
  }

  await syncAccountSettingsFromStripe({
    email,
    profileLimit: profileLimitForPlan(subscriptionPlan),
    subscriptionPlan,
    subscriptionStatus: params.subscription.status,
    stripeCustomerId:
      typeof params.subscription.customer === "string"
        ? params.subscription.customer
        : (params.subscription.customer?.id ?? null),
    stripeSubscriptionId: params.subscription.id,
  });
}

export async function loadSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return getStripeClient().subscriptions.retrieve(subscriptionId);
}

export function planFromCheckoutMetadata(
  metadata: Stripe.Metadata | null | undefined,
): SubscriptionPlanId | null {
  const raw = metadata?.plan;
  if (raw === "light" || raw === "standard") return raw;
  if (raw === "forest_delivery") return "light";
  return null;
}

export function emailFromCheckoutMetadata(
  metadata: Stripe.Metadata | null | undefined,
  customerEmail: string | null | undefined,
): string | null {
  const fromMeta = metadata?.viewerEmail;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return normalizeEmail(fromMeta);
  }
  if (customerEmail?.trim()) return normalizeEmail(customerEmail);
  return null;
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // TODO(実課金開始時):
  // checkout.session.completed を受け取ったら、購入内容に応じて acornLedger に反映する。
  // - 森の定期便: subscription_delivery として毎月 +100
  // - 単発どんぐり: acorn_purchase として +50
  // 現状は本番課金を開始していないため、台帳への付与は行わない。

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    console.warn("[stripe] checkout.session.completed without subscription", {
      sessionId: session.id,
      mode: session.mode,
      plan: session.metadata?.plan,
    });
    return;
  }

  const subscription = await loadSubscription(subscriptionId);
  await applyStripeSubscriptionToAccount({
    subscription,
    fallbackEmail: emailFromCheckoutMetadata(session.metadata, session.customer_email),
    fallbackPlan: planFromCheckoutMetadata(session.metadata),
  });
}

export async function handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
  await applyStripeSubscriptionToAccount({ subscription });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  const subscription = await loadSubscription(subscriptionId);
  await applyStripeSubscriptionToAccount({ subscription });
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  const subscription = await loadSubscription(subscriptionId);
  await applyStripeSubscriptionToAccount({ subscription });
}
