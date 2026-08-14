/**
 * Release Gate: account delete × JournalSaveOperation (local disposable only).
 * Never Production. Validates feature-OFF ownership and transaction rollback.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ACCOUNT_DELETE_CONFIRMATION_WORD } from "@/lib/account/accountDeleteTypes";
import { deleteUserAccount } from "@/lib/account/deleteUserAccount";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { JOURNAL_SAVE_IDEMPOTENCY_FLAG } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal =
  process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const ACTOR = "4b4ac-del@ljd.invalid";
const OTHER = "4b4ac-other@ljd.invalid";

async function wipe(email: string) {
  await prisma.journalSaveOperation.deleteMany({ where: { actorKey: email } });
  await prisma.journalSaveIdempotencyRollout.deleteMany({ where: { actorKey: email } });
  await prisma.profile.deleteMany({ where: { email } });
  await prisma.accountSettings.deleteMany({ where: { email } });
}

async function seedAccount(email: string) {
  await prisma.accountSettings.create({ data: { email } });
  await prisma.profile.create({ data: { email, nickname: "release-gate" } });
}

async function seedJso(actorKey: string, saveOperationId: string) {
  await prisma.journalSaveOperation.create({
    data: {
      actorKey,
      saveOperationId,
      status: "completed",
      checkpoint: "completed",
      requestFingerprint: "4b4ac-test",
    },
  });
}

async function seedRollout(actorKey: string) {
  await prisma.journalSaveIdempotencyRollout.create({
    data: { actorKey, enabled: true, protocolVersion: 1 },
  });
}

describe.skipIf(!runLocal)("4B-4AC account-delete JSO Gate", () => {
  beforeAll(async () => {
    expect(audit.ok).toBe(true);
    delete process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG];
  });

  beforeEach(async () => {
    delete process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG];
    await wipe(ACTOR);
    await wipe(OTHER);
  });

  afterAll(async () => {
    await wipe(ACTOR);
    await wipe(OTHER);
    await prisma.$disconnect();
  });

  it("JSO=0: account delete succeeds", async () => {
    await seedAccount(ACTOR);
    await deleteUserAccount({
      emailInput: ACTOR,
      confirmationWord: ACCOUNT_DELETE_CONFIRMATION_WORD,
    });
    expect(await prisma.accountSettings.count({ where: { email: ACTOR } })).toBe(0);
  });

  it("feature OFF: deletes only normalized actor JSO", async () => {
    await seedAccount(ACTOR);
    await seedAccount(OTHER);
    await seedJso(ACTOR, "01LJD4B4ACDELETEACTOR00001");
    await seedJso(OTHER, "01LJD4B4ACDELETEOTHER00001");

    await deleteUserAccount({
      emailInput: "4B4AC-DEL@LJD.INVALID",
      confirmationWord: ACCOUNT_DELETE_CONFIRMATION_WORD,
    });

    expect(
      await prisma.journalSaveOperation.count({ where: { actorKey: ACTOR } }),
    ).toBe(0);
    expect(
      await prisma.journalSaveOperation.count({ where: { actorKey: OTHER } }),
    ).toBe(1);
  });

  it("deletes only the actor's rollout row in the same account-delete transaction", async () => {
    await seedAccount(ACTOR);
    await seedAccount(OTHER);
    await seedRollout(ACTOR);
    await seedRollout(OTHER);
    await seedJso(ACTOR, "01LJD4B4ACROLLOUTACTOR00001");
    await seedJso(OTHER, "01LJD4B4ACROLLOUTOTHER00001");

    await deleteUserAccount({
      emailInput: "4B4AC-DEL@LJD.INVALID",
      confirmationWord: ACCOUNT_DELETE_CONFIRMATION_WORD,
    });

    expect(
      await prisma.journalSaveIdempotencyRollout.count({ where: { actorKey: ACTOR } }),
    ).toBe(0);
    expect(
      await prisma.journalSaveIdempotencyRollout.count({ where: { actorKey: OTHER } }),
    ).toBe(1);
    expect(
      await prisma.journalSaveOperation.count({ where: { actorKey: ACTOR } }),
    ).toBe(0);
    expect(
      await prisma.journalSaveOperation.count({ where: { actorKey: OTHER } }),
    ).toBe(1);
  });

  it("JSO cleanup failure rolls back the account-delete transaction", async () => {
    await seedAccount(ACTOR);
    await seedJso(ACTOR, "01LJD4B4ACROLLBACKACTOR0001");
    await seedRollout(ACTOR);
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION ljd_4b4ac_block_jso_delete()
      RETURNS trigger AS $$
      BEGIN
        IF OLD."actorKey" = '${ACTOR}' THEN
          RAISE EXCEPTION '4B4AC injected JSO delete failure';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER ljd_4b4ac_block_jso_delete_trigger
      BEFORE DELETE ON "JournalSaveOperation"
      FOR EACH ROW EXECUTE FUNCTION ljd_4b4ac_block_jso_delete();
    `);

    try {
      await expect(
        deleteUserAccount({
          emailInput: ACTOR,
          confirmationWord: ACCOUNT_DELETE_CONFIRMATION_WORD,
        }),
      ).rejects.toMatchObject({ code: "DB_DELETE_FAILED" });
      expect(
        await prisma.accountSettings.count({ where: { email: ACTOR } }),
      ).toBe(1);
      expect(await prisma.profile.count({ where: { email: ACTOR } })).toBe(1);
      expect(
        await prisma.journalSaveOperation.count({ where: { actorKey: ACTOR } }),
      ).toBe(1);
      expect(
        await prisma.journalSaveIdempotencyRollout.count({ where: { actorKey: ACTOR } }),
      ).toBe(1);
    } finally {
      await prisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS ljd_4b4ac_block_jso_delete_trigger ON "JournalSaveOperation"`,
      );
      await prisma.$executeRawUnsafe(
        `DROP FUNCTION IF EXISTS ljd_4b4ac_block_jso_delete()`,
      );
    }
  });
});
