/**
 * Independent lightweight create-reconciliation checkpoint (4B-4S).
 * Not mixed into activation manifest / generation registry / mirror outbox.
 * No journal body / photo / secrets.
 */

export const CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION = 1 as const;

export type CreateReconciliationCheckpoint = {
  formatVersion: typeof CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION;
  /** Last past UTC month fully verified in Local (`YYYY-MM`). Never current month. */
  lastFullyReconciledMonth: string | null;
  /** Opaque generation id at last successful past-month completion. */
  generationIdAtCompletion: string | null;
  lastAttemptAt: string | null;
  lastCompletedAt: string | null;
};

export type CreateReconciliationCheckpointStore = {
  read(): Promise<CreateReconciliationCheckpoint | null>;
  write(next: CreateReconciliationCheckpoint): Promise<void>;
  clear(): Promise<void>;
};

export function emptyCreateReconciliationCheckpoint(
  nowIso?: string,
): CreateReconciliationCheckpoint {
  return {
    formatVersion: CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
    lastFullyReconciledMonth: null,
    generationIdAtCompletion: null,
    lastAttemptAt: nowIso ?? null,
    lastCompletedAt: null,
  };
}

export function createMemoryCreateReconciliationCheckpointStore(
  seed?: CreateReconciliationCheckpoint | null,
): CreateReconciliationCheckpointStore & {
  /** Shared cell for kill/relaunch / restore fixtures. */
  cell: { value: CreateReconciliationCheckpoint | null };
} {
  const cell: { value: CreateReconciliationCheckpoint | null } = {
    value: seed ? { ...seed } : null,
  };
  return {
    cell,
    async read() {
      return cell.value ? { ...cell.value } : null;
    },
    async write(next) {
      cell.value = { ...next };
    },
    async clear() {
      cell.value = null;
    },
  };
}

/** Fields forbidden in checkpoint persistence. */
export const CHECKPOINT_FORBIDDEN_KEYS = [
  "content",
  "body",
  "photo",
  "photoBase64",
  "photoDataUrl",
  "passphrase",
  "password",
  "secret",
  "email",
] as const;
