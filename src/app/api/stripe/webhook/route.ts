import { NextResponse } from "next/server";

import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/client";
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleSubscriptionEvent,
} from "@/lib/stripe/webhookHandlers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = getStripeClient().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Webhook signature verification failed";
    const message =
      raw === "STRIPE_WEBHOOK_SECRET is not configured."
        ? "Stripe の Webhook secret（STRIPE_WEBHOOK_SECRET）が .env.local に設定されていません。"
        : raw;
    console.error("[stripe] webhook verify failed", raw);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler failed";
    console.error("[stripe] webhook handler error", {
      type: event.type,
      id: event.id,
      message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  console.info("[stripe] webhook processed", { type: event.type, id: event.id });
  return NextResponse.json({ received: true });
}
