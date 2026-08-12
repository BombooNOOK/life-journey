/**
 * Allowlisted cleanup of encryption-migration temporary DBs + SQLite sidecars.
 * Never deletes ljd_local_journal or the plaintext fixture source.
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { LjdLocalSecurity } from "ljd-local-security";

import { closeNamedJournalDatabase } from "@/lib/local-first/journal/database";
import {
  ENC_MIG_FIXTURE_PLAIN_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
  ENC_MIG_FIXTURE_STAGING_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export const ENC_MIG_DELETABLE_LOGICAL_NAMES = [
  ENC_MIG_FIXTURE_STAGING_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
] as const;

export type EncMigDeletableLogicalName =
  (typeof ENC_MIG_DELETABLE_LOGICAL_NAMES)[number];

export type EncMigArtifactRole =
  | "production_journal"
  | "fixture_source"
  | "fixture_staging"
  | "fixture_promoted"
  | "sidecar_wal"
  | "sidecar_shm"
  | "sidecar_journal"
  | "other_sqlite";

export type EncMigCleanupIntent = "success" | "failure" | "rollback";

export type EncMigArtifact = {
  name: string;
  bytes: number;
  role: EncMigArtifactRole | string;
};

export function isProductionJournalName(name: string): boolean {
  return name === LOCAL_JOURNAL_DB_NAME || name.includes(LOCAL_JOURNAL_DB_NAME);
}

export function isProtectedSourceName(name: string): boolean {
  return name === ENC_MIG_FIXTURE_PLAIN_DB || name.includes(ENC_MIG_FIXTURE_PLAIN_DB);
}

export function isAllowlistedDeletableName(
  name: string,
): name is EncMigDeletableLogicalName {
  return (ENC_MIG_DELETABLE_LOGICAL_NAMES as readonly string[]).includes(name);
}

export function sqliteSidecarFileNames(logicalName: string): string[] {
  const base = `${logicalName}SQLite.db`;
  return [base, `${base}-wal`, `${base}-shm`, `${base}-journal`];
}

export function classifyArtifactRole(fileName: string): EncMigArtifactRole {
  if (fileName.includes(LOCAL_JOURNAL_DB_NAME)) return "production_journal";
  if (fileName.includes(ENC_MIG_FIXTURE_PLAIN_DB)) return "fixture_source";
  if (fileName.includes(ENC_MIG_FIXTURE_STAGING_DB)) return "fixture_staging";
  if (fileName.includes(ENC_MIG_FIXTURE_PROMOTED_DB)) return "fixture_promoted";
  if (fileName.endsWith("-wal") || fileName.includes(".db-wal")) return "sidecar_wal";
  if (fileName.endsWith("-shm") || fileName.includes(".db-shm")) return "sidecar_shm";
  if (fileName.includes("-journal")) return "sidecar_journal";
  return "other_sqlite";
}

export function namesForCleanupIntent(
  intent: EncMigCleanupIntent,
  phase?: "not_started" | "staging" | "verified" | "promoted" | "failed",
): EncMigDeletableLogicalName[] {
  if (intent === "success") return [ENC_MIG_FIXTURE_STAGING_DB];
  if (intent === "rollback" && phase === "promoted") {
    return [ENC_MIG_FIXTURE_STAGING_DB];
  }
  return [ENC_MIG_FIXTURE_STAGING_DB, ENC_MIG_FIXTURE_PROMOTED_DB];
}

function assertDeletable(name: string): asserts name is EncMigDeletableLogicalName {
  if (isProductionJournalName(name)) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "cleanup refuses ljd_local_journal",
    );
  }
  if (isProtectedSourceName(name)) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "cleanup refuses plaintext fixture source",
    );
  }
  if (!isAllowlistedDeletableName(name)) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "cleanup refuses names outside the fixture allowlist",
    );
  }
}

export async function listEncryptionMigrationArtifacts(): Promise<EncMigArtifact[]> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "artifact inventory is native-only");
  }
  const listing = await LjdLocalSecurity.listSqliteArtifactsInLjdDir();
  return listing.artifacts.map((item) => ({
    name: item.name,
    bytes: Number(item.bytes) || 0,
    role: item.role || classifyArtifactRole(item.name),
  }));
}

export async function cleanupAllowlistedDatabase(logicalName: string): Promise<{
  logicalName: string;
  deleted: string[];
}> {
  assertDeletable(logicalName);
  await closeNamedJournalDatabase(logicalName);
  try {
    await CapacitorSQLite.closeConnection({ database: logicalName, readonly: false });
  } catch {
    /* already closed */
  }
  try {
    await CapacitorSQLite.deleteDatabase({ database: logicalName });
  } catch {
    /* plugin may not know an encrypted leftover; FileManager follows */
  }
  const native = await LjdLocalSecurity.deleteAllowlistedSqliteArtifacts({
    logicalName,
  });
  return { logicalName, deleted: native.deleted ?? [] };
}

export async function cleanupTemporaryMigrationArtifacts(
  intent: EncMigCleanupIntent,
  phase?: "not_started" | "staging" | "verified" | "promoted" | "failed",
): Promise<{ deleted: string[]; targets: EncMigDeletableLogicalName[] }> {
  const targets = namesForCleanupIntent(intent, phase);
  const deleted: string[] = [];
  for (const name of targets) {
    const result = await cleanupAllowlistedDatabase(name);
    deleted.push(...result.deleted);
  }
  return { deleted, targets };
}

export function countArtifactsByRole(
  artifacts: EncMigArtifact[],
  role: EncMigArtifactRole,
): number {
  return artifacts.filter((item) => item.role === role || classifyArtifactRole(item.name) === role)
    .length;
}
