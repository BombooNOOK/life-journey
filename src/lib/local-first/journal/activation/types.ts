/**
 * Local Journal technical activation manifest (4B-4F).
 * Pointer only — not Source-of-Truth and not general UI Repository routing.
 */

import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import { SECURE_CANDIDATE_MEDIA_ROOT } from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

export const ACTIVATION_MANIFEST_FORMAT_VERSION = 1 as const;

/** Filename under LJD Application Support (absolute path resolved at runtime). */
export const ACTIVATION_MANIFEST_FILE_NAME = "ljd-local-journal-activation.json" as const;

/**
 * Storage generation for the encrypted candidate (NOT PRAGMA user_version).
 * Rename of DB file is intentionally not performed this phase.
 */
export const TECHNICAL_CANDIDATE_GENERATION = 2 as const;

export const TECHNICAL_ACTIVE_DATABASE_ID =
  LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;

export const TECHNICAL_ACTIVE_MEDIA_ROOT_ID = SECURE_CANDIDATE_MEDIA_ROOT;

export const EXPECTED_JOURNAL_SCHEMA_VERSION = 1 as const;

export type ActivationState =
  | "inactive"
  | "activating"
  | "active"
  | "rollback_pending";

export type LocalJournalActivationManifest = {
  formatVersion: typeof ACTIVATION_MANIFEST_FORMAT_VERSION;
  generation: number;
  activeDatabaseId: string;
  activeMediaRootId: string;
  previousDatabaseId: string | null;
  previousMediaRootId: string | null;
  activationState: ActivationState;
  schemaVersion: number;
  activatedAt: string | null;
  checksum: string;
};

/** Body used for checksum — checksum field itself excluded. */
export type ManifestChecksumBody = Omit<LocalJournalActivationManifest, "checksum">;

export type ActivationResultCode =
  | "activated"
  | "already_active"
  | "preflight_failed"
  | "manifest_corrupt"
  | "target_missing"
  | "rollback_preserved"
  | "capacity_unknown"
  | "rejected_target"
  | "native_only";

export type TechnicalResolveStatus =
  | "no_activation"
  | "ready"
  | "corrupt_manifest"
  | "missing_database"
  | "preflight_failed"
  | "checksum_mismatch"
  | "unknown_format"
  | "rejected_target";

export type ManifestReadStatus =
  | "missing"
  | "ok"
  | "corrupt_json"
  | "checksum_mismatch"
  | "unknown_format"
  | "invalid_shape";

export function assertAllowedTechnicalDatabaseId(databaseId: string): void {
  if (databaseId === LOCAL_JOURNAL_DB_NAME) {
    throw new Error("production plaintext DB cannot be technical-active target");
  }
  if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
    throw new Error(`technical activation allows only ${TECHNICAL_ACTIVE_DATABASE_ID}`);
  }
}

export function isAllowedTechnicalDatabaseId(databaseId: string): boolean {
  return databaseId === TECHNICAL_ACTIVE_DATABASE_ID;
}
