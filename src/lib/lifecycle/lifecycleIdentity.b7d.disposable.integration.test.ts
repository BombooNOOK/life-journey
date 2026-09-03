/**
 * AI-X6.7B7D — Disposable Postgres identity lifecycle security.
 * Hard gate: 127.0.0.1:5433/ljd_dev only. Never Neon. No Production delete.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  applyIdentityAccountDelete,
  dryRunIdentityAccountDelete,
} from "@/lib/lifecycle/identityAccountDelete";
import {
  countExportTransfer,
  listIdentityExportRowAliases,
} from "@/lib/lifecycle/identityExportAuthority";
import { authorizeIdentityRestore } from "@/lib/lifecycle/identityRestoreAuthority";
import {
  authorizeSupportInquiryAccess,
  listSupportInquiryIdsForSubject,
  runSupportInquiryIdentityBackfill,
} from "@/lib/lifecycle/identitySupportAuthority";
import {
  LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG,
  LJD_IDENTITY_EXPORT_AUTHORITY_FLAG,
  LJD_IDENTITY_RESTORE_AUTHORITY_FLAG,
  LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG,
} from "@/lib/lifecycle/lifecycleIdentityGates";
import type { LifecycleSubject } from "@/lib/lifecycle/lifecycleSubject";
import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
} from "@/lib/journal/journalBackupExport";
import { assertProfileBelongsToIdentity } from "@/lib/diary/diaryIdentityAuthority";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67b7d";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;

function boundOwnership(
  identityId: string,
  uid: string,
  emailMeta: string,
  claims: string[] = [EMAIL_A],
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

function boundSubject(
  identityId: string,
  uid: string,
  emailMeta: string,
  emails: string[] = [EMAIL_A],
): Extract<LifecycleSubject, { state: "BOUND" }> {
  return {
    state: "BOUND",
    identityId,
    firebaseUid: uid,
    stableActorKey: buildFirebaseActorKey(uid),
    explicitHistoricalEmails: emails,
    legacyActorKeys: emails,
    verifiedEmailMetadata: emailMeta,
  };
}

async function wipe() {
  await prisma.supportInquiry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.diaryBookBindingRequest.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.kanteiBookBindingRequest.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.logHouseMailboxNotice.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.gardenDisplayFlower.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.gardenPlant.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.systemNoticeReadState.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.order.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.diaryBookshelfBook.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.diaryBook.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.journalDraft.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.journalEntry.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.journalSaveOperation.deleteMany({
    where: {
      OR: [
        { actorKey: { startsWith: `firebase:${PREFIX}-` } },
        { actorKey: { startsWith: `${PREFIX}-` } },
      ],
    },
  });
  await prisma.journalSaveIdempotencyRollout.deleteMany({
    where: {
      OR: [
        { actorKey: { startsWith: `firebase:${PREFIX}-` } },
        { actorKey: { startsWith: `${PREFIX}-` } },
      ],
    },
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

describe.skipIf(!runLocal)("AI-X6.7B7D disposable identity lifecycle", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    vi.stubEnv(LJD_IDENTITY_EXPORT_AUTHORITY_FLAG, "YES");
    vi.stubEnv(LJD_IDENTITY_RESTORE_AUTHORITY_FLAG, "YES");
    vi.stubEnv(LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG, "YES");
    vi.stubEnv(LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG, "YES");
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
  });

  it("export/support/delete lifecycle: same-UID retain; UID-B transfer=0; apply idempotent", async () => {
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

    const profileA = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "A", identityId: idA.id },
    });
    const entryA = await prisma.journalEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        content: "secret-A",
        identityId: idA.id,
      },
    });
    await prisma.journalDraft.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        dateKey: "2026-09-01",
        content: "draft-A",
        identityId: idA.id,
      },
    });
    const bookA = await prisma.diaryBook.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        title: "Book A",
        startDate: "2026-01-01",
        endDate: "2026-09-01",
        identityId: idA.id,
      },
    });
    await prisma.diaryBookshelfBook.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        year: 2026,
        identityId: idA.id,
      },
    });
    await prisma.diaryBookBindingRequest.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        diaryBookId: bookA.id,
        diaryBindingCode: `LJD-${PREFIX}-1`,
        status: "pending",
        pageCount: 8,
        planId: "plan_a",
        identityId: idA.id,
      },
    });
    await prisma.order.create({
      data: {
        lastName: "Y",
        firstName: "T",
        lastNameKana: "や",
        firstNameKana: "た",
        lastNameRoman: "Y",
        firstNameRoman: "T",
        fullNameDisplay: "YT",
        fullNameKanaDisplay: "やた",
        fullNameRomanDisplay: "YT",
        birthDate: "1990-01-01",
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
        postalCode: "",
        address: "",
        phone: "",
        email: EMAIL_A,
        profileId: profileA.id,
        numerologyJson: "{}",
        stonesJson: "[]",
        identityId: idA.id,
      },
    });
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email: EMAIL_A,
        profileId: profileA.id,
        amount: 5,
        reason: "admin_grant",
        title: "g",
        identityId: idA.id,
      },
    });
    const supportA = await prisma.supportInquiry.create({
      data: {
        email: EMAIL_A,
        category: "other",
        message: "help-A",
        replyChannel: "chat",
        identityId: idA.id,
      },
    });
    await prisma.journalSaveOperation.create({
      data: {
        actorKey: buildFirebaseActorKey(`${PREFIX}-uid-a`),
        saveOperationId: `${PREFIX}-op-1`,
        status: "completed",
        checkpoint: "completed",
        requestFingerprint: "fp1",
      },
    });

    const subjectA_onB = boundSubject(idA.id, `${PREFIX}-uid-a`, EMAIL_B);
    const ownershipA_onB = boundOwnership(idA.id, `${PREFIX}-uid-a`, EMAIL_B);
    const subjectB = boundSubject(idB.id, `${PREFIX}-uid-b`, EMAIL_A, [
      `${PREFIX}-b-current@ljd.invalid`,
    ]);
    const ownershipB = boundOwnership(
      idB.id,
      `${PREFIX}-uid-b`,
      EMAIL_A,
      [],
    );

    // Export aliases — same UID after EMAIL-B
    const exportA = await listIdentityExportRowAliases({
      subject: subjectA_onB,
      ownership: ownershipA_onB,
      profileId: profileA.id,
    });
    expect("ok" in exportA && exportA.ok === false).toBe(false);
    const aliasesA = exportA as {
      journalEntryIds: string[];
      diaryBookIds: string[];
    };
    expect(aliasesA.journalEntryIds).toContain(entryA.id);
    expect(aliasesA.diaryBookIds).toContain(bookA.id);

    // UID-B export of UID-A profile denied / empty
    const exportB = await listIdentityExportRowAliases({
      subject: subjectB,
      ownership: ownershipB,
      profileId: profileA.id,
    });
    expect("ok" in exportB && exportB.ok === false).toBe(true);

    const transfer = countExportTransfer({
      uidAEntryIds: aliasesA.journalEntryIds,
      exportedEntryIds: [],
    });
    expect(transfer).toBe(0);

    // Support: UID-A retains; UID-B denied
    const supportIdsA = await listSupportInquiryIdsForSubject(subjectA_onB);
    expect(supportIdsA).toContain(supportA.id);
    expect(
      (
        await authorizeSupportInquiryAccess({
          inquiryId: supportA.id,
          subject: subjectA_onB,
          bindOnAuthorize: false,
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await authorizeSupportInquiryAccess({
          inquiryId: supportA.id,
          subject: subjectB,
          bindOnAuthorize: false,
        })
      ).ok,
    ).toBe(false);

    // Restore provenance mismatch
    const fakeDoc = {
      format: JOURNAL_BACKUP_FORMAT,
      formatVersion: JOURNAL_BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      app: "Life Journey Diary" as const,
      photoPolicy: {
        exportedPhotoType: "processed" as const,
        descriptionJa: "",
        description: "",
      },
      profile: {
        id: "x",
        nickname: "n",
        birthDate: null,
        birthMonth: null,
        birthDay: null,
        lifePathNumber: null,
      },
      entries: [],
      diaryBooks: [],
      bookshelfBooks: [],
      ownership: {
        firebaseUid: `${PREFIX}-uid-a`,
        stableActorKey: buildFirebaseActorKey(`${PREFIX}-uid-a`),
        historicalEmails: [EMAIL_A],
      },
    };
    const restoreB = await authorizeIdentityRestore({
      viewerEmail: EMAIL_A,
      document: fakeDoc,
      subject: subjectB,
    });
    expect(restoreB.ok).toBe(false);

    // Garden/Mailbox deferral: profile ownership fail-closed for UID-B
    expect(
      (
        await assertProfileBelongsToIdentity({
          ownership: ownershipB,
          profileId: profileA.id,
        })
      ).state,
    ).toBe("NOT_OWNED");

    // Support backfill idempotent
    const bf1 = await runSupportInquiryIdentityBackfill(prisma, {
      mode: "APPLY",
      emailFilter: new Set([EMAIL_A]),
    });
    const bf2 = await runSupportInquiryIdentityBackfill(prisma, {
      mode: "APPLY",
      emailFilter: new Set([EMAIL_A]),
    });
    expect(bf2.updates).toBe(0);
    expect(bf1.alreadyBound + bf2.alreadyBound).toBeGreaterThan(0);

    // Delete dry-run for UID-A finds graph; UID-B dry-run must not include A's entry
    const dryA = await dryRunIdentityAccountDelete(prisma, {
      subject: subjectA_onB,
    });
    expect("canApply" in dryA && dryA.canApply).toBe(true);
    if ("rows" in dryA) {
      const je = dryA.rows.find((r) => r.model === "JournalEntry");
      expect((je?.count ?? 0) >= 1).toBe(true);
    }

    const dryB = await dryRunIdentityAccountDelete(prisma, { subject: subjectB });
    if ("rows" in dryB) {
      const jeB = dryB.rows.find((r) => r.model === "JournalEntry");
      expect(jeB?.count ?? 0).toBe(0);
    }

    // Apply delete UID-A — disposable only
    const apply1 = await applyIdentityAccountDelete(prisma, {
      subject: subjectA_onB,
      anonymizeOrders: true,
    });
    expect("mode" in apply1 && apply1.mode === "APPLY").toBe(true);
    if ("deleted" in apply1) {
      expect(apply1.deleted.JournalEntry ?? 0).toBeGreaterThanOrEqual(1);
      expect(apply1.deleted.AccountIdentity ?? 0).toBe(1);
    }

    // UID-B rows untouched (settings for B still exists)
    expect(
      await prisma.accountSettings.count({
        where: { identityId: idB.id },
      }),
    ).toBe(1);

    const apply2 = await applyIdentityAccountDelete(prisma, {
      subject: subjectA_onB,
    });
    expect("alreadyDeleted" in apply2 && apply2.alreadyDeleted).toBe(true);

    // Pending JSO blocks delete
    const idC = await prisma.accountIdentity.create({
      data: { firebaseUid: `${PREFIX}-uid-c` },
    });
    await prisma.accountSettings.create({
      data: {
        email: `${PREFIX}-c@ljd.invalid`,
        identityId: idC.id,
        profileLimit: 1,
      },
    });
    await prisma.journalSaveOperation.create({
      data: {
        actorKey: buildFirebaseActorKey(`${PREFIX}-uid-c`),
        saveOperationId: `${PREFIX}-pending`,
        status: "processing",
        checkpoint: "claimed",
        requestFingerprint: "fp-pending",
      },
    });
    const dryC = await dryRunIdentityAccountDelete(prisma, {
      subject: boundSubject(idC.id, `${PREFIX}-uid-c`, `${PREFIX}-c@ljd.invalid`, [
        `${PREFIX}-c@ljd.invalid`,
      ]),
    });
    expect("canApply" in dryC && dryC.canApply).toBe(false);
  });
});
