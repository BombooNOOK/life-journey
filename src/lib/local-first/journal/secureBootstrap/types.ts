/**
 * Non-active encrypted Local Journal candidate.
 * Not the production repository target. Not a schema version.
 */
export const LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME =
  "ljd_local_journal_secure_candidate" as const;

/** PoC floor for empty DB create. Not a product-final reserve. */
export const SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES = 256 * 1024;

export type SecureBootstrapStatus =
  | "created"
  | "already_ready"
  | "abnormal"
  | "blocked";

export type CandidateHealthStatus = "missing" | "ready" | "abnormal";

export type CandidateHealth = {
  status: CandidateHealthStatus;
  reason: string | null;
};

export type SecureBootstrapResult = {
  ok: boolean;
  status: SecureBootstrapStatus;
  dbName: typeof LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
  detail: string;
  alreadyReady?: boolean;
  encrypted?: boolean | null;
  userVersion?: number | null;
  rowCounts?: Record<string, number>;
  pluginKeychain?: "set" | "reused_existing" | null;
};

export type SecureCandidateInspection = {
  dbName: typeof LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
  exists: boolean;
  encrypted: boolean | null;
  userVersion: number | null;
  tables: string[];
  rowCounts: Record<string, number>;
  backupExcluded: boolean | "unset" | "api_unavailable" | null;
  fileProtection: string | null;
  completeProtection: boolean | null;
  locationRelative: string | null;
  health: CandidateHealth;
};