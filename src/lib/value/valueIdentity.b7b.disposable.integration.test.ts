/**
 * AI-X6.7B7B — Disposable Postgres value/commerce identity ownership.
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon. No live Stripe.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 \
 *   DATABASE_URL='postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public' \
 *     npx vitest run src/lib/value/valueIdentity.b7b.disposable.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  authorizeDonguriSpendUnderValueAuthority,
  sumDonguriBalanceForIdentity,
} from "@/lib/value/donguriIdentityAuthority";
import { loadEntitlementContextForIdentity } from "@/lib/value/entitlementIdentityAuthority";
import {
  authorizeKanteiBindingUnderValueAuthority,
  authorizeOrderIdUnderValueAuthority,
  listKanteiOrdersForIdentity,
} from "@/lib/value/orderIdentityAuthority";
import {
  P1_VALUE_IDENTITY_DUAL_WRITE_FLAG,
  P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG,
  P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG,
} from "@/lib/value/valueIdentityGates";
import { runValueCommerceIdentityBackfill } from "@/lib/value/valueIdentityBackfillRunner";
import { syncAccountSettingsFromStripeUnderValueAuthority } from "@/lib/value/stripeIdentitySyncSafety";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b7b";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;

function bound(
  identityId: string,
  uid: string,
  emailMeta: string,
): P0OwnershipResolution {
  return {
    state: "BOUND",
    identityId,
    firebaseUid: uid,
    evidenceSource: "VERIFIED_FIREBASE_UID",
    legacyActorKeys: [EMAIL_A],
    verifiedEmailMetadata: emailMeta,
    reason: "ok",
  };
}

async function wipe() {
  await prisma.kanteiBookBindingRequest.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.order.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.journalEntry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.profile.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountSettings.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentityLegacyActorClaim.deleteMany({
    where: { actorKey: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentityEmail.deleteMany({
    where: { emailNormalized: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { startsWith: `${PREFIX}-` } },
  });
}

describe.skipIf(!runLocal)("AI-X6.7B7B disposable value/commerce ownership", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    vi.stubEnv(P1_VALUE_IDENTITY_READ_AUTHORITY_FLAG, "YES");
    vi.stubEnv(P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG, "YES");
    vi.stubEnv(P1_VALUE_IDENTITY_DUAL_WRITE_FLAG, "YES");
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
  });

  it("backfill + balance/spend/order/entitlement attack matrix; MIGRATION_VALUE_DELTA=0", async () => {
    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a` },
    });
    const idB = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-b` },
    });

    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        profileLimit: 2,
        subscriptionPlan: "standard",
        subscriptionStatus: "active",
        stripeCustomerId: `cus_${PREFIX}_a`,
      },
    });
    await prisma.accountIdentityLegacyActorClaim.create({
      data: { identityId: idA.id, actorKey: EMAIL_A },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idA.id, emailNormalized: EMAIL_A, status: "primary" },
    });
    await prisma.accountSettings.create({
      data: {
        email: `${PREFIX}-b-current@ljd.invalid`,
        identityId: idB.id,
        profileLimit: 1,
      },
    });

    const profileA = await prisma.profile.create({
      data: {
        email: EMAIL_A,
        nickname: "A",
        identityId: idA.id,
      },
    });

    await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        content: "owned",
        identityId: idA.id,
      },
    });

    const ledgerGrant = await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        amount: 10,
        reason: "admin_grant",
        title: "test grant",
        createdBy: "admin",
      },
    });
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        amount: -3,
        reason: "diary_save",
        title: "save",
        dateKey: "entry:j1",
        createdBy: "user",
      },
    });

    const orderA = await prisma.order.create({
      data: {
        lastName: "山田",
        firstName: "太郎",
        lastNameKana: "やまだ",
        firstNameKana: "たろう",
        lastNameRoman: "Yamada",
        firstNameRoman: "Taro",
        fullNameDisplay: "山田太郎",
        fullNameKanaDisplay: "やまだたろう",
        fullNameRomanDisplay: "Taro Yamada",
        birthDate: "1990-01-15",
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 15,
        postalCode: "",
        address: "",
        phone: "",
        email: EMAIL_A,
        profileId: profileA.id,
        numerologyJson: "{}",
        stonesJson: "[]",
        status: "completed",
      },
    });

    const binding = await prisma.kanteiBookBindingRequest.create({
      data: {
        orderId: orderA.id,
        email: EMAIL_A,
        profileId: profileA.id,
        status: "pending",
        kanteiCode: `LJK-${PREFIX}`,
        fullNameDisplay: "山田太郎",
        birthDate: "1990-01-15",
        orderCreatedAt: orderA.createdAt,
      },
    });

    const beforeSum = await prisma.logHouseDonguriLedgerEntry.aggregate({
      where: { email: { startsWith: `${PREFIX}-` } },
      _sum: { amount: true },
      _count: true,
    });
    const beforeOrderCount = await prisma.order.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const beforeReceiptEmail = orderA.email;

    const dry = await runValueCommerceIdentityBackfill(prisma, {
      mode: "DRY_RUN",
      emailFilter: new Set([EMAIL_A]),
    });
    expect(dry.decisions.some((d) => d.result === "BOUND")).toBe(true);
    expect(dry.donguriAmountSum).toBe(beforeSum._sum.amount ?? 0);

    const apply1 = await runValueCommerceIdentityBackfill(prisma, {
      mode: "APPLY",
      emailFilter: new Set([EMAIL_A]),
    });
    expect(apply1.donguriUpdates + apply1.orderUpdates).toBeGreaterThan(0);
    expect(apply1.donguriAmountSum).toBe(beforeSum._sum.amount ?? 0);

    const apply2 = await runValueCommerceIdentityBackfill(prisma, {
      mode: "APPLY",
      emailFilter: new Set([EMAIL_A]),
    });
    expect(apply2.donguriUpdates).toBe(0);
    expect(apply2.orderUpdates).toBe(0);
    expect(
      apply2.decisions.every(
        (d) => d.result === "ALREADY_BOUND" || d.result !== "BOUND",
      ),
    ).toBe(true);

    const afterSum = await prisma.logHouseDonguriLedgerEntry.aggregate({
      where: { email: { startsWith: `${PREFIX}-` } },
      _sum: { amount: true },
      _count: true,
    });
    const afterOrderCount = await prisma.order.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const orderAfter = await prisma.order.findUnique({
      where: { id: orderA.id },
    });
    expect(afterSum._sum.amount).toBe(beforeSum._sum.amount);
    expect(afterSum._count).toBe(beforeSum._count);
    expect(afterOrderCount).toBe(beforeOrderCount);
    expect(orderAfter?.email).toBe(beforeReceiptEmail);
    expect(orderAfter?.identityId).toBe(idA.id);
    expect(
      (await prisma.logHouseDonguriLedgerEntry.findUnique({
        where: { id: ledgerGrant.id },
      }))?.identityId,
    ).toBe(idA.id);

    // MIGRATION_VALUE_DELTA=0
    expect(
      (afterSum._sum.amount ?? 0) - (beforeSum._sum.amount ?? 0),
    ).toBe(0);

    // Same UID-A after EMAIL-B metadata: balance preserved
    const ownershipA_onB = bound(idA.id, `${PREFIX}-uid-a`, EMAIL_B);
    const balA = await sumDonguriBalanceForIdentity({
      identityId: idA.id,
      profileId: profileA.id,
    });
    expect(balA).toBe(7);

    const spendA = await authorizeDonguriSpendUnderValueAuthority({
      profileId: profileA.id,
      ownership: ownershipA_onB,
    });
    expect(spendA.ok).toBe(true);

    const ordersA = await listKanteiOrdersForIdentity({
      ownership: ownershipA_onB,
      profileId: profileA.id,
    });
    expect(ordersA.map((o) => o.id)).toContain(orderA.id);

    const orderAuthA = await authorizeOrderIdUnderValueAuthority({
      orderId: orderA.id,
      ownership: ownershipA_onB,
    });
    expect(orderAuthA.ok).toBe(true);

    const bindingAuthA = await authorizeKanteiBindingUnderValueAuthority({
      bindingId: binding.id,
      ownership: ownershipA_onB,
    });
    expect(bindingAuthA.ok).toBe(true);

    const entA = await loadEntitlementContextForIdentity(ownershipA_onB);
    expect(entA.settings?.subscriptionPlan).toBe("standard");
    expect(entA.journalEntryCount).toBe(1);

    // UID-B reuses EMAIL-A metadata — zero transfer
    const ownershipB = bound(idB.id, `${PREFIX}-uid-b`, EMAIL_A);
    const balB = await sumDonguriBalanceForIdentity({
      identityId: idB.id,
      profileId: profileA.id,
    });
    expect(balB).toBe(0);

    const spendB = await authorizeDonguriSpendUnderValueAuthority({
      profileId: profileA.id,
      ownership: ownershipB,
      targetLedgerIdentityId: idA.id,
    });
    expect(spendB.ok).toBe(false);
    if (!spendB.ok) expect(spendB.state).toBe("NOT_OWNED");

    const ordersB = await listKanteiOrdersForIdentity({
      ownership: ownershipB,
      profileId: profileA.id,
    });
    expect(ordersB).toHaveLength(0);

    const orderAuthB = await authorizeOrderIdUnderValueAuthority({
      orderId: orderA.id,
      ownership: ownershipB,
    });
    expect(orderAuthB.ok).toBe(false);

    const bindingAuthB = await authorizeKanteiBindingUnderValueAuthority({
      bindingId: binding.id,
      ownership: ownershipB,
    });
    expect(bindingAuthB.ok).toBe(false);

    const entB = await loadEntitlementContextForIdentity(ownershipB);
    expect(entB.settings?.subscriptionPlan ?? null).not.toBe("standard");
    expect(entB.journalEntryCount).toBe(0);

    // Unbound viewer fail-closed
    const unbound: P0OwnershipResolution = {
      state: "UNBOUND",
      identityId: null,
      firebaseUid: `${PREFIX}-uid-x`,
      evidenceSource: "NONE",
      legacyActorKeys: [],
      verifiedEmailMetadata: EMAIL_A,
      reason: "identity_not_bound",
    };
    const spendU = await authorizeDonguriSpendUnderValueAuthority({
      profileId: profileA.id,
      ownership: unbound,
    });
    expect(spendU.ok).toBe(false);
    const orderU = await authorizeOrderIdUnderValueAuthority({
      orderId: orderA.id,
      ownership: unbound,
    });
    expect(orderU.ok).toBe(false);

    // Stripe identity sync: email-only create forbidden; customer id path ok
    const stripeEmailOnly =
      await syncAccountSettingsFromStripeUnderValueAuthority({
        email: EMAIL_A,
        profileLimit: 99,
        subscriptionPlan: "light",
        subscriptionStatus: "active",
      });
    // EMAIL_A settings already identity-owned → applied via identity_owned_email_settings
    expect(stripeEmailOnly.applied).toBe(true);

    const stripeNewEmail =
      await syncAccountSettingsFromStripeUnderValueAuthority({
        email: `${PREFIX}-new@ljd.invalid`,
        profileLimit: 3,
        subscriptionPlan: "light",
        subscriptionStatus: "active",
      });
    expect(stripeNewEmail.applied).toBe(false);
    if (!stripeNewEmail.applied) {
      expect(stripeNewEmail.reason).toBe("email_only_create_forbidden");
    }

    const stripeByCustomer =
      await syncAccountSettingsFromStripeUnderValueAuthority({
        email: EMAIL_B,
        profileLimit: 4,
        subscriptionPlan: "standard",
        subscriptionStatus: "active",
        stripeCustomerId: `cus_${PREFIX}_a`,
      });
    expect(stripeByCustomer.applied).toBe(true);
    if (stripeByCustomer.applied) {
      expect(stripeByCustomer.path).toBe("stripe_customer_id");
    }

    // Insufficient balance / concurrency: second spend against 7 with cost 3 ok once;
    // identity isolation already proven; append spend row for UID-A only
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        amount: -3,
        reason: "diary_save",
        title: "spend2",
        dateKey: "entry:j2",
        createdBy: "user",
        identityId: idA.id,
      },
    });
    const balAfterSpend = await sumDonguriBalanceForIdentity({
      identityId: idA.id,
      profileId: profileA.id,
    });
    expect(balAfterSpend).toBe(4);
    const balBStill = await sumDonguriBalanceForIdentity({
      identityId: idB.id,
      profileId: profileA.id,
    });
    expect(balBStill).toBe(0);

    // Final invariant: no row loss
    const finalCount = await prisma.logHouseDonguriLedgerEntry.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    expect(finalCount).toBe((beforeSum._count as number) + 1);
  });
});
