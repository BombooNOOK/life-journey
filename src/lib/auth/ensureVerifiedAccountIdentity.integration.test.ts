/**
 * AI-8.3a local disposable DB integration: verified AccountIdentity binding.
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/auth/ensureVerifiedAccountIdentity.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ACCOUNT_IDENTITY_EMAIL_STATUS } from "@/lib/auth/accountIdentityEmailStatus";
import { ensureVerifiedAccountIdentity } from "@/lib/auth/ensureVerifiedAccountIdentity";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const UID_A = "ai83a-uid-a";
const UID_B = "ai83a-uid-b";
const UID_INCOMPLETE = "ai83a-uid-incomplete";
const EMAIL_A = "ai83a-a@ljd.invalid";
const EMAIL_B = "ai83a-b@ljd.invalid";
const EMAIL_SHARED = "ai83a-shared@ljd.invalid";

const SYNTHETIC_UIDS = [UID_A, UID_B, UID_INCOMPLETE, "ai83a-uid-race-1", "ai83a-uid-race-2"];

async function wipeSynthetic() {
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { in: SYNTHETIC_UIDS } },
  });
}

async function countClaimsForUids() {
  const identities = await prisma.accountIdentity.findMany({
    where: { firebaseUid: { in: SYNTHETIC_UIDS } },
    select: { id: true },
  });
  if (identities.length === 0) return 0;
  return prisma.accountIdentityLegacyActorClaim.count({
    where: { identityId: { in: identities.map((i) => i.id) } },
  });
}

describe.skipIf(!runLocal)("AI-8.3a ensureVerifiedAccountIdentity integration", () => {
  let journalEntryBefore = 0;
  let accountSettingsBefore = 0;
  let jsoBefore = 0;

  beforeAll(async () => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toMatch(/^(127\.0\.0\.1|localhost)$/);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    journalEntryBefore = await prisma.journalEntry.count();
    accountSettingsBefore = await prisma.accountSettings.count();
    jsoBefore = await prisma.journalSaveOperation.count();
  });

  beforeEach(async () => {
    await wipeSynthetic();
  });

  afterAll(async () => {
    await wipeSynthetic();
    expect(await prisma.journalEntry.count()).toBe(journalEntryBefore);
    expect(await prisma.accountSettings.count()).toBe(accountSettingsBefore);
    expect(await prisma.journalSaveOperation.count()).toBe(jsoBefore);
    await prisma.$disconnect();
  });

  it("A: first bind creates identity + primary email, zero claims", async () => {
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_A }),
    });
    expect(result.state).toBe("created");
    expect(result.identityId).toBeTruthy();

    const identity = await prisma.accountIdentity.findUnique({
      where: { firebaseUid: UID_A },
      include: { emails: true, legacyActorClaims: true },
    });
    expect(identity).not.toBeNull();
    expect(identity!.emails).toHaveLength(1);
    expect(identity!.emails[0]!.emailNormalized).toBe(EMAIL_A);
    expect(identity!.emails[0]!.status).toBe(ACCOUNT_IDENTITY_EMAIL_STATUS.primary);
    expect(identity!.legacyActorClaims).toHaveLength(0);
    expect(await countClaimsForUids()).toBe(0);
  });

  it("B: repeated same UID/email is match / no duplicate", async () => {
    await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_A }),
    });
    const second = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_A }),
    });
    expect(second.state).toBe("match");
    expect(await prisma.accountIdentity.count({ where: { firebaseUid: UID_A } })).toBe(1);
    expect(
      await prisma.accountIdentityEmail.count({
        where: {
          identity: { firebaseUid: UID_A },
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
        },
      }),
    ).toBe(1);
    expect(await countClaimsForUids()).toBe(0);
  });

  it("C: same UID different email → mismatch; primary preserved; no claim", async () => {
    await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_A }),
    });
    const mismatch = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_B }),
    });
    expect(mismatch.state).toBe("email_mismatch");

    const emails = await prisma.accountIdentityEmail.findMany({
      where: { identity: { firebaseUid: UID_A } },
      orderBy: { boundAt: "asc" },
    });
    expect(emails).toHaveLength(1);
    expect(emails[0]!.emailNormalized).toBe(EMAIL_A);
    expect(emails[0]!.status).toBe(ACCOUNT_IDENTITY_EMAIL_STATUS.primary);
    expect(await countClaimsForUids()).toBe(0);
  });

  it("D: schema allows same emailNormalized on different identities (retired + primary)", async () => {
    const identityA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: {
          create: {
            emailNormalized: EMAIL_SHARED,
            status: ACCOUNT_IDENTITY_EMAIL_STATUS.retired,
            retiredAt: new Date(),
          },
        },
      },
    });
    const identityB = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_B,
        emails: {
          create: {
            emailNormalized: EMAIL_SHARED,
            status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
          },
        },
      },
    });
    expect(identityA.id).not.toBe(identityB.id);
    const rows = await prisma.accountIdentityEmail.findMany({
      where: { emailNormalized: EMAIL_SHARED },
    });
    expect(rows).toHaveLength(2);
    // Binding helper for UID-B should match without claiming.
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_B, email: EMAIL_SHARED }),
    });
    expect(result.state).toBe("match");
    expect(await countClaimsForUids()).toBe(0);
  });

  it("E: concurrent same-UID first bind → one identity + one primary", async () => {
    const raceUid = "ai83a-uid-race-1";
    const results = await Promise.all([
      ensureVerifiedAccountIdentity({
        isVerifiedAuthEnabled: () => true,
        isBindingEnabled: () => true,
        getSession: async () => ({ uid: raceUid, email: EMAIL_A }),
      }),
      ensureVerifiedAccountIdentity({
        isVerifiedAuthEnabled: () => true,
        isBindingEnabled: () => true,
        getSession: async () => ({ uid: raceUid, email: EMAIL_A }),
      }),
      ensureVerifiedAccountIdentity({
        isVerifiedAuthEnabled: () => true,
        isBindingEnabled: () => true,
        getSession: async () => ({ uid: raceUid, email: EMAIL_A }),
      }),
    ]);
    const states = results.map((r) => r.state).sort();
    expect(states.every((s) => s === "created" || s === "match")).toBe(true);
    expect(states.includes("created") || states.every((s) => s === "match")).toBe(true);
    expect(await prisma.accountIdentity.count({ where: { firebaseUid: raceUid } })).toBe(1);
    expect(
      await prisma.accountIdentityEmail.count({
        where: {
          identity: { firebaseUid: raceUid },
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
        },
      }),
    ).toBe(1);
    expect(await countClaimsForUids()).toBe(0);
  });

  it("F: no LegacyActorClaim created by any binding path in this suite", async () => {
    expect(await prisma.accountIdentityLegacyActorClaim.count()).toBe(0);
  });

  it("G: incomplete identity without primary → no auto-repair", async () => {
    await prisma.accountIdentity.create({
      data: { firebaseUid: UID_INCOMPLETE },
    });
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: UID_INCOMPLETE, email: EMAIL_A }),
    });
    expect(result.state).toBe("incomplete_identity");
    expect(
      await prisma.accountIdentityEmail.count({
        where: { identity: { firebaseUid: UID_INCOMPLETE } },
      }),
    ).toBe(0);
    expect(await countClaimsForUids()).toBe(0);
  });
});
