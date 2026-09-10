/**
 * AI-X6.7C1.5A2-I3.6 — write-on-read removal for Donguri awards
 * (unit + local disposable integration).
 *
 * Hard gate for DB tests: only 127.0.0.1:5433/ljd_dev. Never Neon.
 *
 * Run unit:
 *   npm test -- src/lib/loghouse/donguriWriteOnRead.i36.test.ts
 *
 * Run with local DB:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/loghouse/donguriWriteOnRead.i36.test.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  ensureDailyAcornDelivery,
  ensureWelcomeAcornGift,
} from "@/lib/loghouse/donguriLedger";
import { runDonguriVisitAwardsForViewer } from "@/lib/loghouse/donguriVisitAwards";
import { DONGURI_WELCOME_GIFT_AMOUNT } from "@/lib/loghouse/donguriTypes";
import { deliverWelcomeAcornGiftForEmail } from "@/lib/forestResident/forestResidentNumber";
import { P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG } from "@/lib/value/valueIdentityGates";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i36";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const UID_A = `${PREFIX}-uid-a`;
const UID_B = `${PREFIX}-uid-b`;
const PROFILE_A = `${PREFIX}-profile-a`;
const PROFILE_B = `${PREFIX}-profile-b`;
const DAY = "2099-03-20";
const NOW = new Date("2099-03-20T03:00:00+09:00");

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
    legacyActorKeys: [],
    verifiedEmailMetadata: emailMeta,
    reason: "ok",
  };
}

async function wipe() {
  await prisma.logHouseMailboxNotice.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountSettings.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.profile.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentityEmail.deleteMany({
    where: { emailNormalized: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { startsWith: `${PREFIX}-` } },
  });
}

async function seedIdentity(uid: string, primaryEmail: string) {
  return prisma.accountIdentity.create({
    data: {
      firebaseUid: uid,
      emails: {
        create: { emailNormalized: primaryEmail, status: "primary" },
      },
    },
    select: { id: true },
  });
}

async function seedProfile(id: string, email: string, identityId: string | null) {
  return prisma.profile.create({
    data: { id, email, nickname: "メイン", identityId },
  });
}

async function countDonguri(email: string) {
  return prisma.logHouseDonguriLedgerEntry.count({ where: { email } });
}

describe("AI-X6.7C1.5A2-I3.6 write-on-read source invariants", () => {
  it("DREAD2_SOURCE: /orders page no longer calls award helpers in render", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/app/orders/page.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/ensureDailyAcornDelivery/);
    expect(src).not.toMatch(/ensureBirthdayAcornGift/);
    expect(src).not.toMatch(/ensureWelcomeAcornGift/);
    expect(src).toMatch(/getDonguriChoView/);
  });

  it("orders hub mounts explicit visit-awards sync client", () => {
    const hub = readFileSync(
      path.join(process.cwd(), "src/components/orders/LogHouseHub.tsx"),
      "utf8",
    );
    expect(hub).toMatch(/LogHouseVisitAwardsSync/);
    const sync = readFileSync(
      path.join(process.cwd(), "src/components/orders/LogHouseVisitAwardsSync.tsx"),
      "utf8",
    );
    expect(sync).toMatch(/method:\s*"POST"/);
    expect(sync).toMatch(/\/api\/loghouse\/donguri\/visit-awards/);
  });

  it("forestResident ensure path does not call welcome gift", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/lib/forestResident/forestResidentNumber.ts"),
      "utf8",
    );
    expect(src).toMatch(/deliverWelcomeAcornGiftForEmail/);
    // ensureForestResidentForEmail body must not invoke ensureWelcomeAcornGift
    const ensureFn = src.slice(
      src.indexOf("export async function ensureForestResidentForEmail"),
      src.indexOf("async function loadForestResidentCardData"),
    );
    expect(ensureFn).not.toMatch(/ensureWelcomeAcornGift/);
    expect(ensureFn).not.toMatch(/deliverWelcomeAcornGiftForEmail/);
  });

  it("GET visit-awards is 405 and does not mutate", async () => {
    const { GET, POST } = await import(
      "@/app/api/loghouse/donguri/visit-awards/route"
    );
    const getRes = await GET();
    expect(getRes.status).toBe(405);
    expect(typeof POST).toBe("function");
  });

  it("T_LOGIN_SAFE_RETURN_NO_DONGURI_WRITE source: safe GETs have no award helpers", () => {
    const font = readFileSync(
      path.join(process.cwd(), "src/app/api/account/reading-font-size/route.ts"),
      "utf8",
    );
    const verified = readFileSync(
      path.join(process.cwd(), "src/app/api/auth/session/verified/route.ts"),
      "utf8",
    );
    for (const src of [font, verified]) {
      expect(src).not.toMatch(/ensureDailyAcornDelivery/);
      expect(src).not.toMatch(/ensureWelcomeAcornGift/);
      expect(src).not.toMatch(/ensureBirthdayAcornGift/);
    }
  });
});

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I3.6 Donguri write-on-read local DB", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    console.log(
      `I36_LOCAL_DB host=${audit.host} port=${audit.port} database=${audit.database}`,
    );
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    expect(process.env[P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG] ?? "").not.toMatch(
      /^(YES|1)$/,
    );
    await wipe();
  });

  afterAll(async () => {
    await wipe();
    await prisma.$disconnect();
  });

  it("DREAD1/DREAD3: read-model path (getDonguriChoView only) does not award", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const before = await countDonguri(EMAIL_A);
    const { getDonguriChoView } = await import("@/lib/loghouse/donguriLedger");
    await getDonguriChoView({ email: EMAIL_A, profileId: PROFILE_A });
    await getDonguriChoView({ email: EMAIL_A, profileId: PROFILE_A });
    await getDonguriChoView({ email: EMAIL_A, profileId: PROFILE_A });
    expect(await countDonguri(EMAIL_A)).toBe(before);
  });

  it("DWRITE1: explicit visit awards delivers one daily +1", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);

    const ownership = bound(identity.id, UID_A, EMAIL_A);
    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    expect(r.delivered).toBe(true);
    const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: { email: EMAIL_A, reason: "daily_delivery" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amount).toBe(1);
    expect(rows[0]!.dateKey).toBe(DAY);
    expect(rows[0]!.identityId).toBe(identity.id);
  });

  it("DWRITE2: repeat same day does not duplicate", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const ownership = bound(identity.id, UID_A, EMAIL_A);
    const deps = { resolveOwnership: async () => ownership };
    const first = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: deps,
    });
    const second = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: deps,
    });
    expect(first.delivered).toBe(true);
    expect(second.delivered).toBe(false);
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
      }),
    ).toBe(1);
  });

  it("DWRITE3: concurrent explicit daily mutations award at most one", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const ownership = bound(identity.id, UID_A, EMAIL_A);
    const deps = { resolveOwnership: async () => ownership };
    const results = await Promise.all([
      ensureDailyAcornDelivery({
        email: EMAIL_A,
        profileId: PROFILE_A,
        now: NOW,
        ownershipDeps: deps,
      }),
      ensureDailyAcornDelivery({
        email: EMAIL_A,
        profileId: PROFILE_A,
        now: NOW,
        ownershipDeps: deps,
      }),
      ensureDailyAcornDelivery({
        email: EMAIL_A,
        profileId: PROFILE_A,
        now: NOW,
        ownershipDeps: deps,
      }),
    ]);
    const delivered = results.filter((r) => r.delivered).length;
    expect(delivered).toBeLessThanOrEqual(1);
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
      }),
    ).toBe(1);
  });

  it("DWRITE4: same UID email A→B keeps same identityId on daily award", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    // session email becomes B metadata, ownership still UID-A identity
    const ownership = bound(identity.id, UID_A, EMAIL_B);
    const r = await ensureDailyAcornDelivery({
      email: EMAIL_B,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { reason: "daily_delivery", dateKey: DAY, profileId: PROFILE_A },
    });
    expect(row?.identityId).toBe(identity.id);
  });

  it("DWRITE5: UID-B reusing EMAIL-A never receives UID-A identityId", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await seedProfile(PROFILE_B, EMAIL_B, idB.id);
    // UID-B ownership with contact email A (reuse) must bind to B identity only
    const ownershipB = bound(idB.id, UID_B, EMAIL_A);
    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_B,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => ownershipB },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_B, reason: "daily_delivery", dateKey: DAY },
    });
    expect(row?.identityId).toBe(idB.id);
    expect(row?.identityId).not.toBe(idA.id);
  });

  it("visit-awards helper awards via explicit path only", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const ownership = bound(identity.id, UID_A, EMAIL_A);
    const before = await countDonguri(EMAIL_A);
    const result = await runDonguriVisitAwardsForViewer({
      viewerEmail: EMAIL_A,
      now: NOW,
      resolveProfileId: async () => PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    expect(result.profileId).toBe(PROFILE_A);
    expect(result.dailyDelivered).toBe(true);
    expect(await countDonguri(EMAIL_A)).toBeGreaterThan(before);
    const daily = await prisma.logHouseDonguriLedgerEntry.count({
      where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
    });
    expect(daily).toBe(1);
    const second = await runDonguriVisitAwardsForViewer({
      viewerEmail: EMAIL_A,
      now: NOW,
      resolveProfileId: async () => PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    expect(second.dailyDelivered).toBe(false);
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
      }),
    ).toBe(1);
  });

  it("WREAD1: ensureForestResidentForEmail does not create welcome_gift", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        forestResidentNumber: "BN-000802100",
        forestResidentIssuedAt: new Date(),
        profileLimit: 1,
      },
    });
    const { ensureForestResidentForEmail } = await import(
      "@/lib/forestResident/forestResidentNumber"
    );
    // I3.8: ownership is required; use identity_not_bound so email bootstrap
    // returns the already-issued row without cookies()/session.
    await ensureForestResidentForEmail(EMAIL_A, {
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: UID_A,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "identity_not_bound",
      }),
    });
    await ensureForestResidentForEmail(EMAIL_A, {
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: UID_A,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "identity_not_bound",
      }),
    });
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "welcome_gift" },
      }),
    ).toBe(0);
  });

  it("WWRITE1/2/3: explicit welcome mutation once with identityId", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const ownership = bound(identity.id, UID_A, EMAIL_A);
    const first = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    const second = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => ownership },
    });
    expect(first.delivered).toBe(true);
    expect(second.delivered).toBe(false);
    const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: { email: EMAIL_A, reason: "welcome_gift" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amount).toBe(DONGURI_WELCOME_GIFT_AMOUNT);
    expect(rows[0]!.identityId).toBe(identity.id);
  });

  it("WWRITE4: email reuse does not transfer foreign welcome identity", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await seedProfile(PROFILE_B, EMAIL_B, idB.id);
    await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A) },
    });
    // UID-B with EMAIL-A contact must not attach to identity A
    const r = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_B,
      ownershipDeps: { resolveOwnership: async () => bound(idB.id, UID_B, EMAIL_A) },
    });
    // Already has welcome on EMAIL-A account key — one-time by email
    expect(r.delivered).toBe(false);
    const foreign = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: { identityId: idA.id, reason: "welcome_gift" },
    });
    expect(foreign.every((row) => row.profileId === PROFILE_A)).toBe(true);
  });

  it("deliverWelcomeAcornGiftForEmail is the mutation wrapper", async () => {
    const identity = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, identity.id);
    const ownership = bound(identity.id, UID_A, EMAIL_A);
    await deliverWelcomeAcornGiftForEmail(EMAIL_A, {
      resolveOwnership: async () => ownership,
    });
    await deliverWelcomeAcornGiftForEmail(EMAIL_A, {
      resolveOwnership: async () => ownership,
    });
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "welcome_gift" },
      }),
    ).toBe(1);
  });
});
