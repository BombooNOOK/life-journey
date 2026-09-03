/**
 * AI-X6.7B7B — Stripe sync ownership safety (LOCAL / mocked only).
 *
 * Separates:
 *   A. Stripe customer lookup/contact synchronization
 *   B. Application ownership/entitlement authority
 *
 * Identity mode: never grant app ownership/entitlement by webhook email alone.
 * Durable mapping: AccountSettings.stripeCustomerId on an identity-owned row.
 *
 * NO LIVE STRIPE CALLS from this module.
 */

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { SubscriptionPlanId } from "@/lib/stripe/plans";
import { isP1ValueIdentityMutationAuthorityEnabled } from "@/lib/value/valueIdentityGates";

export type SyncAccountSettingsFromStripeParams = {
  email: string;
  profileLimit: number;
  subscriptionPlan: SubscriptionPlanId | null;
  subscriptionStatus: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export type StripeSyncIdentityResult =
  | { applied: true; path: "stripe_customer_id" | "identity_owned_email_settings" }
  | {
      applied: false;
      reason:
        | "unresolved_customer_mapping"
        | "email_only_create_forbidden"
        | "empty_email";
    };

/**
 * Identity-mode Stripe → AccountSettings sync.
 * Updates only when durable stripeCustomerId matches, or an already
 * identity-bound settings row matches contact email.
 * Never creates a new settings row from email alone.
 */
export async function syncAccountSettingsFromStripeUnderValueAuthority(
  params: SyncAccountSettingsFromStripeParams,
): Promise<StripeSyncIdentityResult> {
  const email = normalizeEmail(params.email);
  if (!email) return { applied: false, reason: "empty_email" };

  const stripeCustomerId = params.stripeCustomerId?.trim() || null;
  const stripeSubscriptionId = params.stripeSubscriptionId?.trim() || null;
  const data = {
    profileLimit: params.profileLimit,
    subscriptionPlan: params.subscriptionPlan,
    subscriptionStatus: params.subscriptionStatus,
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
    ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
  };

  if (stripeCustomerId) {
    const byCustomer = await prisma.accountSettings.findUnique({
      where: { stripeCustomerId },
      select: { id: true, identityId: true },
    });
    if (byCustomer) {
      await prisma.accountSettings.update({
        where: { id: byCustomer.id },
        data,
      });
      return { applied: true, path: "stripe_customer_id" };
    }
  }

  const byEmail = await prisma.accountSettings.findUnique({
    where: { email },
    select: { id: true, identityId: true },
  });
  if (byEmail?.identityId) {
    await prisma.accountSettings.update({
      where: { id: byEmail.id },
      data,
    });
    return { applied: true, path: "identity_owned_email_settings" };
  }

  // Do not create/upsert email-only ownership in identity mode.
  return {
    applied: false,
    reason: byEmail
      ? "unresolved_customer_mapping"
      : "email_only_create_forbidden",
  };
}

/**
 * Bridge used by webhook handlers when value mutation gate is consulted.
 * Gate OFF → caller should use legacy syncAccountSettingsFromStripe.
 */
export function shouldUseStripeIdentitySyncAuthority(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return isP1ValueIdentityMutationAuthorityEnabled(env);
}

/**
 * Unresolved production mapping requirements (explicit; no invention).
 */
export const STRIPE_IDENTITY_MAPPING_UNRESOLVED = [
  "Production Stripe customer ↔ AccountIdentity durable join beyond AccountSettings.stripeCustomerId is not invented in B7B.",
  "Webhook email contact fields remain metadata; app entitlement authority is identity-owned AccountSettings.",
  "No Stripe customer create/update/email-change API calls in this phase.",
] as const;
