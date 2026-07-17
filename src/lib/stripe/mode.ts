export type StripeMode = "test" | "live";

/** STRIPE_MODE がなければ secret key のプレフィックスから推定 */
export function getStripeMode(): StripeMode {
  const explicit = process.env.STRIPE_MODE?.trim().toLowerCase();
  if (explicit === "live" || explicit === "test") return explicit;

  const secret =
    process.env.STRIPE_SECRET_KEY_LIVE?.trim() ||
    process.env.STRIPE_SECRET_KEY_TEST?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    "";
  if (secret.startsWith("sk_live_")) return "live";
  return "test";
}

function pickEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return null;
}

export function resolveStripeSecretKey(): string | null {
  const mode = getStripeMode();
  if (mode === "live") {
    return pickEnv("STRIPE_SECRET_KEY_LIVE", "STRIPE_SECRET_KEY");
  }
  return pickEnv("STRIPE_SECRET_KEY_TEST", "STRIPE_SECRET_KEY");
}

export function resolveStripeWebhookSecret(): string | null {
  const mode = getStripeMode();
  if (mode === "live") {
    return pickEnv("STRIPE_WEBHOOK_SECRET_LIVE", "STRIPE_WEBHOOK_SECRET");
  }
  return pickEnv("STRIPE_WEBHOOK_SECRET_TEST", "STRIPE_WEBHOOK_SECRET");
}

export function resolveStripePriceId(params: {
  plan: "light" | "standard" | "acorn_50" | "forest_delivery";
}): string | null {
  const mode = getStripeMode();
  const { plan } = params;

  if (plan === "light") {
    return mode === "live"
      ? pickEnv("STRIPE_PRICE_LIGHT_LIVE", "STRIPE_PRICE_LIGHT")
      : pickEnv("STRIPE_PRICE_LIGHT_TEST", "STRIPE_PRICE_LIGHT");
  }
  if (plan === "standard") {
    return mode === "live"
      ? pickEnv("STRIPE_PRICE_STANDARD_LIVE", "STRIPE_PRICE_STANDARD")
      : pickEnv("STRIPE_PRICE_STANDARD_TEST", "STRIPE_PRICE_STANDARD");
  }
  if (plan === "acorn_50") {
    return mode === "live"
      ? pickEnv("STRIPE_PRICE_ACORN_50_LIVE", "STRIPE_PRICE_ACORN_50")
      : pickEnv("STRIPE_PRICE_ACORN_50_TEST", "STRIPE_PRICE_ACORN_50");
  }
  return mode === "live"
    ? pickEnv("STRIPE_PRICE_FOREST_DELIVERY_LIVE", "STRIPE_PRICE_FOREST_DELIVERY")
    : pickEnv("STRIPE_PRICE_FOREST_DELIVERY_TEST", "STRIPE_PRICE_FOREST_DELIVERY");
}

/** 本番導線からの Checkout を止める（明示オプトインのみ許可） */
export function isStripeCheckoutEnabled(): boolean {
  return process.env.STRIPE_CHECKOUT_ENABLED?.trim() === "1";
}
