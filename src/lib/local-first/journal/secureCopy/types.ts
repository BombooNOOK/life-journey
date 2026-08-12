import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

/** Only allowed write target for Server→Local copy this phase. */
export const SERVER_COPY_TARGET_DB_NAME = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;

/** Candidate-only media namespace. Activation-time final path is undecided. */
export const SECURE_CANDIDATE_MEDIA_ROOT = "ljd/media/journal-secure-candidate" as const;

/** PoC floor only. Not a product-final reserve. */
export const SECURE_COPY_MIN_AVAILABLE_BYTES = 1024 * 1024;

/** Explicit-ID PoC cap. Not a product bulk limit. */
export const SECURE_COPY_MAX_EXPLICIT_IDS = 20;

export const TEST_PURPOSE_TAGS = [
  "#テスト",
  "#お引越しテスト",
  "#LocalCopyTest",
] as const;

export const FAILURE_INJECTION_MISSING_ENTRY_ID = "ljd-poc-missing-entry-id" as const;

export type CopyEntryStatus =
  | "copied"
  | "already_present"
  | "source_changed"
  | "failed";

export type SourceFingerprint = {
  legacyServerId: string;
  serverUpdatedAt: string;
  contentHash: string;
  tags: string[];
  photoHash: string | null;
  mediaCount: number;
};

export type CopyEntryResult = {
  status: CopyEntryStatus;
  serverId: string;
  stableId: string | null;
  legacyServerId: string | null;
  detail: string;
  fingerprint: SourceFingerprint | null;
};

export type CopyBatchResult = {
  ok: boolean;
  targetDb: typeof SERVER_COPY_TARGET_DB_NAME;
  copied: number;
  alreadyPresent: number;
  sourceChanged: number;
  failed: number;
  results: CopyEntryResult[];
  blockedReason: string | null;
  candidateEncrypted: boolean | null;
  completeProtection: boolean | null;
  backupExcluded: boolean | "unset" | "api_unavailable" | null;
  rowCounts: {
    entries: number;
    tags: number;
    media: number;
  } | null;
};

export type JournalRepositoryPort = {
  save(entry: LocalJournalEntry): Promise<void>;
  getById(stableId: string): Promise<LocalJournalEntry | null>;
  getByLegacyServerId(legacyServerId: string): Promise<LocalJournalEntry | null>;
  countEntries(): Promise<number>;
  countTags(): Promise<number>;
  countMedia(): Promise<number>;
};

export type CandidateMediaPort = {
  root: string;
  write(fileName: string, base64: string): Promise<string>;
  readBase64(relativePath: string): Promise<string>;
  delete(relativePath: string): Promise<void>;
};
