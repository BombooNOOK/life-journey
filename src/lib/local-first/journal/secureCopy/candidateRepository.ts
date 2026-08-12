/**
 * Repository bound to the encrypted candidate connection only.
 * Does not change JournalRepository / ljd_local_journal.
 */

import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import {
  countActiveEntriesSql,
  countMediaSql,
  countTagsSql,
  getJournalByIdSql,
  getJournalByLegacyServerIdSql,
  saveJournalEntrySql,
} from "@/lib/local-first/journal/journalRepositorySql";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";
import type { JournalRepositoryPort } from "@/lib/local-first/journal/secureCopy/types";
import { SERVER_COPY_TARGET_DB_NAME } from "@/lib/local-first/journal/secureCopy/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import {
  closeNamedEncryptedDatabase,
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

export function createCandidateRepository(
  db: SQLiteDBConnection,
): JournalRepositoryPort {
  return {
    async save(entry: LocalJournalEntry): Promise<void> {
      await db.execute("BEGIN;");
      try {
        await saveJournalEntrySql(db, entry);
        await db.execute("COMMIT;");
      } catch (error) {
        try {
          await db.execute("ROLLBACK;");
        } catch {
          /* */
        }
        throw error;
      }
    },
    getById: (stableId) => getJournalByIdSql(db, stableId),
    getByLegacyServerId: (legacyServerId) =>
      getJournalByLegacyServerIdSql(db, legacyServerId),
    countEntries: () => countActiveEntriesSql(db),
    countTags: () => countTagsSql(db),
    countMedia: () => countMediaSql(db),
  };
}

export async function withCandidateRepository<T>(
  fn: (repo: JournalRepositoryPort) => Promise<T>,
): Promise<T> {
  assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
  const health = await LocalJournalSecureBootstrapper.inspect();
  if (health.health.status !== "ready") {
    throw new Error(`candidate not ready: ${health.health.reason ?? health.health.status}`);
  }
  const db = await openNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME, 1);
  try {
    return await fn(createCandidateRepository(db));
  } finally {
    await closeNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME);
  }
}
