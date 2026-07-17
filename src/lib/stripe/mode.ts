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

export type StripePricePlan =
  | "light"
  | "standard"
  | "acorn_50"
  | "forest_delivery";

export function resolveStripePriceId(params: { plan: StripePricePlan }): string | null {
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
  // forest_delivery: 専用 env → なければ旧 light 価格へフォールバック（移行期間）
  const dedicated =
    mode === "live"
      ? pickEnv("STRIPE_PRICE_FOREST_DELIVERY_LIVE", "STRIPE_PRICE_FOREST_DELIVERY")
      : pickEnv("STRIPE_PRICE_FOREST_DELIVERY_TEST", "STRIPE_PRICE_FOREST_DELIVERY");
  if (dedicated) return dedicated;
  return mode === "live"
    ? pickEnv("STRIPE_PRICE_LIGHT_LIVE", "STRIPE_PRICE_LIGHT")
    : pickEnv("STRIPE_PRICE_LIGHT_TEST", "STRIPE_PRICE_LIGHT");
}

/**
 * secret key と price ID / STRIPE_MODE の test・live 混在を防ぐ。
 * Checkout 作成前に必ず呼ぶ。
 */
export function assertPriceIdMatchesStripeMode(priceId: string): void {
  const mode = getStripeMode();
  const secret = resolveStripeSecretKey() ?? "";
  const id = priceId.trim();

  if (secret.startsWith("sk_live_") && mode === "test") {
    throw new Error("Live secret key cannot be used with STRIPE_MODE=test");
  }
  if (secret.startsWith("sk_test_") && mode === "live") {
    throw new Error("Test secret key cannot be used with STRIPE_MODE=live");
  }

  // 命名に _test / _live を含む場合の明示チェック（例: price_test_xxx）
  if (mode === "live" && id.includes("_test")) {
    throw new Error("Live mode cannot use test price ID");
  }
  if (mode === "test" && id.includes("_live")) {
    throw new Error("Test mode cannot use live price ID");
  }
  if (secret.startsWith("sk_live_") && id.includes("_test")) {
    throw new Error("Live mode cannot use test price ID");
  }
  if (secret.startsWith("sk_test_") && id.includes("_live")) {
    throw new Error("Test mode cannot use live price ID");
  }
}

/** 本番ユーザー導線の Checkout を明示オプトインしたとき true（"1" / "true"） */
export function isStripeCheckoutEnabled(): boolean {
  const v = process.env.STRIPE_CHECKOUT_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true";
}

/**
 * Checkout セッション作成を許可するか。
 * - STRIPE_CHECKOUT_ENABLED=true のときのみユーザー向け本番導線を想定
 * - 無効時は、開発環境 or 管理者 + test mode のみ（確認用）
 */
export function canCreateStripeCheckoutSession(opts?: { isAdmin?: boolean }): boolean {
  if (isStripeCheckoutEnabled()) {
    return true;
  }

  const mode = getStripeMode();
  if (mode !== "test") {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return opts?.isAdmin === true;
}
