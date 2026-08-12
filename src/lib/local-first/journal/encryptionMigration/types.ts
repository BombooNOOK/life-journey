export const ENC_MIG_FIXTURE_PLAIN_DB = "ljd_enc_mig_fixture_plain" as const;
export const ENC_MIG_FIXTURE_STAGING_DB = "ljd_enc_mig_fixture_staging" as const;
export const ENC_MIG_FIXTURE_PROMOTED_DB = "ljd_enc_mig_fixture_promoted" as const;
export const ENC_MIG_FIXTURE_MARKER = "LJD_ENC_MIG_FIXTURE" as const;

export type EncryptionMigrationPhase =
  | "not_started"
  | "staging"
  | "verified"
  | "promoted"
  | "failed";

export type EncryptionMigrationState = {
  phase: EncryptionMigrationPhase;
  sourceDb: string;
  stagingDb: string;
  promotedDb: string;
  updatedAt: string;
  lastError: string | null;
  sourcePreserved: true;
  secretStoredInLog: false;
};

export type JournalTableInventory = {
  userVersion: number;
  tables: string[];
  rowCounts: Record<string, number>;
  columns: Record<string, string[]>;
};

export type EntryFingerprint = {
  stableId: string;
  legacyServerId: string | null;
  dateKey: string;
  contentHash: string;
  tags: string[];
  media: Array<{
    stableId: string;
    relativePath: string;
    type: string;
    checksum: string | null;
    mimeType: string | null;
  }>;
};

export type MigrationFingerprint = {
  userVersion: number;
  tables: string[];
  rowCounts: Record<string, number>;
  columns: Record<string, string[]>;
  entries: EntryFingerprint[];
};

export type DiskSpaceEstimate = {
  sourceBytes: number;
  recommendedFreeBytes: number;
  multiplier: number;
};

export type MigrationStepResult = {
  ok: boolean;
  phase: EncryptionMigrationPhase;
  detail: string;
  alreadyCompleted?: boolean;
};
