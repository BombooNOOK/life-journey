/**
 * Server Journal save-operation idempotency (4B-4N PoC).
 * Domain types only — not wired to production POST /api/journal.
 * Does not store content / photo / secrets.
 */

/** Client-generated opaque id for one "save to forest" operation (ULID etc.). */
export type SaveOperationId = string;

export type JournalSaveOperationStatus =
  | "processing"
  | "completed"
  | "failed_final";

/**
 * Crash-resume checkpoint. Minimal set so retry can skip completed side effects.
 * Not a goal to grow status enums for their own sake.
 */
export type JournalSaveOperationCheckpoint =
  | "claimed"
  | "entry_created"
  | "photo_completed"
  | "donguri_settled"
  | "completed";

export type JournalSaveOperationResultCode =
  | "OK"
  | "ACORN_INSUFFICIENT"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL"
  | null;

export type JournalSaveOperationRecord = {
  id: string;
  /**
   * Auth identity for unique scope.
   * Production JournalEntry keys by email (+ profileId on create).
   * PoC unique first candidate: (userId, saveOperationId) where userId is viewer email.
   * Profile scoping may be folded into userId or added as a third unique component later.
   */
  userId: string;
  saveOperationId: SaveOperationId;
  status: JournalSaveOperationStatus;
  checkpoint: JournalSaveOperationCheckpoint;
  journalEntryId: string | null;
  /** Non-PII request fingerprint (hashes only). */
  requestFingerprint: string;
  resultCode: JournalSaveOperationResultCode;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

/** Payload for the save steps — never persisted on the operation row. */
export type JournalSaveOperationRequest = {
  userId: string;
  saveOperationId: SaveOperationId;
  /** Opaque fingerprint: contentHash|entryDate|photoIdentity — no raw body. */
  requestFingerprint: string;
  entryDate: string;
  hasPhoto: boolean;
};

export type GetJournalSaveOperationResult =
  | { status: "not_found" }
  | { status: "processing"; checkpoint: JournalSaveOperationCheckpoint }
  | {
      status: "completed";
      journalEntryId: string;
      resultCode: JournalSaveOperationResultCode;
    }
  | {
      status: "failed_final";
      resultCode: JournalSaveOperationResultCode;
      journalEntryId: string | null;
    };

export type ExecuteJournalSaveOperationOutcome =
  | {
      kind: "completed";
      journalEntryId: string;
      reusedExisting: boolean;
      donguriCharged: boolean;
      donguriAlreadyCharged: boolean;
    }
  | {
      kind: "failed_final";
      resultCode: Exclude<JournalSaveOperationResultCode, null | "OK">;
      journalEntryId: string | null;
    }
  | {
      kind: "processing";
      checkpoint: JournalSaveOperationCheckpoint;
      detail: string;
    }
  | {
      kind: "idempotency_conflict";
      detail: string;
    };

/** Ports — production route not wired; harness / future adapter. */
export type JournalSaveSideEffectPorts = {
  createJournalEntry: (input: {
    userId: string;
    entryDate: string;
    saveOperationId: SaveOperationId;
  }) => Promise<{ journalEntryId: string }>;
  /**
   * Photo apply for an existing entry. Must be safe to retry on the same entry
   * (overwrite same photo fields). Not assumed idempotent across different photos.
   */
  applyPhoto: (input: {
    journalEntryId: string;
    hasPhoto: boolean;
  }) => Promise<void>;
  /**
   * Donguri charge keyed by journalEntryId (mirrors entry:{id} ledger dedup).
   * Same entryId retry → alreadyCharged; must not create a second charge.
   */
  chargeDonguri: (input: {
    userId: string;
    journalEntryId: string;
  }) => Promise<{
    charged: boolean;
    alreadyCharged: boolean;
    insufficient: boolean;
  }>;
  /** Compensating delete used today when charge insufficient after create. */
  deleteJournalEntry: (journalEntryId: string) => Promise<void>;
  now?: () => string;
  createRowId?: () => string;
};

export type JournalSaveOperationStore = {
  findByUserAndOperationId(
    userId: string,
    saveOperationId: SaveOperationId,
  ): Promise<JournalSaveOperationRecord | null>;
  /**
   * Insert processing/claimed row. Must honor unique(userId, saveOperationId).
   * Returns existing row when unique conflict (caller re-reads).
   */
  tryInsertClaim(
    row: Omit<JournalSaveOperationRecord, "id"> & { id?: string },
  ): Promise<
    | { created: true; row: JournalSaveOperationRecord }
    | { created: false; row: JournalSaveOperationRecord }
  >;
  update(row: JournalSaveOperationRecord): Promise<JournalSaveOperationRecord>;
  /**
   * Compare-and-swap: apply patch only when expected checkpoint (+ optional entryId) match.
   * Final defence alongside unique(userId, saveOperationId) for concurrent resume.
   */
  compareAndSet(input: {
    userId: string;
    saveOperationId: SaveOperationId;
    expectedCheckpoint: JournalSaveOperationCheckpoint;
    expectedJournalEntryId?: string | null;
    patch: Partial<JournalSaveOperationRecord>;
  }): Promise<
    | { ok: true; row: JournalSaveOperationRecord }
    | { ok: false; row: JournalSaveOperationRecord | null }
  >;
};
