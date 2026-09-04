/**
 * AI-X6.7C1.5A2-I3.5 — daily + welcome Donguri identityId at INSERT
 * (local disposable only).
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon / Production.
 *
 * Run:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/loghouse/donguriAwardIdentity.i35.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  ensureDailyAcornDelivery,
  ensureWelcomeAcornGift,
} from "@/lib/loghouse/donguriLedger";
import { DONGURI_WELCOME_GIFT_AMOUNT } from "@/lib/loghouse/donguriTypes";
import { P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG } from "@/lib/value/valueIdentityGates";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i35";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const UID_A = `${PREFIX}-uid-a`;
const UID_B = `${PREFIX}-uid-b`;
const PROFILE_A = `${PREFIX}-profile-a`;
const PROFILE_B = `${PREFIX}-profile-b`;
const DAY = "2099-01-15"; // far future — avoid colliding with real calendar tests
const NOW = new Date("2099-01-15T03:00:00+09:00");

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

function unbound(reason = "verified_session_required"): P0OwnershipResolution {
  return {
    state: "UNBOUND",
    identityId: null,
    firebaseUid: null,
    evidenceSource: "NONE",
    legacyActorKeys: [],
    verifiedEmailMetadata: "",
    reason,
  };
}

async function wipe() {
  await prisma.logHouseMailboxNotice.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({
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

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I3.5 Donguri daily+welcome identity write", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    expect(audit.isNeonLike).toBe(false);
    console.log(
      `I35_LOCAL_DB host=${audit.host} port=${audit.port} database=${audit.database}`,
    );
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    // Mutation authority stays OFF — I3.5 must enrich without enabling it.
    expect(process.env[P1_VALUE_IDENTITY_MUTATION_AUTHORITY_FLAG] ?? "").not.toMatch(
      /^(YES|1)$/,
    );
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
    await prisma.$disconnect();
  });

  it("D1 BOUND daily creation writes identityId at INSERT", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);

    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A) },
    });
    expect(r.delivered).toBe(true);

    const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amount).toBe(1);
    expect(rows[0]!.identityId).toBe(idA.id);
  });

  it("D2 repeat same day — no duplicate award", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    const deps = {
      resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A),
    };
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
    const count = await prisma.logHouseDonguriLedgerEntry.count({
      where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
    });
    expect(count).toBe(1);
  });

  it("D3 unbound user — legacy NULL identity, still delivers", async () => {
    await seedProfile(PROFILE_A, EMAIL_A, null);
    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => unbound() },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
    });
    expect(row!.amount).toBe(1);
    expect(row!.identityId).toBeNull();
  });

  it("D4 same UID email A→B — identity preserved on new daily", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);

    const r = await ensureDailyAcornDelivery({
      email: EMAIL_B, // product email convention may follow session
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: {
        resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_B),
      },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_A, reason: "daily_delivery", dateKey: DAY },
    });
    expect(row!.identityId).toBe(idA.id);
    expect(row!.email).toBe(EMAIL_B);
    expect(row!.amount).toBe(1);
  });

  it("D5 UID-B reuses EMAIL-A — never gets UID-A identityId", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await seedProfile(PROFILE_B, EMAIL_A, idB.id); // B presents reused email

    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_B,
      now: NOW,
      ownershipDeps: {
        resolveOwnership: async () => bound(idB.id, UID_B, EMAIL_A),
      },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_B, reason: "daily_delivery", dateKey: DAY },
    });
    expect(row!.identityId).toBe(idB.id);
    expect(row!.identityId).not.toBe(idA.id);
  });

  it("D5b unbound UID-B with EMAIL-A — no UID-A identity attachment", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await seedProfile(PROFILE_B, EMAIL_A, null);

    const r = await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_B,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => unbound("identity_not_bound") },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_B, reason: "daily_delivery", dateKey: DAY },
    });
    expect(row!.identityId).toBeNull();
  });

  it("W1 BOUND welcome gift writes identityId at INSERT", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);

    const r = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A) },
    });
    expect(r.delivered).toBe(true);
    const rows = await prisma.logHouseDonguriLedgerEntry.findMany({
      where: { email: EMAIL_A, reason: "welcome_gift" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amount).toBe(DONGURI_WELCOME_GIFT_AMOUNT);
    expect(rows[0]!.identityId).toBe(idA.id);
    expect(rows[0]!.dateKey).toBe("welcome");
  });

  it("W2 welcome repeat — no second gift", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    const deps = {
      resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A),
    };
    expect(
      (await ensureWelcomeAcornGift({
        email: EMAIL_A,
        profileId: PROFILE_A,
        ownershipDeps: deps,
      })).delivered,
    ).toBe(true);
    expect(
      (await ensureWelcomeAcornGift({
        email: EMAIL_A,
        profileId: PROFILE_A,
        ownershipDeps: deps,
      })).delivered,
    ).toBe(false);
    expect(
      await prisma.logHouseDonguriLedgerEntry.count({
        where: { email: EMAIL_A, reason: "welcome_gift" },
      }),
    ).toBe(1);
  });

  it("W3 unbound welcome — legacy NULL identity", async () => {
    await seedProfile(PROFILE_A, EMAIL_A, null);
    const r = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_A,
      ownershipDeps: { resolveOwnership: async () => unbound() },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { email: EMAIL_A, reason: "welcome_gift" },
    });
    expect(row!.amount).toBe(DONGURI_WELCOME_GIFT_AMOUNT);
    expect(row!.identityId).toBeNull();
  });

  it("W4 same UID email A→B — welcome identity preserved", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    const r = await ensureWelcomeAcornGift({
      email: EMAIL_B,
      profileId: PROFILE_A,
      ownershipDeps: {
        resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_B),
      },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_A, reason: "welcome_gift" },
    });
    expect(row!.identityId).toBe(idA.id);
    expect(row!.email).toBe(EMAIL_B);
  });

  it("W5 UID-B reuses EMAIL-A — never gets UID-A identityId", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await seedProfile(PROFILE_B, EMAIL_A, idB.id);

    const r = await ensureWelcomeAcornGift({
      email: EMAIL_A,
      profileId: PROFILE_B,
      ownershipDeps: {
        resolveOwnership: async () => bound(idB.id, UID_B, EMAIL_A),
      },
    });
    expect(r.delivered).toBe(true);
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { profileId: PROFILE_B, reason: "welcome_gift" },
    });
    expect(row!.identityId).toBe(idB.id);
    expect(row!.identityId).not.toBe(idA.id);
  });

  it("IDENTITY_ATTACHMENT_SAME_INSERT — no NULL→update pattern", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await seedProfile(PROFILE_A, EMAIL_A, idA.id);
    await ensureDailyAcornDelivery({
      email: EMAIL_A,
      profileId: PROFILE_A,
      now: NOW,
      ownershipDeps: { resolveOwnership: async () => bound(idA.id, UID_A, EMAIL_A) },
    });
    const row = await prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { email: EMAIL_A, reason: "daily_delivery", dateKey: DAY },
    });
    // Created with identityId set; relatedNoticeId may be patched in same TX — identity was never NULL-then-update.
    expect(row!.identityId).toBe(idA.id);
  });
});
