import Stripe from "stripe";

import {
  getStripeMode,
  resolveStripeSecretKey,
  resolveStripeWebhookSecret,
} from "@/lib/stripe/mode";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function getStripeClient(): Stripe {
  const key = resolveStripeSecretKey();
  if (!key) {
    throw new Error(
      `Stripe secret key is not configured for mode=${getStripeMode()} (STRIPE_SECRET_KEY_${getStripeMode().toUpperCase()} or STRIPE_SECRET_KEY).`,
    );
  }
  if (!stripeClient || stripeClientKey !== key) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
    stripeClientKey = key;
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const raw = resolveStripeWebhookSecret();
  if (!raw) {
    throw new Error(
      `Stripe webhook secret is not configured for mode=${getStripeMode()}.`,
    );
  }
  const match = raw.match(/^(whsec_[^\s#]+)/);
  if (!match) {
    throw new Error("Stripe webhook secret is not configured.");
  }
  return match[1];
}
