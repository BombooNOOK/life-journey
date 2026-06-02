export type SubscriptionPlanId = "light" | "standard";

export const SUBSCRIPTION_PLAN_PROFILE_LIMIT: Record<SubscriptionPlanId, number> = {
  light: 1,
  standard: 3,
};

const FREE_PROFILE_LIMIT = 1;

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return value === "light" || value === "standard";
}

export function deriveSubscriptionPlanLabel(plan: string | null | undefined): string {
  if (plan === "light") return "ライトプラン";
  if (plan === "standard") return "スタンダードプラン";
  return "フリープラン";
}

export function priceIdForPlan(plan: SubscriptionPlanId): string | null {
  const envKey = plan === "light" ? "STRIPE_PRICE_LIGHT" : "STRIPE_PRICE_STANDARD";
  const id = process.env[envKey]?.trim();
  return id || null;
}

export function planFromPriceId(priceId: string | null | undefined): SubscriptionPlanId | null {
  if (!priceId) return null;
  const light = process.env.STRIPE_PRICE_LIGHT?.trim();
  const standard = process.env.STRIPE_PRICE_STANDARD?.trim();
  if (light && priceId === light) return "light";
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
