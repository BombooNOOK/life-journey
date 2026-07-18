import { resolveStripePriceId, type StripePricePlan } from "@/lib/stripe/mode";

/** 既存 AccountSettings.subscriptionPlan 互換（light / standard） */
export type SubscriptionPlanId = "light" | "standard";

/** Checkout で扱う商品（どんぐり経済圏） */
export type CheckoutPlanId = "forest_delivery" | "acorn_50" | "light" | "standard";

export const SUBSCRIPTION_PLAN_PROFILE_LIMIT: Record<SubscriptionPlanId, number> = {
  light: 1,
  standard: 3,
};

const FREE_PROFILE_LIMIT = 1;

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return value === "light" || value === "standard";
}

export function isCheckoutPlanId(value: string): value is CheckoutPlanId {
  return (
    value === "forest_delivery" ||
    value === "acorn_50" ||
    value === "light" ||
    value === "standard"
  );
}

export function deriveSubscriptionPlanLabel(plan: string | null | undefined): string {
  if (plan === "light" || plan === "forest_delivery") return "森の定期便";
  if (plan === "standard") return "森の定期便";
  if (plan === "acorn_50") return "どんぐり50こ";
  if (plan === "acorn_20") return "どんぐり20こ";
  return "フリープラン";
}

/** アカウント情報向け：契約中かどうかで世界観のある文言にする */
export function deriveForestDeliveryStatusLabel(params: {
  isOnForestDelivery: boolean;
  subscriptionPlan?: string | null;
}): string {
  if (params.isOnForestDelivery) {
    return "森の定期便に加わっています";
  }
  return "まだ森の定期便には加わっていません";
}

export function priceIdForPlan(plan: CheckoutPlanId): string | null {
  return resolveStripePriceId({ plan: plan as StripePricePlan });
}

export function checkoutModeForPlan(plan: CheckoutPlanId): "subscription" | "payment" {
  return plan === "acorn_50" ? "payment" : "subscription";
}

export function planFromPriceId(priceId: string | null | undefined): SubscriptionPlanId | null {
  if (!priceId) return null;
  const light = resolveStripePriceId({ plan: "light" });
  const standard = resolveStripePriceId({ plan: "standard" });
  const forest = resolveStripePriceId({ plan: "forest_delivery" });
  if (light && priceId === light) return "light";
  if (forest && priceId === forest) return "light";
  if (standard && priceId === standard) return "standard";
  return null;
}

export function profileLimitForPlan(plan: SubscriptionPlanId | null): number {
  if (!plan) return FREE_PROFILE_LIMIT;
  return SUBSCRIPTION_PLAN_PROFILE_LIMIT[plan];
}

/** active / trialing 以外はフリープラン相当に戻す */
export function isStripeSubscriptionEntitled(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}
