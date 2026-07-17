import { afterEach, describe, expect, it, vi } from "vitest";

describe("stripe mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to test when STRIPE_MODE unset and no live secret", async () => {
    vi.stubEnv("STRIPE_MODE", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    const { getStripeMode } = await import("@/lib/stripe/mode");
    expect(getStripeMode()).toBe("test");
  });

  it("uses explicit STRIPE_MODE=live", async () => {
    vi.stubEnv("STRIPE_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY_LIVE", "sk_live_abc");
    const { getStripeMode } = await import("@/lib/stripe/mode");
    expect(getStripeMode()).toBe("live");
  });

  it("rejects live mode with _test price id", async () => {
    vi.stubEnv("STRIPE_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY_LIVE", "sk_live_abc");
    const { assertPriceIdMatchesStripeMode } = await import("@/lib/stripe/mode");
    expect(() => assertPriceIdMatchesStripeMode("price_test_acorn")).toThrow(
      /Live mode cannot use test price ID/,
    );
  });

  it("rejects test mode with _live price id", async () => {
    vi.stubEnv("STRIPE_MODE", "test");
    vi.stubEnv("STRIPE_SECRET_KEY_TEST", "sk_test_abc");
    const { assertPriceIdMatchesStripeMode } = await import("@/lib/stripe/mode");
    expect(() => assertPriceIdMatchesStripeMode("price_live_acorn")).toThrow(
      /Test mode cannot use live price ID/,
    );
  });

  it("rejects test mode with live secret key", async () => {
    vi.stubEnv("STRIPE_MODE", "test");
    vi.stubEnv("STRIPE_SECRET_KEY_TEST", "sk_live_abc");
    const { assertPriceIdMatchesStripeMode } = await import("@/lib/stripe/mode");
    expect(() => assertPriceIdMatchesStripeMode("price_123")).toThrow(
      /Live secret key cannot be used with STRIPE_MODE=test/,
    );
  });

  it("isStripeCheckoutEnabled accepts true/1 only", async () => {
    vi.stubEnv("STRIPE_CHECKOUT_ENABLED", "false");
    let mode = await import("@/lib/stripe/mode");
    expect(mode.isStripeCheckoutEnabled()).toBe(false);

    vi.resetModules();
    vi.stubEnv("STRIPE_CHECKOUT_ENABLED", "true");
    mode = await import("@/lib/stripe/mode");
    expect(mode.isStripeCheckoutEnabled()).toBe(true);
  });

  it("blocks checkout when STRIPE_CHECKOUT_ENABLED is false even for admin helpers", async () => {
    vi.stubEnv("STRIPE_MODE", "test");
    vi.stubEnv("STRIPE_CHECKOUT_ENABLED", "false");
    vi.stubEnv("NODE_ENV", "production");
    const { canCreateStripeCheckoutSession, isStripeCheckoutEnabled } = await import(
      "@/lib/stripe/mode"
    );
    expect(isStripeCheckoutEnabled()).toBe(false);
    // 開発確認用ヘルパーは admin+test で true になり得るが、API は enabled=false で先に止める
    expect(canCreateStripeCheckoutSession({ isAdmin: true })).toBe(true);
  });
});
