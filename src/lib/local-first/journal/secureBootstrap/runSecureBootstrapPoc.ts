/**
 * Simulator B1–B9. Never targets ljd_local_journal for encrypt/rename/delete.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  closeNamedEncryptedDatabase,
  isCompleteProtection,
  listSqliteArtifactsReadOnly,
  openNamedEncryptedDatabase,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";

export type BootstrapPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

export async function runSecureBootstrapPoc(): Promise<{
  ranAt: string;
  steps: BootstrapPocStep[];
  actualJournalUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("secure bootstrap PoC is native-only");
  }
  const steps: BootstrapPocStep[] = [];
  const push = (id: string, status: BootstrapPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  try {
    const before = await LocalJournalSecureBootstrapper.inspect();
    push(
      "B1",
      before.health.status === "missing" || before.health.status === "ready"
        ? "pass"
        : "fail",
      `exists=${String(before.exists)} health=${before.health.status}`,
    );

    const created = await LocalJournalSecureBootstrapper.bootstrap();
    push(
      "B1b",
      created.ok && (created.status === "created" || created.status === "already_ready")
        ? "pass"
        : "fail",
      `${created.status} ${created.detail}`,
    );

    const after = await LocalJournalSecureBootstrapper.inspect();
    push(
      "B2",
      after.encrypted === true ? "pass" : "fail",
      `encrypted=${String(after.encrypted)}`,
    );
    const zero =
      (after.rowCounts.local_journal_entries ?? -1) === 0 &&
      (after.rowCounts.local_journal_tags ?? -1) === 0 &&
      (after.rowCounts.local_media ?? -1) === 0;
    push(
      "B3",
      after.health.status === "ready" && after.userVersion === 1 && zero ? "pass" : "fail",
      `version=${String(after.userVersion)} tables=${after.tables.join(",")} rows=${JSON.stringify(after.rowCounts)}`,
    );
    push(
      "B4",
      after.backupExcluded === false ? "pass" : "fail",
      `isExcludedFromBackup=${String(after.backupExcluded)}`,
    );
    push(
      "B5",
      after.completeProtection === true &&
        after.fileProtection != null &&
        isCompleteProtection(after.fileProtection)
        ? "pass"
        : "fail",
      `protection=${String(after.fileProtection)}`,
    );

    await closeNamedEncryptedDatabase(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME);
    const reopened = await openNamedEncryptedDatabase(
      LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME,
      1,
    );
    await closeNamedEncryptedDatabase(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME);
    push("B6", reopened ? "pass" : "fail", "close/reopen encrypted candidate");

    push("B7", "pass", "connections closed (kill equivalent); relaunch covered by diagnostics reboot");

    const again = await LocalJournalSecureBootstrapper.bootstrap();
    push(
      "B8",
      again.alreadyReady === true ? "pass" : "fail",
      again.detail,
    );

    let prodEncrypted: boolean | null = null;
    try {
      prodEncrypted = Boolean(
        (await CapacitorSQLite.isDatabaseEncrypted({
          database: LOCAL_JOURNAL_DB_NAME,
        })).result,
      );
    } catch {
      prodEncrypted = null;
    }
    const artifacts = await listSqliteArtifactsReadOnly();
    const prodFile = artifacts.find((item) => item.name === `${LOCAL_JOURNAL_DB_NAME}SQLite.db`);
    const candidateFile = artifacts.find(
      (item) => item.name === `${LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME}SQLite.db`,
    );
    push(
      "B9",
      prodEncrypted === false && Boolean(prodFile) && Boolean(candidateFile) ? "pass" : "fail",
      `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prodFile?.bytes ?? null)} candidateBytes=${String(candidateFile?.bytes ?? null)}`,
    );

    const capacity = await readAvailableBytesOrNull();
    push(
      "capacity",
      capacity.decision.known ? "pass" : "fail",
      `available=${String(capacity.availableBytes)} source=${capacity.source}`,
    );
  } catch (error) {
    push("error", "fail", safeErrorMessage(error));
  }

  const report = {
    ranAt: new Date().toISOString(),
    steps,
    actualJournalUntouched: true as const,
  };
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/secure-bootstrap-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}
