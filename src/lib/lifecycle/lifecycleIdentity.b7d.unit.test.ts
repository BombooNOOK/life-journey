/**
 * AI-X6.7B7D — Unit tests: gates, restore auth, delete policy, export transfer helper.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isIdentityAccountDeleteAuthorityEnabled,
  isIdentityExportAuthorityEnabled,
  isIdentityRestoreAuthorityEnabled,
  isIdentitySupportAuthorityEnabled,
  LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG,
  LJD_IDENTITY_EXPORT_AUTHORITY_FLAG,
  LJD_IDENTITY_RESTORE_AUTHORITY_FLAG,
  LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG,
} from "@/lib/lifecycle/lifecycleIdentityGates";
import {
  ACCOUNT_DELETE_POLICY_GRAPH,
  JSO_RETENTION_DECISION,
  ORDER_VALUE_RETENTION_POLICY,
} from "@/lib/lifecycle/identityAccountDelete";
import {
  authorizeIdentityRestore,
  BACKUP_OWNERSHIP_FORMAT_RECOMMENDATION,
  CURRENT_RESTORE_CLASSIFICATION,
} from "@/lib/lifecycle/identityRestoreAuthority";
import { countExportTransfer } from "@/lib/lifecycle/identityExportAuthority";
import type { JournalBackupDocument } from "@/lib/journal/journalBackupExport";
import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
} from "@/lib/journal/journalBackupExport";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI-X6.7B7D lifecycle gates", () => {
  it("default OFF", () => {
    expect(isIdentityExportAuthorityEnabled({})).toBe(false);
    expect(isIdentityRestoreAuthorityEnabled({})).toBe(false);
    expect(isIdentityAccountDeleteAuthorityEnabled({})).toBe(false);
    expect(isIdentitySupportAuthorityEnabled({})).toBe(false);
  });

  it("YES enables", () => {
    expect(
      isIdentityExportAuthorityEnabled({
        [LJD_IDENTITY_EXPORT_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isIdentityRestoreAuthorityEnabled({
        [LJD_IDENTITY_RESTORE_AUTHORITY_FLAG]: "1",
      }),
    ).toBe(true);
    expect(
      isIdentityAccountDeleteAuthorityEnabled({
        [LJD_IDENTITY_ACCOUNT_DELETE_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
    expect(
      isIdentitySupportAuthorityEnabled({
        [LJD_IDENTITY_SUPPORT_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
  });
});

describe("AI-X6.7B7D restore / policy docs", () => {
  it("current restore classification PARTIAL; recommendations present", () => {
    expect(CURRENT_RESTORE_CLASSIFICATION).toBe("PARTIAL");
    expect(BACKUP_OWNERSHIP_FORMAT_RECOMMENDATION.length).toBeGreaterThan(0);
    expect(JSO_RETENTION_DECISION.policy).toBe("DELETE_AFTER_PENDING_RESOLVED");
    expect(ORDER_VALUE_RETENTION_POLICY.Order).toContain("POLICY");
    expect(ACCOUNT_DELETE_POLICY_GRAPH.some((n) => n.model === "AccountIdentity")).toBe(
      true,
    );
  });

  it("email equality is not restore authority; provenance mismatch denies", async () => {
    vi.stubEnv(LJD_IDENTITY_RESTORE_AUTHORITY_FLAG, "YES");

    const doc = {
      format: JOURNAL_BACKUP_FORMAT,
      formatVersion: JOURNAL_BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      app: "Life Journey Diary",
      photoPolicy: {
        exportedPhotoType: "processed" as const,
        descriptionJa: "",
        description: "",
      },
      profile: {
        id: "p",
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
        firebaseUid: "uid-a",
        stableActorKey: "firebase:uid-a",
        historicalEmails: ["a@ljd.invalid"],
      },
    } as JournalBackupDocument & {
      ownership: {
        firebaseUid: string;
        stableActorKey: string;
        historicalEmails: string[];
      };
    };

    const denied = await authorizeIdentityRestore({
      viewerEmail: "a@ljd.invalid",
      document: doc,
      subject: {
        state: "BOUND",
        identityId: "id-b",
        firebaseUid: "uid-b",
        stableActorKey: "firebase:uid-b",
        explicitHistoricalEmails: ["a@ljd.invalid"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "a@ljd.invalid",
      },
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("backup_firebase_uid_mismatch");

    const allowed = await authorizeIdentityRestore({
      viewerEmail: "b@ljd.invalid",
      document: doc,
      subject: {
        state: "BOUND",
        identityId: "id-a",
        firebaseUid: "uid-a",
        stableActorKey: "firebase:uid-a",
        explicitHistoricalEmails: ["a@ljd.invalid"],
        legacyActorKeys: [],
        verifiedEmailMetadata: "b@ljd.invalid",
      },
    });
    expect(allowed.ok).toBe(true);
    if (allowed.ok) expect(allowed.emailEqualityUsedAsAuthority).toBe(false);
  });
});

describe("AI-X6.7B7D export transfer helper", () => {
  it("counts overlapping ids", () => {
    expect(
      countExportTransfer({
        uidAEntryIds: ["e1", "e2"],
        exportedEntryIds: ["e2", "e3"],
      }),
    ).toBe(1);
    expect(
      countExportTransfer({
        uidAEntryIds: ["e1"],
        exportedEntryIds: ["e9"],
      }),
    ).toBe(0);
  });
});
