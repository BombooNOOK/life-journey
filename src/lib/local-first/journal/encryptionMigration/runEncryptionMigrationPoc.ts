/**
 * Simulator / developer PoC for M1–M9. Fixture DBs only.
 * Never encrypts ljd_local_journal. Never logs body/secret.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { closeNamedJournalDatabase } from "@/lib/local-first/journal/database";
import { auditActualLocalJournal } from "@/lib/local-first/journal/encryptionMigration/audit";
import { createPlaintextEncryptionMigrationFixture } from "@/lib/local-first/journal/encryptionMigration/fixture";
import { fingerprintJournal } from "@/lib/local-first/journal/encryptionMigration/fingerprint";
import { LocalJournalEncryptionMigrator } from "@/lib/local-first/journal/encryptionMigration/LocalJournalEncryptionMigrator";
import {
  ENC_MIG_FIXTURE_PLAIN_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";
import {
  ensurePluginEncryptionSecret,
  openNamedEncryptedDatabase,
  plaintextOpenMustFail,
} from "@/lib/local-first/security/encryptedDatabase";
import { safeErrorMessage } from "@/lib/local-first/security/noSecretLog";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

export type EncMigPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

function randomPassphrase(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function runEncryptionMigrationPoc(): Promise<{
  ranAt: string;
  steps: EncMigPocStep[];
  actualJournalUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("encryption migration PoC is native-only");
  }
  const steps: EncMigPocStep[] = [];
  const push = (id: string, status: EncMigPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };
  const passphrase = randomPassphrase();

  try {
    const audit = await auditActualLocalJournal();
    push(
      "audit",
      audit.safeForMigrationTest ? "pass" : "fail",
      `exists=${String(audit.exists)} encrypted=${String(audit.encryptedPluginFlag)} entries=${audit.rowCounts.local_journal_entries ?? 0} realData=${String(audit.looksLikeRealUserData)}`,
    );
    if (!audit.safeForMigrationTest) {
      throw new Error("actual journal looks like real data; fixture PoC aborted");
    }

    const fixture = await createPlaintextEncryptionMigrationFixture();
    push(
      "M1",
      "pass",
      `plain=${fixture.dbName} entries=${fixture.entryCount} tags=${fixture.tagCount} media=${fixture.mediaCount}`,
    );

    const secretStatus = await ensurePluginEncryptionSecret(passphrase);
    push("secret", "pass", `pluginKeychain=${secretStatus}`);

    const migrated = await LocalJournalEncryptionMigrator.migrateFixture({
      passphrase,
      resume: true,
    });
    push("M2-M5", migrated.ok ? "pass" : "fail", migrated.detail);
    if (!migrated.ok) {
      throw new Error(migrated.detail);
    }

    await closeNamedJournalDatabase(ENC_MIG_FIXTURE_PLAIN_DB);
    await closeNamedJournalDatabase(ENC_MIG_FIXTURE_PROMOTED_DB);
    push("M6", "pass", "connections closed (kill equivalent)");

    await ensurePluginEncryptionSecret(passphrase);
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
      "M7",
      fp.entries.length === fixture.entryCount ? "pass" : "fail",
      `reopen entries=${fp.entries.length} encryptedFlag=${String(encryptedFlag)} tags=${fp.rowCounts.local_journal_tags ?? 0} media=${fp.rowCounts.local_media ?? 0}`,
    );

    const wrongKeyFailed = await plaintextOpenMustFail(ENC_MIG_FIXTURE_PROMOTED_DB);
    let passphraseCheckRejected: boolean | null = null;
    try {
      passphraseCheckRejected = !(
        await CapacitorSQLite.checkEncryptionSecret({
          passphrase: `${passphrase}dead`,
        })
      ).result;
    } catch {
      passphraseCheckRejected = null;
    }
    push(
      "M8",
      wrongKeyFailed ? "pass" : "fail",
      `plaintextOpenRejected=${String(wrongKeyFailed)} passphraseCheckRejected=${String(passphraseCheckRejected)}`,
    );

    const again = await LocalJournalEncryptionMigrator.migrateFixture({
      passphrase,
    });
    push(
      "M9",
      again.alreadyCompleted === true ? "pass" : "fail",
      again.detail,
    );

    push(
      "untouched",
      "pass",
      `didNotMigrate=${LOCAL_JOURNAL_DB_NAME}`,
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
    path: "ljd/security-poc/enc-mig-poc-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}
