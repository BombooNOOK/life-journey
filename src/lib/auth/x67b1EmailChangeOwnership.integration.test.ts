/**
 * AI-X6.7B1 — Local email-change failure reproduction (Gate X6 criteria 4 / 5).
 *
 * Disposable Postgres ONLY: 127.0.0.1:5433/ljd_dev.
 * Never Neon / Production.
 *
 * Purpose: document CURRENT implementation failure for email-keyed product
 * history. Does NOT remediate. Does NOT claim Gate X6 PASS.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/auth/x67b1EmailChangeOwnership.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { resolveVerifiedViewerActorIdentity } from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { resolveJournalSaveRecoveryAuthority } from "@/lib/journal/saveIdempotency/resolveJournalSaveRecoveryAuthority";
import { resolveJournalSaveWriteActorKey } from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const UID_A = "x67b1-uid-a";
const UID_B = "x67b1-uid-b";
const EMAIL_A = "x67b1-a@ljd.invalid";
const EMAIL_B = "x67b1-b@ljd.invalid";
const PROFILE_A = "x67b1-profile-a";

/**
 * Mirrors current product journal listing authority:
 * cookie/viewer email → Prisma where: { email }.
 * (See src/app/api/journal/route.ts)
 */
async function listJournalByCookieEmail(cookieEmail: string) {
  return prisma.journalEntry.findMany({
    where: { email: cookieEmail },
    select: { id: true, email: true, profileId: true },
    orderBy: { updatedAt: "asc" },
  });
}

async function findSettingsByCookieEmail(cookieEmail: string) {
  return prisma.accountSettings.findUnique({
    where: { email: cookieEmail },
    select: { id: true, email: true, identityId: true },
  });
}

async function findProfileByCookieEmail(cookieEmail: string) {
  return prisma.profile.findFirst({
    where: { email: cookieEmail },
    select: { id: true, email: true },
  });
}

async function donguriCountByEmail(email: string) {
  return prisma.logHouseDonguriLedgerEntry.count({ where: { email } });
}

async function wipeSynthetic() {
  await prisma.journalSaveOperation.deleteMany({
    where: {
      OR: [
        { actorKey: EMAIL_A },
        { actorKey: EMAIL_B },
        { actorKey: buildFirebaseActorKey(UID_A) },
        { actorKey: buildFirebaseActorKey(UID_B) },
      ],
    },
  });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
  });
  await prisma.journalEntry.deleteMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
  });
  await prisma.profile.deleteMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
  });
  await prisma.accountSettings.deleteMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { in: [UID_A, UID_B] } },
  });
}

describe.skipIf(!runLocal)("AI-X6.7B1 local email-change ownership reproduction", () => {
  let journalBefore = 0;
  let identityBefore = 0;

  beforeAll(async () => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toMatch(/^(127\.0\.0\.1|localhost)$/);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    journalBefore = await prisma.journalEntry.count();
    identityBefore = await prisma.accountIdentity.count();
  });

  beforeEach(async () => {
    await wipeSynthetic();
  });

  afterAll(async () => {
    await wipeSynthetic();
    // Shared disposable DB: only assert this suite's synthetic rows are gone
    // (global counts are not stable across sibling B2/B3/B4 suites).
    expect(
      await prisma.journalEntry.count({
        where: { email: { in: [EMAIL_A, EMAIL_B] } },
      }),
    ).toBe(0);
    expect(
      await prisma.accountIdentity.count({
        where: { firebaseUid: { in: [UID_A, UID_B] } },
      }),
    ).toBe(0);
    void journalBefore;
    void identityBefore;
    await prisma.$disconnect();
  });

  async function seedUidAWithEmailAHistory() {
    const identity = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: {
          create: {
            emailNormalized: EMAIL_A,
            status: "primary",
          },
        },
        legacyActorClaims: {
          create: { actorKey: EMAIL_A },
        },
      },
    });
    const settings = await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: identity.id,
        profileLimit: 1,
      },
    });
    const profile = await prisma.profile.create({
      data: {
        id: PROFILE_A,
        email: EMAIL_A,
        nickname: "X67B1-A",
      },
    });
    const entry = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profile.id,
        content: "[x67b1 synthetic history — not production]",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple",
        contentFontMode: "standard",
      },
    });
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profile.id,
        amount: 1,
        reason: "x67b1_probe",
        title: "x67b1 synthetic probe",
        dateKey: "2026-09-03",
        idempotencyKey: `x67b1:${EMAIL_A}:${profile.id}:seed`,
      },
    });
    const jso = await prisma.journalSaveOperation.create({
      data: {
        actorKey: buildFirebaseActorKey(UID_A),
        saveOperationId: "x67b1-sop-stable-001",
        status: "completed",
        checkpoint: "completed",
        journalEntryId: entry.id,
        requestFingerprint: "x67b1-fp-001",
        completedAt: new Date(),
      },
    });
    return { identity, settings, profile, entry, jso };
  }

  describe("STEP 2 — Criterion 4 current implementation (expect FAIL)", () => {
    it("UID-A + EMAIL-B cookie loses email-keyed JournalEntry/Profile/Settings/donguri visibility", async () => {
      const seeded = await seedUidAWithEmailAHistory();

      // Before change: EMAIL-A cookie sees history.
      expect((await listJournalByCookieEmail(EMAIL_A)).map((e) => e.id)).toEqual([
        seeded.entry.id,
      ]);
      expect((await findSettingsByCookieEmail(EMAIL_A))?.id).toBe(seeded.settings.id);
      expect((await findProfileByCookieEmail(EMAIL_A))?.id).toBe(seeded.profile.id);
      expect(await donguriCountByEmail(EMAIL_A)).toBe(1);

      // Simulate Firebase email metadata change ONLY (same UID). No data remap.
      // Product routes still use cookie email = EMAIL-B.
      const journalVisibleToNewEmail = await listJournalByCookieEmail(EMAIL_B);
      const settingsByNewEmail = await findSettingsByCookieEmail(EMAIL_B);
      const profileByNewEmail = await findProfileByCookieEmail(EMAIL_B);
      const donguriByNewEmail = await donguriCountByEmail(EMAIL_B);

      // Rows still physically exist under EMAIL-A (no deletion).
      expect(await prisma.journalEntry.count({ where: { id: seeded.entry.id } })).toBe(1);
      expect(await prisma.accountSettings.count({ where: { id: seeded.settings.id } })).toBe(1);

      // CURRENT product visibility FAILS after email change.
      expect(journalVisibleToNewEmail).toEqual([]);
      expect(settingsByNewEmail).toBeNull();
      expect(profileByNewEmail).toBeNull();
      expect(donguriByNewEmail).toBe(0);

      // Identity resolution by UID still finds the same identity + claim.
      const resolved = await resolveVerifiedViewerActorIdentity({
        getSession: async () => ({ uid: UID_A, email: EMAIL_B }),
      });
      expect(resolved.state).toBe("resolved");
      if (resolved.state === "resolved") {
        expect(resolved.identityId).toBe(seeded.identity.id);
        expect(resolved.stableActorKey).toBe(buildFirebaseActorKey(UID_A));
        expect(resolved.legacyActorKeys).toContain(EMAIL_A);
        expect(resolved.actorLookupKeys).not.toContain(EMAIL_B);
      }
    });
  });

  describe("STEP 3 — Criterion 5 current implementation (expect FAIL / MIXED)", () => {
    it("UID-B authenticating as reused EMAIL-A sees UID-A JournalEntry/Profile/donguri (TRANSFER)", async () => {
      const seeded = await seedUidAWithEmailAHistory();

      // UID-A moved to EMAIL-B (metadata only). EMAIL-A is free for Auth reuse.
      // UID-B has its own identity with primary EMAIL-A — NO legacy claim grant.
      await prisma.accountIdentity.create({
        data: {
          firebaseUid: UID_B,
          emails: {
            create: { emailNormalized: EMAIL_A, status: "primary" },
          },
        },
      });

      // Product cookie/email authority: UID-B with EMAIL-A cookie.
      const journalSeenByUidB = await listJournalByCookieEmail(EMAIL_A);
      const profileSeenByUidB = await findProfileByCookieEmail(EMAIL_A);
      const settingsSeenByUidB = await findSettingsByCookieEmail(EMAIL_A);
      const donguriSeenByUidB = await donguriCountByEmail(EMAIL_A);

      // CURRENT: email-keyed product data is EXPOSED to UID-B.
      expect(journalSeenByUidB.map((e) => e.id)).toEqual([seeded.entry.id]);
      expect(profileSeenByUidB?.id).toBe(seeded.profile.id);
      expect(donguriSeenByUidB).toBe(1);
      // Settings still under EMAIL-A unique row (UID-A's bound settings).
      expect(settingsSeenByUidB?.id).toBe(seeded.settings.id);
      expect(settingsSeenByUidB?.identityId).toBe(seeded.identity.id);
    });

    it("UID-B does NOT receive UID-A stable JSO authority or explicit legacy claim", async () => {
      await seedUidAWithEmailAHistory();
      await prisma.accountIdentity.create({
        data: {
          firebaseUid: UID_B,
          emails: {
            create: { emailNormalized: EMAIL_A, status: "primary" },
          },
        },
      });

      const uidBIdentity = await resolveVerifiedViewerActorIdentity({
        getSession: async () => ({ uid: UID_B, email: EMAIL_A }),
      });
      expect(uidBIdentity.state).toBe("resolved");
      if (uidBIdentity.state === "resolved") {
        expect(uidBIdentity.stableActorKey).toBe(buildFirebaseActorKey(UID_B));
        expect(uidBIdentity.legacyActorKeys).not.toContain(EMAIL_A);
        expect(uidBIdentity.actorLookupKeys).not.toContain(EMAIL_A);
        expect(uidBIdentity.actorLookupKeys).not.toContain(
          buildFirebaseActorKey(UID_A),
        );
      }

      const writeB = await resolveJournalSaveWriteActorKey(EMAIL_A, {
        isStableWriteEnabled: () => true,
        getSession: async () => ({ uid: UID_B, email: EMAIL_A }),
      });
      expect(writeB.mode).toBe("stable");
      if (writeB.mode === "stable") {
        expect(writeB.actorKey).toBe(buildFirebaseActorKey(UID_B));
      }

      const recoveryB = await resolveJournalSaveRecoveryAuthority(EMAIL_A, {
        isStableRecoveryEnabled: () => true,
        getSession: async () => ({ uid: UID_B, email: EMAIL_A }),
      });
      expect(recoveryB.mode).toBe("stable");
      if (recoveryB.mode === "stable") {
        expect(recoveryB.actorKeys).toEqual([buildFirebaseActorKey(UID_B)]);
        expect(recoveryB.actorKeys).not.toContain(EMAIL_A);
        expect(recoveryB.actorKeys).not.toContain(buildFirebaseActorKey(UID_A));
      }

      // Historical UID-A firebase JSO still exists and is not under UID-B actorKey.
      const uidAJso = await prisma.journalSaveOperation.count({
        where: { actorKey: buildFirebaseActorKey(UID_A) },
      });
      const uidBJso = await prisma.journalSaveOperation.count({
        where: { actorKey: buildFirebaseActorKey(UID_B) },
      });
      expect(uidAJso).toBe(1);
      expect(uidBJso).toBe(0);
    });
  });
});
