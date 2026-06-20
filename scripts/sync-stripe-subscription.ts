/**
 * Stripe サブスクリプションを AccountSettings に手動同期します。
 * Webhook が届かなかった場合の復旧用。
 *
 * 使い方:
 *   DATABASE_URL=... npx tsx scripts/sync-stripe-subscription.ts user@example.com
 *   DATABASE_URL=... npx tsx scripts/sync-stripe-subscription.ts user@example.com sub_xxx
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { normalizeEmail } from "../src/lib/auth/viewer";
import { prisma } from "../src/lib/db";
import { applyStripeSubscriptionToAccount } from "../src/lib/stripe/webhookHandlers";
import { loadSubscription } from "../src/lib/stripe/webhookHandlers";
import { getStripeClient } from "../src/lib/stripe/client";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function findSubscriptionIdForEmail(email: string): Promise<string | null> {
  const stripe = getStripeClient();
  const settings = await prisma.accountSettings.findUnique({
    where: { email },
    select: { stripeSubscriptionId: true, stripeCustomerId: true },
  });

  if (settings?.stripeSubscriptionId?.trim()) {
    return settings.stripeSubscriptionId.trim();
  }

  if (settings?.stripeCustomerId?.trim()) {
    const subs = await stripe.subscriptions.list({
      customer: settings.stripeCustomerId.trim(),
      status: "all",
      limit: 10,
    });
    const active = subs.data.find((s) => s.status === "active" || s.status === "trialing");
    return active?.id ?? subs.data[0]?.id ?? null;
  }

  const customers = await stripe.customers.list({ email, limit: 5 });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });
    const active = subs.data.find((s) => s.status === "active" || s.status === "trialing");
    if (active) return active.id;
    if (subs.data[0]) return subs.data[0].id;
  }

  return null;
}

async function main() {
  loadEnvLocal();

  const email = normalizeEmail(process.argv[2] ?? "");
  if (!email) {
    console.error("Usage: npx tsx scripts/sync-stripe-subscription.ts user@example.com [sub_xxx]");
    process.exit(1);
  }

  const subscriptionIdArg = process.argv[3]?.trim() || null;
  const subscriptionId = subscriptionIdArg ?? (await findSubscriptionIdForEmail(email));

  if (!subscriptionId) {
    console.error(`No Stripe subscription found for ${email}`);
    process.exit(1);
  }

  const subscription = await loadSubscription(subscriptionId);
  await applyStripeSubscriptionToAccount({
    subscription,
    fallbackEmail: email,
  });

  const updated = await prisma.accountSettings.findUnique({
    where: { email },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      profileLimit: true,
      updatedAt: true,
    },
  });

  console.log("Synced subscription:", subscriptionId);
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
