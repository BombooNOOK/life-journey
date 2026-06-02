import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { findAccountSettingsStripeIds } from "@/lib/stripe/accountSettingsSync";
import { getAppBaseUrl } from "@/lib/stripe/appBaseUrl";
import { getStripeClient } from "@/lib/stripe/client";
import { isSubscriptionPlanId, priceIdForPlan } from "@/lib/stripe/plans";

export async function POST(req: Request) {
  const viewerEmail = normalizeEmail(await getViewerEmailFromCookie());
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です。", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const plan =
    typeof json === "object" && json !== null && "plan" in json
      ? String((json as { plan: unknown }).plan).trim()
      : "";

  if (!isSubscriptionPlanId(plan)) {
    return NextResponse.json({ error: "プラン指定が不正です。", code: "BAD_PLAN" }, { status: 400 });
  }

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe の価格 ID が設定されていません。", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl();
    const existing = await findAccountSettingsStripeIds(viewerEmail);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing/cancel`,
      client_reference_id: viewerEmail,
      metadata: {
        viewerEmail,
        plan,
      },
      subscription_data: {
        metadata: {
          viewerEmail,
          plan,
        },
      },
    };

    if (existing?.stripeCustomerId) {
      sessionParams.customer = existing.stripeCustomerId;
    } else {
      sessionParams.customer_email = viewerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout URL の作成に失敗しました。", code: "STRIPE_NO_URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url, code: "OK" });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Checkout の作成に失敗しました。";
    let message = raw;
    if (raw === "STRIPE_SECRET_KEY is not configured.") {
      message = "Stripe の秘密鍵（STRIPE_SECRET_KEY）が .env.local に設定されていません。";
    } else if (raw.includes("a similar object exists in live mode, but a test mode key was used")) {
      message =
        "Stripe のテストモード用 secret key（sk_test_...）に対して、本番モード（live）の価格 ID が設定されています。Dashboard をテストモードに切り替え、テスト用の price ID を .env.local に設定してください。";
    } else if (raw.includes("a similar object exists in test mode, but a live mode key was used")) {
      message =
        "Stripe の本番用 secret key（sk_live_...）に対して、テストモードの価格 ID が設定されています。キーと price ID のモードを揃えてください。";
    }
    console.error("[stripe] create-checkout-session failed", { viewerEmail, plan, message: raw });
    return NextResponse.json({ error: message, code: "STRIPE_ERROR" }, { status: 502 });
  }
}
