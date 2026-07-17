import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { isPaidSubscriber } from "@/lib/entitlement/resolveUserEntitlement";
import {
  requestSubscriptionCancelAtPeriodEnd,
  resolveSubscriptionCancelState,
} from "@/lib/stripe/subscriptionCancelState";

export async function POST() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
      },
    }),
  );

  if (!isPaidSubscriber(settings)) {
    return NextResponse.json(
      { error: "森の定期便をご利用中ではありません。", code: "NOT_PAID" },
      { status: 400 },
    );
  }

  const cancelState = await resolveSubscriptionCancelState(settings);
  if (cancelState.cancelAtPeriodEnd) {
    return NextResponse.json(
      {
        error: "解約申込済みです。",
        code: "ALREADY_CANCELED",
        periodEndLabel: cancelState.periodEndLabel,
      },
      { status: 409 },
    );
  }

  const subscriptionId = settings?.stripeSubscriptionId?.trim();
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "契約情報を確認できませんでした。", code: "SUBSCRIPTION_MISSING" },
      { status: 400 },
    );
  }

  try {
    const result = await requestSubscriptionCancelAtPeriodEnd(subscriptionId);
    return NextResponse.json({
      code: "OK",
      periodEndLabel: result.periodEndLabel,
    });
  } catch (error) {
    console.error("[account:cancel-subscription]", error);
    return NextResponse.json(
      { error: "解約申込の処理に失敗しました。時間をおいて再度お試しください。", code: "STRIPE_ERROR" },
      { status: 500 },
    );
  }
}
