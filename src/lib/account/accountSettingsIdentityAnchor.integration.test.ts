/**
 * AI-X6.5A local disposable DB: AccountSettings.identityId migration + UNIQUE.
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/account/accountSettingsIdentityAnchor.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const UID_A = "x65a-uid-a";
const UID_B = "x65a-uid-b";
const EMAIL_A = "x65a-a@ljd.invalid";
const EMAIL_B = "x65a-b@ljd.invalid";
const EMAIL_SHARED = "x65a-shared@ljd.invalid";

async function wipeSynthetic() {
  await prisma.accountSettings.deleteMany({
    where: { email: { in: [EMAIL_A, EMAIL_B, EMAIL_SHARED] } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { in: [UID_A, UID_B] } },
  });
}

describe.skipIf(!runLocal)("AI-X6.5A AccountSettings identityId local migration", () => {
  let settingsBefore = 0;
  let identityBefore = 0;

  beforeAll(async () => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toMatch(/^(127\.0\.0\.1|localhost)$/);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    settingsBefore = await prisma.accountSettings.count();
    identityBefore = await prisma.accountIdentity.count();

    // Column must exist after local migrate deploy.
    const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'AccountSettings'
        AND column_name = 'identityId'
    `;
    expect(cols.length).toBe(1);
  });

  beforeEach(async () => {
    await wipeSynthetic();
  });

  afterAll(async () => {
    await wipeSynthetic();
    expect(await prisma.accountSettings.count()).toBe(settingsBefore);
    expect(await prisma.accountIdentity.count()).toBe(identityBefore);
    await prisma.$disconnect();
  });

  it("A: existing AccountSettings rows have identityId NULL initially (sample)", async () => {
    const nullCount = await prisma.accountSettings.count({
      where: { identityId: null },
    });
    const total = await prisma.accountSettings.count();
    // All current local rows should be unbound until an explicit bind phase.
    expect(nullCount).toBe(total);
  });

  it("B: one identity ↔ one AccountSettings via identityId", async () => {
    const identity = await prisma.accountIdentity.create({
      data: { firebaseUid: UID_A },
    });
    const settings = await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: identity.id },
    });
    const found = await prisma.accountSettings.findUnique({
      where: { identityId: identity.id },
    });
    expect(found?.id).toBe(settings.id);
    expect(found?.email).toBe(EMAIL_A);
  });

  it("C: same identity cannot own two AccountSettings (UNIQUE)", async () => {
    const identity = await prisma.accountIdentity.create({
      data: { firebaseUid: UID_A },
    });
    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: identity.id },
    });
    await expect(
      prisma.accountSettings.create({
        data: { email: EMAIL_B, identityId: identity.id },
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it("D: email metadata can change while identityId stays", async () => {
    const identity = await prisma.accountIdentity.create({
      data: { firebaseUid: UID_A },
    });
    const settings = await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: identity.id },
    });
    const updated = await prisma.accountSettings.update({
      where: { id: settings.id },
      data: { email: EMAIL_B },
    });
    expect(updated.identityId).toBe(identity.id);
    expect(updated.email).toBe(EMAIL_B);
    const byIdentity = await prisma.accountSettings.findUnique({
      where: { identityId: identity.id },
    });
    expect(byIdentity?.id).toBe(settings.id);
  });

  it("E: FK Restrict blocks identity delete while settings reference it", async () => {
    const identity = await prisma.accountIdentity.create({
      data: { firebaseUid: UID_A },
    });
    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: identity.id },
    });
    await expect(
      prisma.accountIdentity.delete({ where: { id: identity.id } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it("email unique retained; multiple NULL identityId allowed", async () => {
    await prisma.accountSettings.create({ data: { email: EMAIL_A } });
    await prisma.accountSettings.create({ data: { email: EMAIL_B } });
    const nulls = await prisma.accountSettings.count({
      where: {
        email: { in: [EMAIL_A, EMAIL_B] },
        identityId: null,
      },
    });
    expect(nulls).toBe(2);
  });
});
