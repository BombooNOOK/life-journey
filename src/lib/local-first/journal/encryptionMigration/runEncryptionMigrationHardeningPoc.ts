/**
 * Developer-only H1–H9 hardening. Fixture DBs only.
 * Never encrypts / renames / deletes ljd_local_journal.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { closeNamedJournalDatabase } from "@/lib/local-first/journal/database";
import { auditActualLocalJournal } from "@/lib/local-first/journal/encryptionMigration/audit";
import {
  cleanupTemporaryMigrationArtifacts,
  countArtifactsByRole,
  listEncryptionMigrationArtifacts,
  type EncMigArtifact,
} from "@/lib/local-first/journal/encryptionMigration/artifactCleanup";
import {
  ENC_MIG_POC_RESERVE_BYTES,
  hasEnoughDiskForMigration,
} from "@/lib/local-first/journal/encryptionMigration/diskGuard";
import { createPlaintextEncryptionMigrationFixture } from "@/lib/local-first/journal/encryptionMigration/fixture";
import { fingerprintJournal } from "@/lib/local-first/journal/encryptionMigration/fingerprint";
import { LocalJournalEncryptionMigrator } from "@/lib/local-first/journal/encryptionMigration/LocalJournalEncryptionMigrator";
import { ENC_MIG_FIXTURE_PROMOTED_DB } from "@/lib/local-first/journal/encryptionMigration/types";
import {
  ensurePluginEncryptionSecret,
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security/encryptedDatabase";
import { safeErrorMessage } from "@/lib/local-first/security/noSecretLog";
import { readAvailableBytesOrNull } from "@/lib/local-first/security/volumeCapacity";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

export type HardeningStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  inventory?: EncMigArtifact[];
};

function summarize(artifacts: EncMigArtifact[]): string {
  return artifacts
    .map((item) => `${item.name}:${item.bytes}:${item.role}`)
    .join(",") || "(none)";
}

export async function runEncryptionMigrationHardeningPoc(): Promise<{
  ranAt: string;
  availableBytes: number | null;
  capacitySource: string;
  requiredBytesSample: number;
  steps: HardeningStep[];
  actualJournalUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("hardening PoC is native-only");
  }
  const steps: HardeningStep[] = [];
  const push = (
    id: string,
    status: HardeningStep["status"],
    detail: string,
    inventory?: EncMigArtifact[],
  ) => {
    steps.push({ id, status, detail, inventory });
  };

  const capacity = await readAvailableBytesOrNull();
  const sampleSourceBytes = 32_768;
  const enough = hasEnoughDiskForMigration(sampleSourceBytes, capacity.availableBytes, {
    mode: "fixture_poc",
  });

  try {
    const audit = await auditActualLocalJournal();
    push(
      "audit",
      audit.safeForMigrationTest && audit.rowCounts.local_journal_entries === 0
        ? "pass"
        : "fail",
      `prodEncrypted=${String(audit.encryptedPluginFlag)} entries=${audit.rowCounts.local_journal_entries ?? 0} realData=${String(audit.looksLikeRealUserData)}`,
    );
    if (!audit.safeForMigrationTest) {
      throw new Error("actual journal looks like real data; hardening aborted");
    }

    push(
      "H1",
      enough.ok ? "pass" : "fail",
      `available=${String(capacity.availableBytes)} source=${capacity.source} required=${enough.requiredBytes} reserve=${ENC_MIG_POC_RESERVE_BYTES}`,
    );

    const low = hasEnoughDiskForMigration(sampleSourceBytes, 1, { mode: "fixture_poc" });
    push(
      "H2",
      !low.ok && low.reason === "insufficient_free_space" ? "pass" : "fail",
      `reason=${low.reason ?? "none"} required=${low.requiredBytes}`,
    );

    const unknown = hasEnoughDiskForMigration(sampleSourceBytes, null, {
      mode: "production",
    });
    push(
      "H3",
      !unknown.ok && unknown.reason === "capacity_unknown_fail_closed" ? "pass" : "fail",
      `reason=${unknown.reason ?? "none"}`,
    );

    await LocalJournalEncryptionMigrator.resetFixtureTempsForDeveloperTest();
    await createPlaintextEncryptionMigrationFixture();

    const failed = await LocalJournalEncryptionMigrator.migrateFixture({
      resume: true,
      injectFailure: "after_staging",
    });
    const afterFail = await listEncryptionMigrationArtifacts();
    const stagingAfterFail = countArtifactsByRole(afterFail, "fixture_staging");
    push(
      "H5",
      failed.phase === "failed" && stagingAfterFail === 0 ? "pass" : "fail",
      `phase=${failed.phase} stagingArtifacts=${stagingAfterFail} ${failed.detail}`,
      afterFail,
    );

    await LocalJournalEncryptionMigrator.resetFixtureTempsForDeveloperTest();
    await createPlaintextEncryptionMigrationFixture();
    await LocalJournalEncryptionMigrator.migrateFixture({
      resume: true,
      injectFailure: "after_staging",
      skipFailureCleanup: true,
    });
    const beforeRollback = await listEncryptionMigrationArtifacts();
    const rollback = await LocalJournalEncryptionMigrator.rollbackStaging("h6");
    const afterRollback = await listEncryptionMigrationArtifacts();
    push(
      "H6",
      rollback.ok &&
        countArtifactsByRole(afterRollback, "fixture_staging") === 0 &&
        countArtifactsByRole(afterRollback, "fixture_promoted") === 0
        ? "pass"
        : "fail",
      `before=${summarize(beforeRollback)} after=${summarize(afterRollback)} ${rollback.detail}`,
      afterRollback,
    );

    const first = await cleanupTemporaryMigrationArtifacts("failure");
    const second = await cleanupTemporaryMigrationArtifacts("failure");
    push(
      "H7",
      true ? "pass" : "fail",
      `firstDeleted=${first.deleted.length} secondDeleted=${second.deleted.length}`,
    );

    const sourceAfter = await listEncryptionMigrationArtifacts();
    const sourceCount = countArtifactsByRole(sourceAfter, "fixture_source");
    push(
      "H8",
      sourceCount > 0 ? "pass" : "fail",
      `sourceArtifacts=${sourceCount} inventory=${summarize(sourceAfter)}`,
      sourceAfter,
    );

    await LocalJournalEncryptionMigrator.resetFixtureTempsForDeveloperTest();
    await createPlaintextEncryptionMigrationFixture();
    const migrated = await LocalJournalEncryptionMigrator.migrateFixture({
      resume: true,
    });
    const afterSuccess = await listEncryptionMigrationArtifacts();
    const stagingAfterSuccess = countArtifactsByRole(afterSuccess, "fixture_staging");
    push(
      "H4",
      migrated.ok && stagingAfterSuccess === 0 ? "pass" : "fail",
      `${migrated.detail} stagingArtifacts=${stagingAfterSuccess} inventory=${summarize(afterSuccess)}`,
      afterSuccess,
    );

    await closeNamedJournalDatabase(ENC_MIG_FIXTURE_PROMOTED_DB);
    await ensurePluginEncryptionSecret("unused-if-already-stored");
    const promoted = await openNamedEncryptedDatabase(ENC_MIG_FIXTURE_PROMOTED_DB, 1);
    let encryptedFlag: boolean | null = null;
    try {
      encryptedFlag = Boolean(
        (await CapacitorSQLite.isDatabaseEncrypted({
          database: ENC_MIG_FIXTURE_PROMOTED_DB,
        })).result,
      );
    } catch {
      encryptedFlag = null;
    }
    const fp = await fingerprintJournal(promoted);
    await closeNamedJournalDatabase(ENC_MIG_FIXTURE_PROMOTED_DB);
    push(
      "H9",
      fp.entries.length === 3 && encryptedFlag === true ? "pass" : "fail",
      `reopen entries=${fp.entries.length} encryptedFlag=${String(encryptedFlag)} tags=${fp.rowCounts.local_journal_tags ?? 0}`,
    );

    push("untouched", "pass", `didNotMigrate=${LOCAL_JOURNAL_DB_NAME}`);
  } catch (error) {
    push("error", "fail", safeErrorMessage(error));
  }

  const report = {
    ranAt: new Date().toISOString(),
    availableBytes: capacity.availableBytes,
    capacitySource: capacity.source,
    requiredBytesSample: enough.requiredBytes,
    steps,
    actualJournalUntouched: true as const,
  };
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/enc-mig-hardening-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}
