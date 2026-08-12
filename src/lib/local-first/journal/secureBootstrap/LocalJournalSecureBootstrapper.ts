/**
 * Fresh encrypted Local Journal candidate bootstrap.
 * Does not touch ljd_local_journal. Not imported from product app boot.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, type SQLiteDBConnection } from "@capacitor-community/sqlite";

import {
  applyFoundationSchema,
  LOCAL_JOURNAL_EXPECTED_TABLES,
  readUserVersion,
} from "@/lib/local-first/journal/database";
import { classifyCandidateHealth } from "@/lib/local-first/journal/secureBootstrap/candidateHealth";
import type {
  SecureBootstrapResult,
  SecureCandidateInspection,
} from "@/lib/local-first/journal/secureBootstrap/types";
import {
  LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME,
  SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES,
} from "@/lib/local-first/journal/secureBootstrap/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  applyCompleteFileProtection,
  decideCapacityKnown,
  ensurePathIncludedInBackup,
  ensurePluginEncryptionSecret,
  inspectFileProtection,
  inspectPluginDbKeyAccessibility,
  isCompleteProtection,
  listSqliteArtifactsReadOnly,
  openNamedEncryptedDatabase,
  closeNamedEncryptedDatabase,
  readAvailableBytesOrNull,
  resolveLjdApplicationSupportDir,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "secure bootstrap is native-only");
  }
}

function assertNotProductionJournal(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "secure bootstrap refuses ljd_local_journal",
    );
  }
}

function randomPassphrase(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function candidateFileName(dbName: string): string {
  return `${dbName}SQLite.db`;
}

async function resolveCandidatePath(): Promise<{
  absolutePath: string;
  locationRelative: string;
}> {
  const asDir = await resolveLjdApplicationSupportDir();
  return {
    absolutePath: `${asDir.ljdApplicationSupportDir}/${candidateFileName(
      LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME,
    )}`,
    locationRelative: `${asDir.pluginRelativeLocation}/${candidateFileName(
      LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME,
    )}`,
  };
}

async function readEncryptedFlag(name: string): Promise<boolean | null> {
  try {
    return Boolean(
      (await CapacitorSQLite.isDatabaseEncrypted({ database: name })).result,
    );
  } catch {
    return null;
  }
}

async function inventory(db: SQLiteDBConnection): Promise<{
  userVersion: number;
  tables: string[];
  columns: Record<string, string[]>;
  rowCounts: Record<string, number>;
}> {
  const userVersion = await readUserVersion(db);
  const tablesResult = await db.query(
    `SELECT name FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name;`,
  );
  const tables = (tablesResult.values ?? []).map((row) => String(row.name));
  const columns: Record<string, string[]> = {};
  const rowCounts: Record<string, number> = {};
  for (const table of tables) {
    const info = await db.query(`PRAGMA table_info(${table});`);
    columns[table] = (info.values ?? []).map((row) => String(row.name));
    const count = await db.query(`SELECT COUNT(*) AS c FROM ${table};`);
    rowCounts[table] = Number(
      (count.values?.[0] as Record<string, unknown> | undefined)?.c ?? 0,
    );
  }
  return { userVersion, tables, columns, rowCounts };
}

async function candidateExistsOnDisk(): Promise<boolean> {
  const artifacts = await listSqliteArtifactsReadOnly();
  const file = candidateFileName(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME);
  return artifacts.some((item) => item.name === file);
}

export const LocalJournalSecureBootstrapper = {
  async inspect(): Promise<SecureCandidateInspection> {
    assertNative();
    const dbName = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
    assertNotProductionJournal(dbName);
    const exists = await candidateExistsOnDisk();
    let encrypted = exists ? await readEncryptedFlag(dbName) : null;
    const path = await resolveCandidatePath();
    let userVersion: number | null = null;
    let tables: string[] = [];
    let rowCounts: Record<string, number> = {};
    let columns: Record<string, string[]> | undefined;
    if (exists && encrypted === true) {
      try {
        const db = await openNamedEncryptedDatabase(dbName, 1);
        const inv = await inventory(db);
        await closeNamedEncryptedDatabase(dbName);
        userVersion = inv.userVersion;
        tables = inv.tables;
        rowCounts = inv.rowCounts;
        columns = inv.columns;
      } catch {
        encrypted = null;
      }
    }
    let backupExcluded: SecureCandidateInspection["backupExcluded"] = null;
    let fileProtection: string | null = null;
    let completeProtection: boolean | null = null;
    if (exists) {
      try {
        const attrs = await inspectFileProtection(path.absolutePath);
        backupExcluded = attrs.isExcludedFromBackup;
        fileProtection = String(attrs.fileProtection);
        completeProtection = isCompleteProtection(fileProtection);
      } catch {
        backupExcluded = "api_unavailable";
      }
    }
    const health = classifyCandidateHealth({
      exists,
      encrypted,
      userVersion,
      tables,
      columns,
    });
    return {
      dbName,
      exists,
      encrypted,
      userVersion,
      tables,
      rowCounts,
      backupExcluded,
      fileProtection,
      completeProtection,
      locationRelative: path.locationRelative,
      health,
    };
  },

  async bootstrap(options?: {
    availableBytes?: number | null;
    allowUnknownCapacity?: boolean;
    passphrase?: string;
  }): Promise<SecureBootstrapResult> {
    assertNative();
    const dbName = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
    assertNotProductionJournal(dbName);

    let availableBytes: number | null;
    if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
      availableBytes = options.availableBytes ?? null;
    } else {
      availableBytes = (await readAvailableBytesOrNull()).availableBytes;
    }
    const known = decideCapacityKnown(availableBytes);
    if (!known.known && options?.allowUnknownCapacity !== true) {
      return {
        ok: false,
        status: "blocked",
        dbName,
        detail: "capacity_unknown_fail_closed",
        pluginKeychain: null,
      };
    }
    if (
      known.known &&
      known.availableBytes != null &&
      known.availableBytes < SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES
    ) {
      return {
        ok: false,
        status: "blocked",
        dbName,
        detail: "insufficient_free_space",
        pluginKeychain: null,
      };
    }

    const current = await LocalJournalSecureBootstrapper.inspect();
    if (current.health.status === "abnormal") {
      return {
        ok: false,
        status: "abnormal",
        dbName,
        detail: `fail_closed:${current.health.reason}`,
        encrypted: current.encrypted,
        userVersion: current.userVersion,
        rowCounts: current.rowCounts,
        pluginKeychain: null,
      };
    }
    if (current.health.status === "ready") {
      return {
        ok: true,
        status: "already_ready",
        alreadyReady: true,
        dbName,
        detail: "existing encrypted candidate is ready; left untouched",
        encrypted: current.encrypted,
        userVersion: current.userVersion,
        rowCounts: current.rowCounts,
        pluginKeychain: "reused_existing",
      };
    }

    try {
      const pluginKeychain = await ensurePluginEncryptionSecret(
        options?.passphrase ?? randomPassphrase(),
      );
      const db = await openNamedEncryptedDatabase(dbName, 1);
      await applyFoundationSchema(db);
      const inv = await inventory(db);
      const health = classifyCandidateHealth({
        exists: true,
        encrypted: true,
        userVersion: inv.userVersion,
        tables: inv.tables,
        columns: inv.columns,
      });
      await closeNamedEncryptedDatabase(dbName);
      if (health.status !== "ready") {
        return {
          ok: false,
          status: "abnormal",
          dbName,
          detail: `created_but_unhealthy:${health.reason}`,
          pluginKeychain,
        };
      }
      const zero =
        LOCAL_JOURNAL_EXPECTED_TABLES.every((table) => (inv.rowCounts[table] ?? 0) === 0);
      if (!zero) {
        return {
          ok: false,
          status: "abnormal",
          dbName,
          detail: "fresh_bootstrap_expected_zero_rows",
          rowCounts: inv.rowCounts,
          pluginKeychain,
        };
      }

      const path = await resolveCandidatePath();
      await ensurePathIncludedInBackup(path.absolutePath);
      await applyCompleteFileProtection(path.absolutePath);

      return {
        ok: true,
        status: "created",
        dbName,
        detail: `created encrypted candidate keychain=${pluginKeychain}`,
        encrypted: true,
        userVersion: inv.userVersion,
        rowCounts: inv.rowCounts,
        pluginKeychain,
      };
    } catch (error) {
      return {
        ok: false,
        status: "abnormal",
        dbName,
        detail: safeErrorMessage(error),
        pluginKeychain: null,
      };
    }
  },

  async inspectKeychainAvailable(): Promise<boolean> {
    try {
      const kc = await inspectPluginDbKeyAccessibility();
      return kc.found === true;
    } catch {
      return false;
    }
  },
};
