import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const raw = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!raw) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  const match = raw.match(/^(whsec_[^\s#]+)/);
  if (!match) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return match[1];
}
