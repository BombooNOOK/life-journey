/**
 * Explicit Local Journal encryption migration service.
 * Not imported from app startup / Web / Neon / 森ログ.
 * 4B-3F: fixture DBs only — refuses ljd_local_journal.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, type SQLiteDBConnection } from "@capacitor-community/sqlite";

import {
  applyFoundationSchema,
  closeNamedJournalDatabase,
  openNamedPlaintextJournalDatabase,
} from "@/lib/local-first/journal/database";
import { mediaRefsExist } from "@/lib/local-first/journal/encryptionMigration/audit";
import {
  estimateMigrationDiskNeed,
  hasEnoughDiskForMigration,
} from "@/lib/local-first/journal/encryptionMigration/diskGuard";
import {
  compareFingerprints,
  fingerprintJournal,
  inventoryJournalTables,
} from "@/lib/local-first/journal/encryptionMigration/fingerprint";
import {
  canExplicitResume,
  createInitialState,
  readMigrationState,
  shouldNoOp,
  writeMigrationState,
} from "@/lib/local-first/journal/encryptionMigration/stateStore";
import type {
  EncryptionMigrationState,
  MigrationStepResult,
} from "@/lib/local-first/journal/encryptionMigration/types";
import {
  ENC_MIG_FIXTURE_PLAIN_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
  ENC_MIG_FIXTURE_STAGING_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  ensurePluginEncryptionSecret,
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security/encryptedDatabase";
import { safeErrorMessage } from "@/lib/local-first/security/noSecretLog";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "encryption migrator is native-only");
  }
}

function assertNotProductionJournal(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "4B-3F refuses to migrate ljd_local_journal; fixture DBs only",
    );
  }
}

function randomPassphrase(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deleteNamedDatabase(name: string): Promise<void> {
  assertNotProductionJournal(name);
  await closeNamedJournalDatabase(name);
  try {
    await CapacitorSQLite.deleteDatabase({ database: name });
  } catch {
    /* missing */
  }
}

type JournalRowSnapshot = {
  entries: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  media: Record<string, unknown>[];
};

async function readJournalRows(source: SQLiteDBConnection): Promise<JournalRowSnapshot> {
  const entries = await source.query(`SELECT * FROM local_journal_entries;`);
  const tags = await source.query(`SELECT * FROM local_journal_tags;`);
  const media = await source.query(`SELECT * FROM local_media;`);
  return {
    entries: (entries.values ?? []) as Record<string, unknown>[],
    tags: (tags.values ?? []) as Record<string, unknown>[],
    media: (media.values ?? []) as Record<string, unknown>[],
  };
}

async function writeJournalRows(
  target: SQLiteDBConnection,
  rows: JournalRowSnapshot,
): Promise<void> {
  await applyFoundationSchema(target);
  await target.execute(`
    DELETE FROM local_media;
    DELETE FROM local_journal_tags;
    DELETE FROM local_journal_entries;
  `);

  for (const r of rows.entries) {
    await target.run(
      `INSERT INTO local_journal_entries (
        stable_id, date_key, title, content, created_at, updated_at,
        tags_json, schema_version, source, local_status, imported_at, legacy_server_id,
        server_updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
      [
        r.stable_id,
        r.date_key,
        r.title,
        r.content,
        r.created_at,
        r.updated_at,
        r.tags_json,
        r.schema_version,
        r.source,
        r.local_status,
        r.imported_at ?? null,
        r.legacy_server_id ?? null,
        r.server_updated_at ?? null,
      ],
    );
  }

  for (const r of rows.tags) {
    await target.run(
      `INSERT INTO local_journal_tags (journal_stable_id, tag) VALUES (?, ?);`,
      [r.journal_stable_id, r.tag],
    );
  }

  for (const r of rows.media) {
    await target.run(
      `INSERT INTO local_media (
        stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
      ) VALUES (?,?,?,?,?,?,?);`,
      [
        r.stable_id,
        r.journal_stable_id,
        r.type,
        r.relative_path,
        r.created_at,
        r.checksum ?? null,
        r.mime_type ?? null,
      ],
    );
  }
}

export const LocalJournalEncryptionMigrator = {
  async status(): Promise<EncryptionMigrationState> {
    return readMigrationState();
  },

  async rollbackStaging(reason = "explicit_rollback"): Promise<MigrationStepResult> {
    assertNative();
    const state = await readMigrationState();
    assertNotProductionJournal(state.sourceDb);
    await deleteNamedDatabase(state.stagingDb);
    await deleteNamedDatabase(state.promotedDb);
    const next = createInitialState({
      ...state,
      phase: "failed",
      lastError: reason,
      sourcePreserved: true,
    });
    await writeMigrationState(next);
    return {
      ok: true,
      phase: "failed",
      detail: `rollback complete; source ${state.sourceDb} preserved`,
    };
  },

  /**
   * Explicit developer/resume entry. Never called from app boot.
   * Source plaintext is never deleted or overwritten.
   */
  async migrateFixture(options?: {
    availableBytes?: number | null;
    resume?: boolean;
    /** In-memory only. Never written to state/logs. */
    passphrase?: string;
  }): Promise<MigrationStepResult> {
    assertNative();
    const sourceDb = ENC_MIG_FIXTURE_PLAIN_DB;
    const stagingDb = ENC_MIG_FIXTURE_STAGING_DB;
    const promotedDb = ENC_MIG_FIXTURE_PROMOTED_DB;
    assertNotProductionJournal(sourceDb);
    assertNotProductionJournal(stagingDb);
    assertNotProductionJournal(promotedDb);

    let state = await readMigrationState();
    if (shouldNoOp(state.phase)) {
      return {
        ok: true,
        phase: "promoted",
        alreadyCompleted: true,
        detail: "already migrated (promoted); no-op",
      };
    }
    if (!options?.resume && canExplicitResume(state.phase) && state.phase !== "not_started") {
      return {
        ok: false,
        phase: state.phase,
        detail: `incomplete phase=${state.phase}; pass resume:true or rollback`,
      };
    }

    try {
      const source = await openNamedPlaintextJournalDatabase(sourceDb);
      const inventory = await inventoryJournalTables(source);
      const sourceFp = await fingerprintJournal(source);
      const rows = await readJournalRows(source);
      await closeNamedJournalDatabase(sourceDb);

      const sourceBytes = Math.max(
        32_768,
        (inventory.rowCounts.local_journal_entries ?? 0) * 2048,
      );
      const disk = hasEnoughDiskForMigration(sourceBytes, options?.availableBytes ?? null);
      if (!disk.ok) {
        throw new Error(`disk_guard:${disk.reason}`);
      }

      state = createInitialState({
        sourceDb,
        stagingDb,
        promotedDb,
        phase: "staging",
        lastError: null,
      });
      await writeMigrationState(state);

      await deleteNamedDatabase(stagingDb);
      await ensurePluginEncryptionSecret(options?.passphrase ?? randomPassphrase());
      const staging = await openNamedEncryptedDatabase(stagingDb, 1);
      await writeJournalRows(staging, rows);

      const stagingFp = await fingerprintJournal(staging);
      const compared = compareFingerprints(sourceFp, stagingFp);
      await closeNamedJournalDatabase(stagingDb);
      if (!compared.ok) {
        throw new Error(`verify_mismatch:${compared.mismatches.join(",")}`);
      }

      const mediaPaths = sourceFp.entries.flatMap((e) =>
        e.media.map((m) => m.relativePath),
      );
      const mediaPresence = await mediaRefsExist(mediaPaths);
      const missingMedia = mediaPresence.filter((m) => !m.exists).map((m) => m.path);

      state = { ...state, phase: "verified", lastError: null };
      await writeMigrationState(state);

      await deleteNamedDatabase(promotedDb);
      const promoted = await openNamedEncryptedDatabase(promotedDb, 1);
      await writeJournalRows(promoted, rows);

      const promotedFp = await fingerprintJournal(promoted);
      const promotedCmp = compareFingerprints(sourceFp, promotedFp);
      await closeNamedJournalDatabase(promotedDb);
      if (!promotedCmp.ok) {
        throw new Error(`promote_mismatch:${promotedCmp.mismatches.join(",")}`);
      }

      await deleteNamedDatabase(stagingDb);

      state = { ...state, phase: "promoted", lastError: null };
      await writeMigrationState(state);

      return {
        ok: true,
        phase: "promoted",
        detail: [
          `verified+promoted fixture`,
          `entries=${sourceFp.entries.length}`,
          `diskNeed=${estimateMigrationDiskNeed(sourceBytes).recommendedFreeBytes}`,
          missingMedia.length ? `mediaMissing=${missingMedia.length}` : "mediaRefsPresent",
        ].join(" "),
      };
    } catch (error) {
      const message = safeErrorMessage(error);
      await writeMigrationState(
        createInitialState({
          sourceDb,
          stagingDb,
          promotedDb,
          phase: "failed",
          lastError: message,
        }),
      );
      return { ok: false, phase: "failed", detail: message };
    }
  },
};
