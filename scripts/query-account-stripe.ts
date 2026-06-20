import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npx tsx scripts/query-account-stripe.ts user@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.accountSettings.findUnique({
    where: { email },
    select: {
      email: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      profileLimit: true,
      updatedAt: true,
    },
  });
  console.log(JSON.stringify(row, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
