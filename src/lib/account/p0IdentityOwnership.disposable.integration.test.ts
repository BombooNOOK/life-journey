/**
 * AI-X6.7B2.5 — Disposable Postgres P0 ownership migration/backfill integration.
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon / Production.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 \
 *   DATABASE_URL='postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public' \
 *     npx vitest run src/lib/account/p0IdentityOwnership.disposable.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  applyP0IdentityOwnershipBackfill,
  dryRunP0IdentityOwnershipBackfill,
} from "@/lib/account/p0IdentityOwnershipBackfillApply";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b25i";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_C = `${PREFIX}-c@ljd.invalid`;
const EMAIL_C2 = `${PREFIX}-c2@ljd.invalid`;
const EMAIL_D = `${PREFIX}-d@ljd.invalid`;
const EMAIL_E = `${PREFIX}-e@ljd.invalid`;

async function wipe() {
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

describe.skipIf(!runLocal)("AI-X6.7B2.5 disposable P0 ownership (real Postgres)", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toMatch(/^(127\.0\.0\.1|localhost)$/);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    expect(audit.isNeonLike).toBe(false);
  });

  beforeEach(async () => {
    await wipe();
  });

  afterAll(async () => {
    await wipe();
  });

  it("catalog: Profile/JournalEntry identityId nullable FK RESTRICT; Profile.identityId not unique", async () => {
    const cols = await prisma.$queryRawUnsafe<
      Array<{ table_name: string; is_nullable: string }>
    >(`
      SELECT table_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND column_name='identityId'
        AND table_name IN ('Profile','JournalEntry','AccountSettings')
      ORDER BY table_name
    `);
    expect(cols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table_name: "Profile", is_nullable: "YES" }),
        expect.objectContaining({ table_name: "JournalEntry", is_nullable: "YES" }),
        expect.objectContaining({ table_name: "AccountSettings", is_nullable: "YES" }),
      ]),
    );

    const fks = await prisma.$queryRawUnsafe<
      Array<{ table_name: string; delete_rule: string; foreign_table_name: string }>
    >(`
      SELECT tc.table_name, rc.delete_rule, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
        AND kcu.column_name='identityId'
        AND tc.table_name IN ('Profile','JournalEntry','AccountSettings')
    `);
    for (const fk of fks) {
      expect(fk.foreign_table_name).toBe("AccountIdentity");
      expect(["RESTRICT", "NO ACTION"]).toContain(fk.delete_rule);
    }

    const uniques = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname='public' AND tablename='Profile'
        AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%identityId%'
    `);
    expect(uniques.length).toBe(0);

    const settingsUnique = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname='public' AND tablename='AccountSettings'
        AND indexname = 'AccountSettings_identityId_key'
    `);
    expect(settingsUnique.length).toBe(1);
  });

  it("A/C/C2/D/E dry-run + apply + UID-B isolation + RESTRICT + idempotent", async () => {
    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a` },
    });
    const idB = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-b` },
    });
    const idC2a = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-c2a` },
    });
    const idC2b = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-c2b` },
    });
    const idEset = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-e-set` },
    });
    const idEclaim = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-e-claim` },
    });

    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: idA.id, profileLimit: 2 },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idA.id, emailNormalized: EMAIL_A, status: "primary" },
    });
    await prisma.accountIdentityLegacyActorClaim.create({
      data: { identityId: idA.id, actorKey: EMAIL_A },
    });
    await prisma.accountIdentityLegacyActorClaim.create({
      data: { identityId: idA.id, actorKey: EMAIL_C },
    });
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_C,
        status: "retired",
        retiredAt: new Date(),
      },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idB.id, emailNormalized: EMAIL_C, status: "primary" },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idC2a.id, emailNormalized: EMAIL_C2, status: "primary" },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idC2b.id, emailNormalized: EMAIL_C2, status: "primary" },
    });
    await prisma.accountSettings.create({
      data: { email: EMAIL_E, identityId: idEset.id, profileLimit: 1 },
    });
    await prisma.accountIdentityLegacyActorClaim.create({
      data: { identityId: idEclaim.id, actorKey: EMAIL_E },
    });
    await prisma.accountSettings.create({
      data: {
        email: `${PREFIX}-b-current@ljd.invalid`,
        identityId: idB.id,
        profileLimit: 1,
      },
    });

    const pA = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "A", identityId: null },
    });
    const pC = await prisma.profile.create({
      data: { email: EMAIL_C, nickname: "C", identityId: null },
    });
    const pC2 = await prisma.profile.create({
      data: { email: EMAIL_C2, nickname: "C2", identityId: null },
    });
    const pD = await prisma.profile.create({
      data: { email: EMAIL_D, nickname: "D", identityId: null },
    });
    const pE = await prisma.profile.create({
      data: { email: EMAIL_E, nickname: "E", identityId: null },
    });
    await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pA.id,
        content: "a",
        identityId: null,
      },
    });
    await prisma.journalEntry.create({
      data: {
        email: EMAIL_C,
        profileId: pC.id,
        content: "c",
        identityId: null,
      },
    });

    const aliasMap = new Map([
      [`Profile:${pA.id}`, "A"],
      [`Profile:${pC.id}`, "C"],
      [`Profile:${pC2.id}`, "C2"],
      [`Profile:${pD.id}`, "D"],
      [`Profile:${pE.id}`, "E"],
    ]);
    const dry = await dryRunP0IdentityOwnershipBackfill(prisma, aliasMap);
    const by = Object.fromEntries(dry.map((d) => [d.rowAlias, d]));

    expect(by.A).toMatchObject({
      result: "BOUND",
      targetIdentityId: idA.id,
      evidenceSource: "BOUND_ACCOUNT_SETTINGS",
    });
    expect(by.C).toMatchObject({
      result: "BOUND",
      targetIdentityId: idA.id,
      evidenceSource: "EXPLICIT_LEGACY_CLAIM",
    });
    // UID-B primary of EMAIL_C must not win
    expect(by.C.targetIdentityId).not.toBe(idB.id);
    expect(by.C2.result).toBe("AMBIGUOUS");
    expect(by.C2.targetIdentityId).toBeNull();
    expect(by.D.result).toBe("UNBOUND");
    expect(by.E.result).toBe("AMBIGUOUS");

    const apply1 = await applyP0IdentityOwnershipBackfill(prisma);
    expect(apply1.profileUpdates).toBeGreaterThanOrEqual(2);
    const apply2 = await applyP0IdentityOwnershipBackfill(prisma);
    expect(apply2.profileUpdates).toBe(0);
    expect(apply2.journalUpdates).toBe(0);

    const bProfiles = await prisma.profile.count({
      where: { identityId: idB.id, email: { startsWith: `${PREFIX}-` } },
    });
    const bJournals = await prisma.journalEntry.count({
      where: { identityId: idB.id, email: { startsWith: `${PREFIX}-` } },
    });
    expect(bProfiles).toBe(0);
    expect(bJournals).toBe(0);

    await expect(
      prisma.accountIdentity.delete({ where: { id: idA.id } }),
    ).rejects.toThrow();
  });
});
