import { describe, expect, it } from "vitest";

import {
  classifyArtifactRole,
  isAllowlistedDeletableName,
  isProductionJournalName,
  isProtectedSourceName,
  namesForCleanupIntent,
  sqliteSidecarFileNames,
} from "@/lib/local-first/journal/encryptionMigration/artifactCleanup";
import {
  ENC_MIG_FIXTURE_PLAIN_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
  ENC_MIG_FIXTURE_STAGING_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

describe("encryption migration artifact cleanup policy", () => {
  it("protects the production journal name", () => {
    expect(isProductionJournalName(LOCAL_JOURNAL_DB_NAME)).toBe(true);
    expect(isProductionJournalName(`${LOCAL_JOURNAL_DB_NAME}SQLite.db`)).toBe(true);
    expect(isAllowlistedDeletableName(LOCAL_JOURNAL_DB_NAME)).toBe(false);
  });

  it("protects the plaintext fixture source", () => {
    expect(isProtectedSourceName(ENC_MIG_FIXTURE_PLAIN_DB)).toBe(true);
    expect(isAllowlistedDeletableName(ENC_MIG_FIXTURE_PLAIN_DB)).toBe(false);
  });

  it("allowlists only staging and promoted fixture names", () => {
    expect(isAllowlistedDeletableName(ENC_MIG_FIXTURE_STAGING_DB)).toBe(true);
    expect(isAllowlistedDeletableName(ENC_MIG_FIXTURE_PROMOTED_DB)).toBe(true);
    expect(isAllowlistedDeletableName("ljd_storage_location_poc")).toBe(false);
  });

  it("lists sqlite sidecars for a logical name", () => {
    const files = sqliteSidecarFileNames(ENC_MIG_FIXTURE_STAGING_DB);
    expect(files).toContain(`${ENC_MIG_FIXTURE_STAGING_DB}SQLite.db`);
    expect(files).toContain(`${ENC_MIG_FIXTURE_STAGING_DB}SQLite.db-wal`);
    expect(files).toContain(`${ENC_MIG_FIXTURE_STAGING_DB}SQLite.db-shm`);
  });

  it("classifies roles without reading content", () => {
    expect(classifyArtifactRole("ljd_enc_mig_fixture_plainSQLite.db")).toBe("fixture_source");
    expect(classifyArtifactRole("ljd_enc_mig_fixture_stagingSQLite.db-wal")).toBe(
      "fixture_staging",
    );
    expect(classifyArtifactRole("ljd_local_journalSQLite.db")).toBe("production_journal");
  });

  it("success cleanup targets staging only", () => {
    expect(namesForCleanupIntent("success")).toEqual([ENC_MIG_FIXTURE_STAGING_DB]);
  });

  it("failure and rollback (non-promoted) clean staging and promoted", () => {
    expect(namesForCleanupIntent("failure")).toEqual([
      ENC_MIG_FIXTURE_STAGING_DB,
      ENC_MIG_FIXTURE_PROMOTED_DB,
    ]);
    expect(namesForCleanupIntent("rollback", "staging")).toEqual([
      ENC_MIG_FIXTURE_STAGING_DB,
      ENC_MIG_FIXTURE_PROMOTED_DB,
    ]);
  });

  it("rollback after promote does not delete the promoted candidate", () => {
    expect(namesForCleanupIntent("rollback", "promoted")).toEqual([
      ENC_MIG_FIXTURE_STAGING_DB,
    ]);
  });

  it("cleanup target lists are idempotent", () => {
    expect(namesForCleanupIntent("success")).toEqual(namesForCleanupIntent("success"));
    expect(namesForCleanupIntent("failure")).toEqual(namesForCleanupIntent("failure"));
  });
});
