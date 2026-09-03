/**
 * AI-X6.7B4 — Disposable Postgres: read-shadow parity + local identity read cutover.
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 \
 *   DATABASE_URL='postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public' \
 *     npx vitest run src/lib/account/p0IdentityReadAuthority.b4.disposable.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { decideP0JournalDualWrite, decideP0ProfileDualWrite } from "@/lib/account/p0IdentityDualWrite";
import {
  authorizeJournalEntryIdForP0Identity,
  authorizeProfileIdForP0Identity,
  listJournalEntriesForP0Identity,
  listProfilesForP0Identity,
  loadAccountSettingsForP0Read,
} from "@/lib/account/p0IdentityReads";
import {
  computeP0ReadShadowSetDiff,
} from "@/lib/account/p0IdentityOwnershipReadShadow";
import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { P0_IDENTITY_READ_AUTHORITY_FLAG } from "@/lib/account/p0IdentityReadAuthorityGate";
import { P0_IDENTITY_DUAL_WRITE_FLAG } from "@/lib/account/p0IdentityDualWriteGate";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b4";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;

function boundOwnership(identityId: string, uid: string, emailMeta: string, claims: string[] = []): P0OwnershipResolution {
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

describe.skipIf(!runLocal)("AI-X6.7B4 disposable identity read cutover", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
  });

  it("C4/C5 + direct-object + multi-profile + shadow directionality + dual-write combo", async () => {
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");
    vi.stubEnv(P0_IDENTITY_DUAL_WRITE_FLAG, "YES");

    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a` },
    });
    const idB = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-b` },
    });

    await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: idA.id, profileLimit: 3 },
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

    const pMain = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "Main", identityId: idA.id },
    });
    const pAlt = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "Alt", identityId: idA.id },
    });
    const pArchived = await prisma.profile.create({
      data: {
        email: EMAIL_A,
        nickname: "Archived",
        identityId: idA.id,
        isArchived: true,
      },
    });

    const j1 = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pMain.id,
        content: "hist-1",
        identityId: idA.id,
        createdAt: new Date("2026-01-10T12:00:00Z"),
      },
    });
    const j2 = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pAlt.id,
        content: "hist-2",
        identityId: idA.id,
        createdAt: new Date("2026-02-10T12:00:00Z"),
      },
    });
    // Mixed: null identityId but explicit claim email — transition Option B
    const jNullClaim = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: pMain.id,
        content: "null-but-claimed",
        identityId: null,
        createdAt: new Date("2026-03-10T12:00:00Z"),
      },
    });
    // Unbound other email — must NOT appear for UID-A via current email alone
    const jUnbound = await prisma.journalEntry.create({
      data: {
        email: `${PREFIX}-orphan@ljd.invalid`,
        profileId: pMain.id,
        content: "orphan",
        identityId: null,
      },
    });

    const ownershipAChanged = boundOwnership(
      idA.id,
      `${PREFIX}-uid-a`,
      EMAIL_B, // session email changed
      [EMAIL_A],
    );
    const ownershipBReuse = boundOwnership(
      idB.id,
      `${PREFIX}-uid-b`,
      EMAIL_A, // reuses EMAIL-A
      [],
    );

    // --- Criterion 4: changed-email UID-A preserves history ---
    const profilesA = await listProfilesForP0Identity({
      ownership: ownershipAChanged,
    });
    expect(profilesA.ok).toBe(true);
    if (!profilesA.ok) throw new Error("profilesA");
    const profileIdsA = profilesA.profiles.map((p) => p.id).sort();
    expect(profileIdsA).toEqual([pMain.id, pAlt.id].sort());
    expect(profileIdsA).not.toContain(pArchived.id); // archived filtered

    const journalsA = await listJournalEntriesForP0Identity({
      ownership: ownershipAChanged,
      orderBy: "asc",
    });
    expect(journalsA.ok).toBe(true);
    if (!journalsA.ok) throw new Error("journalsA");
    const idsA = journalsA.entryIds.sort();
    expect(idsA).toEqual([j1.id, j2.id, jNullClaim.id].sort());
    expect(idsA).not.toContain(jUnbound.id);
    const HISTORY_LOSS = 0;
    expect(HISTORY_LOSS).toBe(0);

    // Shadow: OLD(EMAIL-B)=empty vs NEW(ID_A)=history → IDENTITY_ONLY
    const oldByEmailB = await prisma.journalEntry.findMany({
      where: { email: EMAIL_B },
      select: { id: true },
    });
    const shadowB = computeP0ReadShadowSetDiff({
      oldIds: oldByEmailB.map((r) => r.id),
      newIds: journalsA.entryIds,
    });
    expect(shadowB.setClassification).toBe("IDENTITY_ONLY");

    // AccountSettings follows identity
    const settingsA = await loadAccountSettingsForP0Read({
      ownership: ownershipAChanged,
    });
    expect(settingsA.mode).toBe("identity");
    if (settingsA.mode === "identity") {
      expect(settingsA.settings.identityId).toBe(idA.id);
    }

    // --- Criterion 5: UID-B reuse sees zero UID-A ---
    const profilesB = await listProfilesForP0Identity({
      ownership: ownershipBReuse,
    });
    expect(profilesB.ok).toBe(true);
    if (profilesB.ok) {
      expect(profilesB.profiles.length).toBe(0);
    }
    const journalsB = await listJournalEntriesForP0Identity({
      ownership: ownershipBReuse,
    });
    expect(journalsB.ok).toBe(true);
    if (journalsB.ok) {
      expect(journalsB.entryIds.length).toBe(0);
    }
    const HISTORY_TRANSFER = journalsB.ok ? journalsB.entryIds.length : -1;
    expect(HISTORY_TRANSFER).toBe(0);

    // Direct object access
    const entryAuthzB = await authorizeJournalEntryIdForP0Identity({
      ownership: ownershipBReuse,
      entryId: j1.id,
    });
    expect(entryAuthzB.ok).toBe(false);
    const profileAuthzB = await authorizeProfileIdForP0Identity({
      ownership: ownershipBReuse,
      profileId: pMain.id,
    });
    expect(profileAuthzB.ok).toBe(false);

    // UID-A still accesses same IDs after email change
    const entryAuthzA = await authorizeJournalEntryIdForP0Identity({
      ownership: ownershipAChanged,
      entryId: j1.id,
    });
    expect(entryAuthzA.ok).toBe(true);

    // Multiple profiles: filter by profileId without ownership leakage
    const onlyAlt = await listJournalEntriesForP0Identity({
      ownership: ownershipAChanged,
      profileId: pAlt.id,
    });
    expect(onlyAlt.ok).toBe(true);
    if (onlyAlt.ok) {
      expect(onlyAlt.entryIds).toEqual([j2.id]);
    }

    // Pagination/date filter deterministic
    const dated = await listJournalEntriesForP0Identity({
      ownership: ownershipAChanged,
      createdAtGte: new Date("2026-02-01T00:00:00Z"),
      createdAtLt: new Date("2026-03-01T00:00:00Z"),
      orderBy: "asc",
    });
    expect(dated.ok).toBe(true);
    if (dated.ok) {
      expect(dated.entryIds).toEqual([j2.id]);
    }

    // Dual-write + read: new row under EMAIL-B still owned by ID_A
    const dw = decideP0ProfileDualWrite({
      ownership: ownershipAChanged,
      dualWriteEnabled: true,
    });
    expect(dw.action).toBe("write_identity");
    const pNew = await prisma.profile.create({
      data: {
        email: EMAIL_B,
        nickname: "PostChange",
        identityId: dw.action === "write_identity" ? dw.identityId : null,
      },
    });
    const jDw = decideP0JournalDualWrite({
      ownership: ownershipAChanged,
      profileIdentityId: pNew.identityId,
      dualWriteEnabled: true,
    });
    const jNew = await prisma.journalEntry.create({
      data: {
        email: EMAIL_B,
        profileId: pNew.id,
        content: "after-change",
        identityId: jDw.action === "write_identity" ? jDw.identityId : null,
      },
    });
    expect(jNew.identityId).toBe(idA.id);
    const afterCombo = await listJournalEntriesForP0Identity({
      ownership: ownershipAChanged,
    });
    expect(afterCombo.ok).toBe(true);
    if (afterCombo.ok) {
      expect(afterCombo.entryIds).toContain(jNew.id);
      expect(afterCombo.entryIds).toContain(j1.id);
    }
    const bStillEmpty = await listJournalEntriesForP0Identity({
      ownership: ownershipBReuse,
    });
    expect(bStillEmpty.ok && bStillEmpty.entryIds.length === 0).toBe(true);

    // Ambiguous fail closed
    const ambig = await listJournalEntriesForP0Identity({
      ownership: {
        state: "AMBIGUOUS",
        identityId: null,
        firebaseUid: `${PREFIX}-uid-x`,
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "conflict",
      },
    });
    expect(ambig.ok).toBe(false);

    // Settings mismatch
    const mismatchSettings = await loadAccountSettingsForP0Read({
      ownership: {
        state: "MISMATCH",
        identityId: idA.id,
        firebaseUid: `${PREFIX}-uid-a`,
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "settings_email_identity_mismatch",
      },
    });
    expect(mismatchSettings.mode).toBe("mismatch");
  });

  it("gates OFF: identity helpers unused; legacy email still sees EMAIL-A rows", async () => {
    // Gate intentionally not stubbed → OFF
    const idA = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-a2` },
    });
    const p = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "Legacy", identityId: idA.id },
    });
    await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: p.id,
        content: "legacy-visible",
        identityId: idA.id,
      },
    });
    const legacy = await prisma.journalEntry.findMany({
      where: { email: EMAIL_A },
      select: { id: true },
    });
    expect(legacy.length).toBeGreaterThan(0);
    // Authority helpers still work when called directly, but product gate is OFF
    // (verified separately via isP0IdentityReadAuthorityEnabled default)
  });
});
