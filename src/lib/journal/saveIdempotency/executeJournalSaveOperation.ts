/**
 * Domain service: Server Journal save-operation idempotency core (4B-4N).
 *
 * Not wired to production POST /api/journal.
 * Unique(userId, saveOperationId) is the final defence against dual claim.
 * Checkpoint CAS + orphan entry delete limits dual create under concurrent resume.
 *
 * Donguri: when the same journalEntryId is reused, existing entry:{id} ledger
 * dedup prevents re-charge (mirrors production chargeDiarySaveAcorns).
 *
 * Photo (code audit): production create path updates the same entry via
 * resolveJournalEntryPhotoDbFields + prisma.journalEntry.update. Retry on the
 * same entryId overwrites photo fields — treated as safe for identical fingerprint;
 * not assumed safe across incompatible fingerprints (conflict path).
 */

import type {
  ExecuteJournalSaveOperationOutcome,
  GetJournalSaveOperationResult,
  JournalSaveOperationCheckpoint,
  JournalSaveOperationRecord,
  JournalSaveOperationRequest,
  JournalSaveSideEffectPorts,
  JournalSaveOperationStore,
  SaveOperationId,
} from "@/lib/journal/saveIdempotency/types";

function isoNow(ports: JournalSaveSideEffectPorts): string {
  return ports.now?.() ?? new Date().toISOString();
}

function assertFingerprintMatch(
  row: JournalSaveOperationRecord,
  requestFingerprint: string,
): boolean {
  return row.requestFingerprint === requestFingerprint;
}

export async function getJournalSaveOperationResult(
  store: JournalSaveOperationStore,
  input: { userId: string; saveOperationId: SaveOperationId },
): Promise<GetJournalSaveOperationResult> {
  const row = await store.findByUserAndOperationId(
    input.userId,
    input.saveOperationId,
  );
  if (!row) return { status: "not_found" };
  // Cross-user isolation: lookup is scoped by userId in the store key.
  if (row.status === "completed" && row.journalEntryId) {
    return {
      status: "completed",
      journalEntryId: row.journalEntryId,
      resultCode: row.resultCode,
    };
  }
  if (row.status === "failed_final") {
    return {
      status: "failed_final",
      resultCode: row.resultCode,
      journalEntryId: row.journalEntryId,
    };
  }
  return { status: "processing", checkpoint: row.checkpoint };
}

/**
 * Execute or resume a save operation.
 *
 * Concurrent duplicates: unique claim → loser observes existing row.
 * Completed / failed_final short-circuit. Processing resumes with CAS so only
 * one transition wins; orphaned entry creates are deleted.
 *
 * Policy for "other executor mid-flight": CAS failure re-reads; if still
 * processing without convergence this call may return processing (no unbounded wait).
 */
export async function executeJournalSaveOperation(
  store: JournalSaveOperationStore,
  ports: JournalSaveSideEffectPorts,
  request: JournalSaveOperationRequest,
): Promise<ExecuteJournalSaveOperationOutcome> {
  const existing = await store.findByUserAndOperationId(
    request.userId,
    request.saveOperationId,
  );

  if (existing) {
    return handleExisting(store, ports, request, existing);
  }

  const now = isoNow(ports);
  const claim = await store.tryInsertClaim({
    id: ports.createRowId?.(),
    userId: request.userId,
    saveOperationId: request.saveOperationId,
    status: "processing",
    checkpoint: "claimed",
    journalEntryId: null,
    requestFingerprint: request.requestFingerprint,
    resultCode: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  if (!claim.created) {
    return handleExisting(store, ports, request, claim.row);
  }

  return resumeProcessing(store, ports, request, claim.row);
}

async function handleExisting(
  store: JournalSaveOperationStore,
  ports: JournalSaveSideEffectPorts,
  request: JournalSaveOperationRequest,
  existing: JournalSaveOperationRecord,
): Promise<ExecuteJournalSaveOperationOutcome> {
  if (!assertFingerprintMatch(existing, request.requestFingerprint)) {
    return {
      kind: "idempotency_conflict",
      detail: "same_operation_id_incompatible_fingerprint",
    };
  }
  if (existing.status === "completed" && existing.journalEntryId) {
    return {
      kind: "completed",
      journalEntryId: existing.journalEntryId,
      reusedExisting: true,
      donguriCharged: false,
      donguriAlreadyCharged: true,
    };
  }
  if (existing.status === "failed_final") {
    return {
      kind: "failed_final",
      resultCode:
        (existing.resultCode as "ACORN_INSUFFICIENT" | "INTERNAL") ??
        "INTERNAL",
      journalEntryId: existing.journalEntryId,
    };
  }
  return resumeProcessing(store, ports, request, existing);
}

async function resumeProcessing(
  store: JournalSaveOperationStore,
  ports: JournalSaveSideEffectPorts,
  request: JournalSaveOperationRequest,
  row: JournalSaveOperationRecord,
): Promise<ExecuteJournalSaveOperationOutcome> {
  if (!assertFingerprintMatch(row, request.requestFingerprint)) {
    return {
      kind: "idempotency_conflict",
      detail: "same_operation_id_incompatible_fingerprint",
    };
  }

  let current = row;
  let donguriCharged = false;
  let donguriAlreadyCharged = false;
  let createdEntryThisCall = false;

  const reload = async (): Promise<JournalSaveOperationRecord | null> => {
    return store.findByUserAndOperationId(
      request.userId,
      request.saveOperationId,
    );
  };

  // --- entry create (CAS claimed → entry_created) ---
  if (current.checkpoint === "claimed" && !current.journalEntryId) {
    const created = await ports.createJournalEntry({
      userId: request.userId,
      entryDate: request.entryDate,
      saveOperationId: request.saveOperationId,
    });
    createdEntryThisCall = true;
    const cas = await store.compareAndSet({
      userId: request.userId,
      saveOperationId: request.saveOperationId,
      expectedCheckpoint: "claimed",
      expectedJournalEntryId: null,
      patch: {
        journalEntryId: created.journalEntryId,
        checkpoint: "entry_created",
        updatedAt: isoNow(ports),
      },
    });
    if (!cas.ok) {
      // Lost race: another resume already attached an entry — drop orphan.
      await ports.deleteJournalEntry(created.journalEntryId);
      createdEntryThisCall = false;
      const latest = await reload();
      if (!latest) {
        return {
          kind: "processing",
          checkpoint: "claimed",
          detail: "operation_missing_after_cas_loss",
        };
      }
      if (latest.status === "completed" && latest.journalEntryId) {
        return {
          kind: "completed",
          journalEntryId: latest.journalEntryId,
          reusedExisting: true,
          donguriCharged: false,
          donguriAlreadyCharged: true,
        };
      }
      current = latest;
    } else {
      current = cas.row;
    }
  }

  if (!current.journalEntryId) {
    // Another executor may still be creating; do not unbounded-wait.
    return {
      kind: "processing",
      checkpoint: current.checkpoint,
      detail: "entry_not_yet_attached",
    };
  }

  const entryId = current.journalEntryId;

  // --- photo (CAS entry_created → photo_completed) ---
  if (current.checkpoint === "entry_created") {
    await ports.applyPhoto({
      journalEntryId: entryId,
      hasPhoto: request.hasPhoto,
    });
    const cas = await store.compareAndSet({
      userId: request.userId,
      saveOperationId: request.saveOperationId,
      expectedCheckpoint: "entry_created",
      expectedJournalEntryId: entryId,
      patch: {
        checkpoint: "photo_completed",
        updatedAt: isoNow(ports),
      },
    });
    if (cas.ok) {
      current = cas.row;
    } else {
      const latest = await reload();
      if (!latest) {
        return {
          kind: "processing",
          checkpoint: "entry_created",
          detail: "operation_missing_after_photo",
        };
      }
      current = latest;
    }
  }

  // --- donguri (CAS photo_completed → donguri_settled) ---
  if (current.checkpoint === "photo_completed") {
    const charge = await ports.chargeDonguri({
      userId: request.userId,
      journalEntryId: entryId,
    });
    if (charge.insufficient) {
      await ports.deleteJournalEntry(entryId);
      const casFail = await store.compareAndSet({
        userId: request.userId,
        saveOperationId: request.saveOperationId,
        expectedCheckpoint: "photo_completed",
        expectedJournalEntryId: entryId,
        patch: {
          status: "failed_final",
          resultCode: "ACORN_INSUFFICIENT",
          journalEntryId: null,
          checkpoint: "completed",
          completedAt: isoNow(ports),
          updatedAt: isoNow(ports),
        },
      });
      if (casFail.ok) {
        return {
          kind: "failed_final",
          resultCode: "ACORN_INSUFFICIENT",
          journalEntryId: null,
        };
      }
      const latest = await reload();
      if (latest?.status === "failed_final") {
        return {
          kind: "failed_final",
          resultCode:
            (latest.resultCode as "ACORN_INSUFFICIENT" | "INTERNAL") ??
            "ACORN_INSUFFICIENT",
          journalEntryId: latest.journalEntryId,
        };
      }
      return {
        kind: "processing",
        checkpoint: latest?.checkpoint ?? "photo_completed",
        detail: "insufficient_cas_lost",
      };
    }
    donguriCharged = charge.charged;
    donguriAlreadyCharged = charge.alreadyCharged;
    const cas = await store.compareAndSet({
      userId: request.userId,
      saveOperationId: request.saveOperationId,
      expectedCheckpoint: "photo_completed",
      expectedJournalEntryId: entryId,
      patch: {
        checkpoint: "donguri_settled",
        updatedAt: isoNow(ports),
      },
    });
    if (cas.ok) {
      current = cas.row;
    } else {
      const latest = await reload();
      if (!latest) {
        return {
          kind: "processing",
          checkpoint: "photo_completed",
          detail: "operation_missing_after_donguri",
        };
      }
      current = latest;
      // Charge may have succeeded for this entry; ledger dedup covers re-entry.
      donguriAlreadyCharged = true;
    }
  }

  // --- mark completed (N4: charge done, completed mark pending) ---
  if (current.checkpoint === "donguri_settled" && current.status !== "completed") {
    // Re-check charge so N4 converges without a second debit when ledger has entry:{id}.
    const charge = await ports.chargeDonguri({
      userId: request.userId,
      journalEntryId: entryId,
    });
    donguriAlreadyCharged = charge.alreadyCharged || donguriAlreadyCharged;
    donguriCharged = charge.charged || donguriCharged;
    if (charge.insufficient) {
      await store.compareAndSet({
        userId: request.userId,
        saveOperationId: request.saveOperationId,
        expectedCheckpoint: "donguri_settled",
        expectedJournalEntryId: entryId,
        patch: {
          status: "failed_final",
          resultCode: "INTERNAL",
          checkpoint: "completed",
          completedAt: isoNow(ports),
          updatedAt: isoNow(ports),
        },
      });
      return {
        kind: "failed_final",
        resultCode: "INTERNAL",
        journalEntryId: entryId,
      };
    }
    const cas = await store.compareAndSet({
      userId: request.userId,
      saveOperationId: request.saveOperationId,
      expectedCheckpoint: "donguri_settled",
      expectedJournalEntryId: entryId,
      patch: {
        status: "completed",
        checkpoint: "completed",
        resultCode: "OK",
        completedAt: isoNow(ports),
        journalEntryId: entryId,
        updatedAt: isoNow(ports),
      },
    });
    if (cas.ok) {
      current = cas.row;
    } else {
      const latest = await reload();
      if (latest?.status === "completed" && latest.journalEntryId) {
        return {
          kind: "completed",
          journalEntryId: latest.journalEntryId,
          reusedExisting: !createdEntryThisCall,
          donguriCharged: false,
          donguriAlreadyCharged: true,
        };
      }
      return {
        kind: "processing",
        checkpoint: latest?.checkpoint ?? "donguri_settled",
        detail: "completed_mark_cas_lost",
      };
    }
  }

  if (current.status === "completed" && current.journalEntryId) {
    return {
      kind: "completed",
      journalEntryId: current.journalEntryId,
      reusedExisting: !createdEntryThisCall && current.checkpoint === "completed",
      donguriCharged,
      donguriAlreadyCharged,
    };
  }

  if (current.status === "failed_final") {
    return {
      kind: "failed_final",
      resultCode:
        (current.resultCode as "ACORN_INSUFFICIENT" | "INTERNAL") ?? "INTERNAL",
      journalEntryId: current.journalEntryId,
    };
  }

  return {
    kind: "processing",
    checkpoint: current.checkpoint,
    detail: "not_converged",
  };
}

/** Advance checkpoint labels for fixture crash injection (tests). */
export function checkpointOrder(): JournalSaveOperationCheckpoint[] {
  return [
    "claimed",
    "entry_created",
    "photo_completed",
    "donguri_settled",
    "completed",
  ];
}
