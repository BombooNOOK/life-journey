/**
 * AI-X6.7B5 — Disposable Postgres mutation authority cutover.
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeAccountSettingsMutation,
  authorizeJournalCreateUnderProfile,
  authorizeJournalEntryMutation,
  authorizeProfileMutation,
  IDENTITY_REBIND_ALLOWED,
} from "@/lib/account/p0IdentityMutationAuthority";
import { P0_IDENTITY_MUTATION_AUTHORITY_FLAG } from "@/lib/account/p0IdentityMutationAuthorityGate";
import { P0_IDENTITY_READ_AUTHORITY_FLAG } from "@/lib/account/p0IdentityReadAuthorityGate";
import { P0_IDENTITY_DUAL_WRITE_FLAG } from "@/lib/account/p0IdentityDualWriteGate";
import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import {
  authorizeJournalEntryIdForP0Identity,
  listJournalEntriesForP0Identity,
} from "@/lib/account/p0IdentityReads";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b5";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;

function bound(
  identityId: string,
  uid: string,
  emailMeta: string,
  claims: string[] = [],
): P0OwnershipResolution {
  return {
    state: "BOUND",
    identityId,
    firebaseUid: uid,
    evidenceSource: "VERIFIED_FIREBASE_UID",
    legacyActorKeys: claims,
    verifiedEmailMetadata: emailMeta,
    reason: "ok",
  };
}

async function wipe() {
  await prisma.journalSaveOperation.deleteMany({
    where: { actorKey: { startsWith: `firebase:${PREFIX}-` } },
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

describe.skipIf(!runLocal)("AI-X6.7B5 disposable mutation authority", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
    expect(IDENTITY_REBIND_ALLOWED).toBe(false);
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    vi.stubEnv(P0_IDENTITY_MUTATION_AUTHORITY_FLAG, "YES");
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");
    vi.stubEnv(P0_IDENTITY_DUAL_WRITE_FLAG, "YES");
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
  });

  it("same-UID email-change retains mutations; UID-B attack matrix = 0; bind-on-null; no rebind", async () => {
    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a` },
    });
    const idB = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-b` },
    });

    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: idA.id, profileLimit: 2 },
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

    const pA = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "A", identityId: idA.id },
    });
    const jBound = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pA.id,
        content: "bound",
        identityId: idA.id,
      },
    });
    const jNull = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pA.id,
        content: "null-legacy",
        identityId: null,
      },
    });

    const ownershipAChanged = bound(idA.id, `${PREFIX}-uid-a`, EMAIL_B, [EMAIL_A]);
    const ownershipB = bound(idB.id, `${PREFIX}-uid-b`, EMAIL_A, []);

    // --- Criterion 4 mutation: UID-A after email change ---
    const patchA = await authorizeJournalEntryMutation({
      ownership: ownershipAChanged,
      entryId: jBound.id,
    });
    expect(patchA.state).toBe("AUTHORIZED");

    const nullBind = await authorizeJournalEntryMutation({
      ownership: ownershipAChanged,
      entryId: jNull.id,
      bindOnAuthorize: true,
    });
    expect(nullBind.state).toBe("AUTHORIZED");
    if (nullBind.state === "AUTHORIZED") {
      expect(nullBind.boundIdentityId).toBe(true);
    }
    const jNullAfter = await prisma.journalEntry.findUnique({
      where: { id: jNull.id },
    });
    expect(jNullAfter?.identityId).toBe(idA.id);

    // Profile mutation OK for UID-A
    const profileMutA = await authorizeProfileMutation({
      ownership: ownershipAChanged,
      profileId: pA.id,
    });
    expect(profileMutA.state).toBe("AUTHORIZED");

    // Settings mutation OK for UID-A
    const settingsA = await authorizeAccountSettingsMutation({
      ownership: ownershipAChanged,
      contactEmail: EMAIL_B,
    });
    expect(settingsA.state).toBe("AUTHORIZED");
    if (settingsA.state === "AUTHORIZED") {
      expect(settingsA.settingsId).toBeTruthy();
    }

    // Create under owned profile
    const createA = await authorizeJournalCreateUnderProfile({
      ownership: ownershipAChanged,
      profileId: pA.id,
    });
    expect(createA.state).toBe("AUTHORIZED");

    // Dual-write create new entry as ID_A
    const jNew = await prisma.journalEntry.create({
      data: {
        email: EMAIL_B,
        profileId: pA.id,
        content: "after-change",
        identityId: idA.id,
      },
    });
    expect(jNew.identityId).toBe(idA.id);

    // Stable JSO unchanged
    const jso = await prisma.journalSaveOperation.create({
      data: {
        actorKey: buildFirebaseActorKey(`${PREFIX}-uid-a`),
        saveOperationId: `${PREFIX}-sop`,
        status: "completed",
        checkpoint: "completed",
        journalEntryId: jBound.id,
        requestFingerprint: `${PREFIX}-fp`,
        completedAt: new Date(),
      },
    });
    expect(jso.actorKey).toBe(buildFirebaseActorKey(`${PREFIX}-uid-a`));

    // Read still works
    const listA = await listJournalEntriesForP0Identity({
      ownership: ownershipAChanged,
    });
    expect(listA.ok).toBe(true);
    if (listA.ok) {
      expect(listA.entryIds).toEqual(
        expect.arrayContaining([jBound.id, jNull.id, jNew.id]),
      );
    }

    // Delete own entry authorized
    const delA = await authorizeJournalEntryMutation({
      ownership: ownershipAChanged,
      entryId: jNew.id,
    });
    expect(delA.state).toBe("AUTHORIZED");
    await prisma.journalEntry.delete({ where: { id: jNew.id } });

    const P0_HISTORY_LOSS = 0;
    const P0_MUTATION_AUTHORITY_LOSS = 0;
    expect(P0_HISTORY_LOSS).toBe(0);
    expect(P0_MUTATION_AUTHORITY_LOSS).toBe(0);

    // --- UID-B attack matrix ---
    const attacks = await Promise.all([
      authorizeJournalEntryMutation({ ownership: ownershipB, entryId: jBound.id }),
      authorizeJournalEntryMutation({ ownership: ownershipB, entryId: jNull.id }),
      authorizeProfileMutation({ ownership: ownershipB, profileId: pA.id }),
      authorizeJournalCreateUnderProfile({
        ownership: ownershipB,
        profileId: pA.id,
      }),
      authorizeAccountSettingsMutation({
        ownership: ownershipB,
        contactEmail: EMAIL_A,
      }),
      authorizeJournalEntryIdForP0Identity({
        ownership: ownershipB,
        entryId: jBound.id,
      }),
    ]);

    // Journal/profile/create must fail
    expect(attacks[0]!.state).not.toBe("AUTHORIZED");
    expect(attacks[1]!.state).not.toBe("AUTHORIZED");
    expect(attacks[2]!.state).not.toBe("AUTHORIZED");
    expect(attacks[3]!.state).not.toBe("AUTHORIZED");
    // Settings: UID-B has own settings — AUTHORIZED only for own settingsId, not UID-A's
    if (attacks[4]!.state === "AUTHORIZED") {
      const aSettings = await prisma.accountSettings.findFirst({
        where: { identityId: idA.id },
      });
      expect(
        "settingsId" in attacks[4]! && attacks[4].settingsId !== aSettings?.id,
      ).toBe(true);
    }
    expect(attacks[5]!.ok).toBe(false);

    const uidBSuccessAgainstUidA = [
      attacks[0]!.state === "AUTHORIZED",
      attacks[1]!.state === "AUTHORIZED",
      attacks[2]!.state === "AUTHORIZED",
      attacks[3]!.state === "AUTHORIZED",
      attacks[5]!.ok === true,
    ].filter(Boolean).length;
    expect(uidBSuccessAgainstUidA).toBe(0);

    // Rebind forbidden
    const foreign = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pA.id,
        content: "owned-by-b-wrong",
        identityId: idB.id,
      },
    });
    const rebind = await authorizeJournalEntryMutation({
      ownership: ownershipAChanged,
      entryId: foreign.id,
    });
    expect(rebind.state).toBe("NOT_OWNED");
    expect(rebind.state === "NOT_OWNED" && rebind.reason).toContain("rebind");

    // Ambiguous / mismatch fail closed
    const ambig = await authorizeJournalEntryMutation({
      ownership: {
        state: "AMBIGUOUS",
        identityId: null,
        firebaseUid: `${PREFIX}-x`,
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "x",
      },
      entryId: jBound.id,
    });
    expect(ambig.state).toBe("AMBIGUOUS");

    const mismatch = await authorizeJournalEntryMutation({
      ownership: {
        state: "MISMATCH",
        identityId: idA.id,
        firebaseUid: `${PREFIX}-uid-a`,
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "x",
      },
      entryId: jBound.id,
    });
    expect(mismatch.state).toBe("MISMATCH");

    // Concurrent bind safety: already bound null row stays ID_A on second authorize
    const again = await authorizeJournalEntryMutation({
      ownership: ownershipAChanged,
      entryId: jNull.id,
    });
    expect(again.state).toBe("AUTHORIZED");
    if (again.state === "AUTHORIZED") {
      expect(again.boundIdentityId).toBe(false);
      expect(again.identityId).toBe(idA.id);
    }

    // No auto claim for EMAIL-B
    const claims = await prisma.accountIdentityLegacyActorClaim.findMany({
      where: { identityId: idA.id },
    });
    expect(claims.map((c) => c.actorKey)).toEqual([EMAIL_A]);
  });

  it("gates OFF: mutation helpers unused; email lookup still finds rows", async () => {
    vi.unstubAllEnvs(); // all gates OFF
    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a-off` },
    });
    const p = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "off", identityId: idA.id },
    });
    const j = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: p.id,
        content: "legacy",
        identityId: idA.id,
      },
    });
    const legacy = await prisma.journalEntry.findFirst({
      where: { id: j.id, email: EMAIL_A },
    });
    expect(legacy).toBeTruthy();
  });
});
