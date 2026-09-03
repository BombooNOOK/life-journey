/**
 * AI-X6.7B3 — Disposable Postgres plumbing validation.
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 \
 *   DATABASE_URL='postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public' \
 *     npx vitest run src/lib/account/p0IdentityOwnership.b3.disposable.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { decideP0JournalDualWrite, decideP0ProfileDualWrite } from "@/lib/account/p0IdentityDualWrite";
import { runP0IdentityOwnershipBackfill } from "@/lib/account/p0IdentityOwnershipBackfillRunner";
import { buildP0ReadShadowRows } from "@/lib/account/p0IdentityOwnershipReadShadow";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b3";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const EMAIL_C2 = `${PREFIX}-c2@ljd.invalid`;
const EMAIL_D = `${PREFIX}-d@ljd.invalid`;

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
  await prisma.journalSaveOperation.deleteMany({
    where: {
      OR: [
        { actorKey: { startsWith: `firebase:${PREFIX}-` } },
        { actorKey: { startsWith: `${PREFIX}-` } },
      ],
    },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { startsWith: `${PREFIX}-` } },
  });
}

describe.skipIf(!runLocal)("AI-X6.7B3 disposable P0 plumbing", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
  });

  beforeEach(async () => {
    await wipe();
  });

  afterAll(async () => {
    await wipe();
  });

  it("backfill DRY_RUN → APPLY → idempotent second APPLY; UID-B isolation; dual-write; shadow", async () => {
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

    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: idA.id, profileLimit: 2 },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idA.id, emailNormalized: EMAIL_A, status: "primary" },
    });
    await prisma.accountIdentityLegacyActorClaim.create({
      data: { identityId: idA.id, actorKey: EMAIL_A },
    });
    // UID-A later uses EMAIL-B as contact; claim keeps EMAIL_A history
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_B,
        status: "retired",
        retiredAt: new Date(),
      },
    });

    // UID-B has its own settings/primary — must not inherit UID-A rows via EMAIL-A string
    await prisma.accountSettings.create({
      data: {
        email: `${PREFIX}-b-current@ljd.invalid`,
        identityId: idB.id,
        profileLimit: 1,
      },
    });
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idB.id,
        emailNormalized: `${PREFIX}-b-current@ljd.invalid`,
        status: "primary",
      },
    });

    // C2 dual primary ambiguity
    await prisma.accountIdentityEmail.create({
      data: { identityId: idC2a.id, emailNormalized: EMAIL_C2, status: "primary" },
    });
    await prisma.accountIdentityEmail.create({
      data: { identityId: idC2b.id, emailNormalized: EMAIL_C2, status: "primary" },
    });

    const pA = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "A", identityId: null },
    });
    const pC2 = await prisma.profile.create({
      data: { email: EMAIL_C2, nickname: "C2", identityId: null },
    });
    const pD = await prisma.profile.create({
      data: { email: EMAIL_D, nickname: "D", identityId: null },
    });
    const jA = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pA.id,
        content: "hist-a",
        identityId: null,
      },
    });
    await prisma.journalEntry.create({
      data: {
        email: EMAIL_C2,
        profileId: pC2.id,
        content: "ambig",
        identityId: null,
      },
    });
    await prisma.journalEntry.create({
      data: {
        email: EMAIL_D,
        profileId: pD.id,
        content: "unbound",
        identityId: null,
      },
    });

    // Stable JSO for UID-A — must remain untouched by P0 plumbing
    const jso = await prisma.journalSaveOperation.create({
      data: {
        actorKey: buildFirebaseActorKey(`${PREFIX}-uid-a`),
        saveOperationId: `${PREFIX}-sop-1`,
        status: "completed",
        checkpoint: "completed",
        journalEntryId: jA.id,
        requestFingerprint: `${PREFIX}-fp`,
        completedAt: new Date(),
      },
    });

    const emails = new Set([EMAIL_A, EMAIL_C2, EMAIL_D]);
    const dry = await runP0IdentityOwnershipBackfill(prisma, {
      mode: "DRY_RUN",
      emailFilter: emails,
    });
    const byAlias = Object.fromEntries(
      dry.decisions.map((d) => [`${d.table}:${d.rowId}`, d]),
    );
    expect(byAlias[`Profile:${pA.id}`]?.result).toBe("BOUND");
    expect(byAlias[`Profile:${pA.id}`]?.proposedIdentityId).toBe(idA.id);
    expect(byAlias[`Profile:${pC2.id}`]?.result).toBe("AMBIGUOUS");
    expect(byAlias[`Profile:${pD.id}`]?.result).toBe("UNBOUND");

    const apply1 = await runP0IdentityOwnershipBackfill(prisma, {
      mode: "APPLY",
      emailFilter: emails,
    });
    expect(apply1.profileUpdates).toBe(1);
    expect(apply1.journalUpdates).toBe(1);

    const pAafter = await prisma.profile.findUnique({ where: { id: pA.id } });
    const jAafter = await prisma.journalEntry.findUnique({ where: { id: jA.id } });
    expect(pAafter?.identityId).toBe(idA.id);
    expect(jAafter?.identityId).toBe(idA.id);

    const pC2after = await prisma.profile.findUnique({ where: { id: pC2.id } });
    const pDafter = await prisma.profile.findUnique({ where: { id: pD.id } });
    expect(pC2after?.identityId).toBeNull();
    expect(pDafter?.identityId).toBeNull();

    const apply2 = await runP0IdentityOwnershipBackfill(prisma, {
      mode: "APPLY",
      emailFilter: emails,
    });
    expect(apply2.profileUpdates).toBe(0);
    expect(apply2.journalUpdates).toBe(0);
    expect(
      apply2.decisions.find((d) => d.rowId === pA.id)?.result,
    ).toBe("ALREADY_BOUND");

    // UID-B identity query sees zero UID-A rows
    const bProfiles = await prisma.profile.count({
      where: { identityId: idB.id, email: { startsWith: `${PREFIX}-` } },
    });
    const bJournals = await prisma.journalEntry.count({
      where: { identityId: idB.id, email: { startsWith: `${PREFIX}-` } },
    });
    expect(bProfiles).toBe(0);
    expect(bJournals).toBe(0);

    // Changed-email shadow: OLD (EMAIL-B) empty, NEW (idA) has history
    const oldByEmailB = await prisma.journalEntry.findMany({
      where: { email: EMAIL_B },
      select: { id: true },
    });
    const newByIdA = await prisma.journalEntry.findMany({
      where: { identityId: idA.id, email: { startsWith: `${PREFIX}-` } },
      select: { id: true },
    });
    expect(oldByEmailB.length).toBe(0);
    expect(newByIdA.length).toBe(1);
    const shadow = buildP0ReadShadowRows({
      oldIds: oldByEmailB.map((r) => r.id),
      newIds: newByIdA.map((r) => r.id),
    });
    expect(shadow.every((r) => r.category === "IDENTITY_ONLY")).toBe(true);

    // Dual-write: bound UID-A writes identityId=ID_A
    const dwA = decideP0ProfileDualWrite({
      ownership: {
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: `${PREFIX}-uid-a`,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [EMAIL_A],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      },
      dualWriteEnabled: true,
    });
    expect(dwA).toMatchObject({ action: "write_identity", identityId: idA.id });

    const newProfile = await prisma.profile.create({
      data: {
        email: EMAIL_B,
        nickname: "A-new",
        identityId: dwA.action === "write_identity" ? dwA.identityId : null,
      },
    });
    expect(newProfile.identityId).toBe(idA.id);

    const jDw = decideP0JournalDualWrite({
      ownership: {
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: `${PREFIX}-uid-a`,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [EMAIL_A],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      },
      profileIdentityId: newProfile.identityId,
      dualWriteEnabled: true,
    });
    expect(jDw.action).toBe("write_identity");
    const newJournal = await prisma.journalEntry.create({
      data: {
        email: EMAIL_B,
        profileId: newProfile.id,
        content: "dual-write",
        identityId: jDw.action === "write_identity" ? jDw.identityId : null,
      },
    });
    expect(newJournal.identityId).toBe(idA.id);

    // UID-B dual-write must not get ID_A via email reuse
    const dwB = decideP0JournalDualWrite({
      ownership: {
        state: "BOUND",
        identityId: idB.id,
        firebaseUid: `${PREFIX}-uid-b`,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "ok",
      },
      profileIdentityId: null,
      dualWriteEnabled: true,
    });
    expect(dwB.action).toBe("write_identity");
    if (dwB.action === "write_identity") {
      expect(dwB.identityId).toBe(idB.id);
      expect(dwB.identityId).not.toBe(idA.id);
    }

    // No extra legacy claim created by dual-write
    const claims = await prisma.accountIdentityLegacyActorClaim.count({
      where: { identityId: idA.id },
    });
    expect(claims).toBe(1);

    // JSO preserved
    const jsoAfter = await prisma.journalSaveOperation.findUnique({
      where: { id: jso.id },
    });
    expect(jsoAfter?.actorKey).toBe(buildFirebaseActorKey(`${PREFIX}-uid-a`));

    // FK RESTRICT
    await expect(
      prisma.accountIdentity.delete({ where: { id: idA.id } }),
    ).rejects.toThrow();
  });
});
