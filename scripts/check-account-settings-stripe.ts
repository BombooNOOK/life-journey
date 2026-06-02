/**
 * AccountSettings の Stripe 連携状態を確認（ローカル DB）。
 * 使い方: npm run db:local:stripe-status -- user@example.com
 */
import { PrismaClient } from "@prisma/client";

import { deriveSubscriptionPlanLabel } from "../src/lib/stripe/plans";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run db:local:stripe-status -- user@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.accountSettings.findUnique({
    where: { email },
    select: {
      email: true,
      profileLimit: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriberPdfAccess: true,
      updatedAt: true,
    },
  });

  if (!row) {
    console.log(`AccountSettings not found for: ${email}`);
    return;
  }

  console.log(JSON.stringify(
    {
      ...row,
      planLabel: deriveSubscriptionPlanLabel(row.subscriptionPlan),
    },
    null,
    2,
  ));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
