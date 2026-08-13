/**
 * Lightweight Server→Local create reconciliation (4B-4S internal PoC).
 *
 * Detects Server entries missing from Local (legacyServerId) and recovers via
 * existing outbox → GET → mirror → ack. Not a sync engine.
 * Not a B+C substitute. Not wired to production Journal UI.
 */

import type { GenerationResolveOutcome } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  enqueueBeforeMirror,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  opaqueGenerationIdFromResolved,
  type OutboxAttemptOutcome,
} from "@/lib/local-first/journal/outbox/types";
import {
  CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
  emptyCreateReconciliationCheckpoint,
  type CreateReconciliationCheckpoint,
  type CreateReconciliationCheckpointStore,
} from "@/lib/local-first/journal/reconciliation/CreateReconciliationCheckpointStore";
import { isListCapReached } from "@/lib/local-first/journal/reconciliation/journalListCaps";
import type { ServerMonthListPort } from "@/lib/local-first/journal/reconciliation/serverMonthListPort";
import {
  addUtcMonths,
  compareUtcMonthKeys,
  previousUtcMonth,
  utcMonthKeyFromDate,
  utcMonthKeysInclusive,
} from "@/lib/local-first/journal/reconciliation/utcMonth";

export const INTERNAL_CREATE_RECONCILIATION_FLAG =
  "INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION" as const;

export type MonthReconcileOutcomeCode =
  | "month_fully_reconciled"
  | "current_month_rescanned"
  | "incomplete_pending_mirror"
  | "list_cap_reached"
  | "scope_truncated"
  | "api_failed"
  | "generation_failed"
  | "bootstrap_required"
  | "noop_empty_scope"
  | "source_present_noop";

export type MonthReconcileResult = {
  month: string;
  isCurrentMonth: boolean;
  code: MonthReconcileOutcomeCode;
  serverIds: string[];
  missingIds: string[];
  recoveredIds: string[];
  alreadyPresentIds: string[];
  checkpointAdvanced: boolean;
  /** Run-local intermediate: durable outbox capture (not watermark). */
  recoveryCapturedIds: string[];
  detail: string;
};

export type ReconcileRunResult = {
  phase:
    | "completed"
    | "partial"
    | "bootstrap_required"
    | "generation_failed"
    | "rewound";
  currentMonth: string;
  targetGenerationId: string | null;
  months: MonthReconcileResult[];
  checkpointBefore: CreateReconciliationCheckpoint | null;
  checkpointAfter: CreateReconciliationCheckpoint | null;
  rewindReason: string | null;
  /** Manual / R-D style: same reconciler over explicit months. */
  explicitRange: boolean;
};

export type LocalLegacyIndexPort = {
  /** All legacyServerIds currently present in active generation (opaque set). */
  listLegacyServerIds(): Promise<Set<string>>;
  hasLegacyServerId(id: string): Promise<boolean>;
};

export type ReconcileMissingCreatesDeps = {
  serverList: ServerMonthListPort;
  localIndex: LocalLegacyIndexPort;
  outboxStore: LocalMirrorOutboxStore;
  checkpointStore: CreateReconciliationCheckpointStore;
  resolveHealthyGeneration: () => Promise<GenerationResolveOutcome>;
  /**
   * Attempt mirror for an existing outbox item (existing 4B-4I attemptOutboxMirror).
   * Injected so unit tests can use memory sinks without native SQLCipher.
   */
  attemptMirror: (itemId: string) => Promise<OutboxAttemptOutcome>;
  /** Explicit bootstrap months when checkpoint is absent or rewound. Required — no auto full history. */
  bootstrapMonths: string[];
  configuredListCap: number;
  nowUtc?: Date;
  attemptMirrorAfterEnqueue?: boolean;
  /** Re-verify lastFullyReconciledMonth against Local before trusting skip (restore safety). */
  verifyClosedMonthIntegrity?: boolean;
};

function nowIso(d?: Date): string {
  return (d ?? new Date()).toISOString();
}

function isCurrentMonth(month: string, current: string): boolean {
  return month === current;
}

async function pendingOutboxForServerIds(
  store: LocalMirrorOutboxStore,
  serverIds: string[],
  generationId: string,
): Promise<string[]> {
  const pending: string[] = [];
  for (const id of serverIds) {
    const row = await store.findByServerAndGeneration(id, generationId);
    if (row) pending.push(id);
  }
  return pending;
}

/**
 * Plan months to scan (UTC). Never invent full Server history.
 */
export function planReconciliationMonths(input: {
  currentMonth: string;
  lastFullyReconciledMonth: string | null;
  bootstrapMonths: string[];
}): { months: string[]; needsBootstrap: boolean } {
  const current = input.currentMonth;
  const prev = previousUtcMonth(current);
  if (!prev) {
    return { months: [current], needsBootstrap: false };
  }

  if (input.lastFullyReconciledMonth) {
    const start = addUtcMonths(input.lastFullyReconciledMonth, 1);
    if (!start) {
      return { months: [current], needsBootstrap: false };
    }
    if (compareUtcMonthKeys(start, current) > 0) {
      // checkpoint ahead of current — treat as unsafe; caller should rewind
      return { months: [current], needsBootstrap: false };
    }
    const past = utcMonthKeysInclusive(
      start,
      compareUtcMonthKeys(start, prev) <= 0 ? prev : start,
    ).filter((m) => m !== current);
    const months = [...past, current];
    return { months: [...new Set(months)], needsBootstrap: false };
  }

  if (!input.bootstrapMonths.length) {
    return { months: [], needsBootstrap: true };
  }
  const months = [
    ...input.bootstrapMonths.filter((m) => m !== current),
    current,
  ];
  // Always include current for rescan when bootstrapping with explicit months
  if (!months.includes(current)) months.push(current);
  return { months: [...new Set(months)], needsBootstrap: false };
}

/**
 * R-D: explicit inclusive UTC month range (same month reconciler).
 * Does not imply production full-history audit.
 */
export function planExplicitMonthRange(from: string, to: string): string[] {
  return utcMonthKeysInclusive(from, to);
}

async function rewindCheckpoint(
  store: CreateReconciliationCheckpointStore,
  reason: string,
  at: string,
): Promise<CreateReconciliationCheckpoint> {
  const next = emptyCreateReconciliationCheckpoint(at);
  next.lastAttemptAt = at;
  await store.write(next);
  return next;
}

/**
 * Restore / generation safety before trusting lastFullyReconciledMonth as skip watermark.
 */
async function sanitizeCheckpointOrRewind(
  deps: ReconcileMissingCreatesDeps,
  checkpoint: CreateReconciliationCheckpoint | null,
  currentGenId: string,
  currentMonth: string,
  at: string,
): Promise<{
  checkpoint: CreateReconciliationCheckpoint | null;
  rewound: boolean;
  reason: string | null;
}> {
  if (!checkpoint) {
    return { checkpoint: null, rewound: false, reason: null };
  }

  if (
    checkpoint.generationIdAtCompletion &&
    checkpoint.generationIdAtCompletion !== currentGenId
  ) {
    const next = await rewindCheckpoint(deps.checkpointStore, "generation_mismatch", at);
    return {
      checkpoint: next,
      rewound: true,
      reason: "generation_mismatch",
    };
  }

  const closed = checkpoint.lastFullyReconciledMonth;
  if (!closed) {
    return { checkpoint, rewound: false, reason: null };
  }

  if (compareUtcMonthKeys(closed, currentMonth) >= 0) {
    // Must never claim current (or future) month as fully reconciled
    const next = await rewindCheckpoint(
      deps.checkpointStore,
      "invalid_closed_current_or_future",
      at,
    );
    return {
      checkpoint: next,
      rewound: true,
      reason: "invalid_closed_current_or_future",
    };
  }

  const verify = deps.verifyClosedMonthIntegrity !== false;
  if (!verify) {
    return { checkpoint, rewound: false, reason: null };
  }

  const listed = await deps.serverList.listByUtcMonth(closed);
  if (!listed.ok) {
    // Fail-closed: do not advance/skip further on uncertain closed month
    const next = await rewindCheckpoint(
      deps.checkpointStore,
      "closed_month_reverify_api_failed",
      at,
    );
    return {
      checkpoint: next,
      rewound: true,
      reason: "closed_month_reverify_api_failed",
    };
  }
  if (listed.listCapReached || isListCapReached(listed.entries.length, listed.configuredCap)) {
    const next = await rewindCheckpoint(
      deps.checkpointStore,
      "closed_month_reverify_cap",
      at,
    );
    return {
      checkpoint: next,
      rewound: true,
      reason: "closed_month_reverify_cap",
    };
  }

  for (const e of listed.entries) {
    if (!(await deps.localIndex.hasLegacyServerId(e.id))) {
      const next = await rewindCheckpoint(
        deps.checkpointStore,
        "local_incompleteness_after_restore",
        at,
      );
      return {
        checkpoint: next,
        rewound: true,
        reason: "local_incompleteness_after_restore",
      };
    }
  }

  return { checkpoint, rewound: false, reason: null };
}

async function reconcileOneMonth(
  deps: ReconcileMissingCreatesDeps,
  month: string,
  currentMonth: string,
  target: ResolvedLocalJournalGeneration,
  generationId: string,
  options?: { allowCheckpointAdvance?: boolean },
): Promise<MonthReconcileResult> {
  const allowAdvance = options?.allowCheckpointAdvance !== false;
  const isCurrent = isCurrentMonth(month, currentMonth);
  const listed = await deps.serverList.listByUtcMonth(month);

  if (!listed.ok) {
    return {
      month,
      isCurrentMonth: isCurrent,
      code: "api_failed",
      serverIds: [],
      missingIds: [],
      recoveredIds: [],
      alreadyPresentIds: [],
      checkpointAdvanced: false,
      recoveryCapturedIds: [],
      detail: `${listed.code}:${listed.detail}`,
    };
  }

  if (
    listed.listCapReached ||
    isListCapReached(listed.entries.length, deps.configuredListCap)
  ) {
    return {
      month,
      isCurrentMonth: isCurrent,
      code: "list_cap_reached",
      serverIds: listed.entries.map((e) => e.id),
      missingIds: [],
      recoveredIds: [],
      alreadyPresentIds: [],
      checkpointAdvanced: false,
      recoveryCapturedIds: [],
      detail: "scope_truncated_list_cap_reached",
    };
  }

  const serverIds = listed.entries.map((e) => e.id);
  if (serverIds.length === 0) {
    // Empty past month can be marked complete (nothing to mirror)
    let checkpointAdvanced = false;
    if (!isCurrent && allowAdvance) {
      checkpointAdvanced = await maybeAdvanceCheckpoint(
        deps,
        month,
        generationId,
        true,
      );
    }
    return {
      month,
      isCurrentMonth: isCurrent,
      code: isCurrent ? "current_month_rescanned" : "month_fully_reconciled",
      serverIds,
      missingIds: [],
      recoveredIds: [],
      alreadyPresentIds: [],
      checkpointAdvanced,
      recoveryCapturedIds: [],
      detail: "empty_scope",
    };
  }

  const missingIds: string[] = [];
  const alreadyPresentIds: string[] = [];
  for (const id of serverIds) {
    if (await deps.localIndex.hasLegacyServerId(id)) {
      alreadyPresentIds.push(id);
    } else {
      missingIds.push(id);
    }
  }

  const recoveryCapturedIds: string[] = [];
  const recoveredIds: string[] = [];
  const attemptMirror = deps.attemptMirrorAfterEnqueue !== false;

  for (const serverEntryId of missingIds) {
    const enq = await enqueueBeforeMirror(
      { store: deps.outboxStore },
      { target, serverEntryId },
    );
    recoveryCapturedIds.push(serverEntryId);

    if (!attemptMirror) {
      continue;
    }

    const outcome = await deps.attemptMirror(enq.item.id);
    if (outcome.kind === "acked") {
      recoveredIds.push(serverEntryId);
    }
  }

  // Re-verify Local completeness for ALL server ids in scope
  const stillMissing: string[] = [];
  for (const id of serverIds) {
    if (!(await deps.localIndex.hasLegacyServerId(id))) {
      stillMissing.push(id);
    }
  }

  const pending = await pendingOutboxForServerIds(
    deps.outboxStore,
    stillMissing,
    generationId,
  );

  if (isCurrent) {
    return {
      month,
      isCurrentMonth: true,
      code: stillMissing.length
        ? pending.length
          ? "incomplete_pending_mirror"
          : "incomplete_pending_mirror"
        : "current_month_rescanned",
      serverIds,
      missingIds,
      recoveredIds,
      alreadyPresentIds,
      checkpointAdvanced: false,
      recoveryCapturedIds,
      detail: stillMissing.length
        ? "current_month_never_watermarked"
        : "current_month_complete_no_watermark",
    };
  }

  // Past month: advance only when Local complete AND no pending outbox for scope
  const localComplete = stillMissing.length === 0;
  const noPending = pending.length === 0;
  let checkpointAdvanced = false;
  if (localComplete && noPending && allowAdvance) {
    checkpointAdvanced = await maybeAdvanceCheckpoint(
      deps,
      month,
      generationId,
      true,
    );
  }

  return {
    month,
    isCurrentMonth: false,
    code: localComplete && noPending
      ? "month_fully_reconciled"
      : "incomplete_pending_mirror",
    serverIds,
    missingIds,
    recoveredIds,
    alreadyPresentIds,
    checkpointAdvanced,
    recoveryCapturedIds,
    detail: localComplete && noPending
      ? "local_completeness_verified"
      : `pending_or_missing:${stillMissing.join(",")}`,
  };
}

async function maybeAdvanceCheckpoint(
  deps: ReconcileMissingCreatesDeps,
  month: string,
  generationId: string,
  localComplete: boolean,
): Promise<boolean> {
  if (!localComplete) return false;
  const at = nowIso(deps.nowUtc);
  const prev =
    (await deps.checkpointStore.read()) ??
    emptyCreateReconciliationCheckpoint(at);

  // Sequential only: may set first closed month, or exactly last+1
  if (prev.lastFullyReconciledMonth) {
    if (compareUtcMonthKeys(month, prev.lastFullyReconciledMonth) <= 0) {
      await deps.checkpointStore.write({
        ...prev,
        formatVersion: CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
        generationIdAtCompletion: generationId,
        lastAttemptAt: at,
        lastCompletedAt: at,
      });
      return false;
    }
    const expected = addUtcMonths(prev.lastFullyReconciledMonth, 1);
    if (expected !== month) {
      return false;
    }
  }

  await deps.checkpointStore.write({
    formatVersion: CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
    lastFullyReconciledMonth: month,
    generationIdAtCompletion: generationId,
    lastAttemptAt: at,
    lastCompletedAt: at,
  });
  return true;
}

/**
 * Main entry: R-B style scan + current-month rescan.
 * Requires explicit bootstrapMonths when checkpoint is empty.
 */
export async function reconcileMissingServerJournalCreates(
  deps: ReconcileMissingCreatesDeps,
): Promise<ReconcileRunResult> {
  const at = nowIso(deps.nowUtc);
  const currentMonth = utcMonthKeyFromDate(deps.nowUtc ?? new Date());
  const checkpointBefore = await deps.checkpointStore.read();

  const resolved = await deps.resolveHealthyGeneration();
  if (!resolved.ok) {
    return {
      phase: "generation_failed",
      currentMonth,
      targetGenerationId: null,
      months: [],
      checkpointBefore,
      checkpointAfter: checkpointBefore,
      rewindReason: null,
      explicitRange: false,
    };
  }

  const target = resolved.target;
  const generationId = opaqueGenerationIdFromResolved(target);

  const sanitized = await sanitizeCheckpointOrRewind(
    deps,
    checkpointBefore,
    generationId,
    currentMonth,
    at,
  );

  const effectiveCp = sanitized.checkpoint;
  const lastClosed = effectiveCp?.lastFullyReconciledMonth ?? null;

  const plan = planReconciliationMonths({
    currentMonth,
    lastFullyReconciledMonth: lastClosed,
    bootstrapMonths: deps.bootstrapMonths,
  });

  if (plan.needsBootstrap) {
    await deps.checkpointStore.write({
      ...(effectiveCp ?? emptyCreateReconciliationCheckpoint(at)),
      lastAttemptAt: at,
    });
    return {
      phase: "bootstrap_required",
      currentMonth,
      targetGenerationId: generationId,
      months: [],
      checkpointBefore,
      checkpointAfter: await deps.checkpointStore.read(),
      rewindReason: sanitized.reason,
      explicitRange: false,
    };
  }

  // Touch attempt time
  await deps.checkpointStore.write({
    ...(effectiveCp ?? emptyCreateReconciliationCheckpoint(at)),
    formatVersion: CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
    lastAttemptAt: at,
  });

  const ordered = [
    ...plan.months.filter((m) => m !== currentMonth).sort(compareUtcMonthKeys),
    ...(plan.months.includes(currentMonth) ? [currentMonth] : []),
  ];

  const months: MonthReconcileResult[] = [];
  let pastAdvanceBlocked = false;
  for (const month of ordered) {
    const isCurrent = month === currentMonth;
    const result = await reconcileOneMonth(
      deps,
      month,
      currentMonth,
      target,
      generationId,
      { allowCheckpointAdvance: !isCurrent && !pastAdvanceBlocked },
    );
    months.push(result);
    if (
      !isCurrent &&
      result.code !== "month_fully_reconciled" &&
      result.code !== "noop_empty_scope"
    ) {
      pastAdvanceBlocked = true;
    }
  }

  const checkpointAfter = await deps.checkpointStore.read();
  const blocked = months.some((m) =>
    [
      "api_failed",
      "list_cap_reached",
      "scope_truncated",
      "incomplete_pending_mirror",
      "generation_failed",
    ].includes(m.code),
  );

  return {
    phase: sanitized.rewound
      ? "rewound"
      : blocked
        ? "partial"
        : "completed",
    currentMonth,
    targetGenerationId: generationId,
    months,
    checkpointBefore,
    checkpointAfter,
    rewindReason: sanitized.reason,
    explicitRange: false,
  };
}

/**
 * R-D / manual: reconcile an explicit inclusive UTC month range with the same month engine.
 */
export async function reconcileExplicitUtcMonthRange(
  deps: ReconcileMissingCreatesDeps,
  fromMonth: string,
  toMonth: string,
): Promise<ReconcileRunResult> {
  const at = nowIso(deps.nowUtc);
  const currentMonth = utcMonthKeyFromDate(deps.nowUtc ?? new Date());
  const checkpointBefore = await deps.checkpointStore.read();

  const resolved = await deps.resolveHealthyGeneration();
  if (!resolved.ok) {
    return {
      phase: "generation_failed",
      currentMonth,
      targetGenerationId: null,
      months: [],
      checkpointBefore,
      checkpointAfter: checkpointBefore,
      rewindReason: null,
      explicitRange: true,
    };
  }

  const target = resolved.target;
  const generationId = opaqueGenerationIdFromResolved(target);
  const range = planExplicitMonthRange(fromMonth, toMonth);

  await deps.checkpointStore.write({
    ...(checkpointBefore ?? emptyCreateReconciliationCheckpoint(at)),
    formatVersion: CREATE_RECONCILIATION_CHECKPOINT_FORMAT_VERSION,
    lastAttemptAt: at,
  });

  const months: MonthReconcileResult[] = [];
  for (const month of range) {
    months.push(
      await reconcileOneMonth(deps, month, currentMonth, target, generationId),
    );
  }

  return {
    phase: months.some((m) =>
      ["api_failed", "list_cap_reached", "incomplete_pending_mirror"].includes(
        m.code,
      ),
    )
      ? "partial"
      : "completed",
    currentMonth,
    targetGenerationId: generationId,
    months,
    checkpointBefore,
    checkpointAfter: await deps.checkpointStore.read(),
    rewindReason: null,
    explicitRange: true,
  };
}

/** Memory Local index for unit tests / PoC sinks. */
export function createMemoryLocalLegacyIndex(
  seedIds?: Iterable<string>,
): LocalLegacyIndexPort & { ids: Set<string>; add(id: string): void } {
  const ids = new Set(seedIds ?? []);
  return {
    ids,
    add(id) {
      ids.add(id);
    },
    async listLegacyServerIds() {
      return new Set(ids);
    },
    async hasLegacyServerId(id) {
      return ids.has(id);
    },
  };
}
