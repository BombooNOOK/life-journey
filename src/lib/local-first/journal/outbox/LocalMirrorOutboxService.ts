/**
 * Outbox orchestration: enqueue-before-mirror, pinned generation, manual retry.
 * Never calls Server create / donguri charge. GET + Local mirror only.
 * Not wired to production Journal save UI.
 */

import {
  assertDbMediaPairIntegrity,
  isPlaintextProductionDatabaseId,
  type ResolvedLocalJournalGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  opaqueGenerationIdFromResolved,
  type EnqueueResult,
  type LocalMirrorOutboxItem,
  type OutboxAttemptOutcome,
  type OutboxLastResult,
} from "@/lib/local-first/journal/outbox/types";
import {
  mirrorServerJournalEntryToLocalGeneration,
  type MirrorPrimitiveDeps,
} from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import type { MirrorEntryResult } from "@/lib/local-first/journal/secureCopy/types";

/** Helper for tests / PoC: bind mirror primitive without holding outbox open. */
export function createRunMirrorFromPrimitiveDeps(mirrorDeps: MirrorPrimitiveDeps): {
  runMirror: OutboxOrchestrationDeps["runMirror"];
  peekLastFetchCode: () => string | null;
} {
  let lastFetchCode: string | null = null;
  return {
    peekLastFetchCode: () => lastFetchCode,
    async runMirror(serverEntryId, availableBytes) {
      lastFetchCode = null;
      return mirrorServerJournalEntryToLocalGeneration(
        serverEntryId,
        {
          ...mirrorDeps,
          fetchEntry: async (id) => {
            const fetched = await mirrorDeps.fetchEntry(id);
            lastFetchCode = fetched.ok ? null : fetched.code;
            return fetched;
          },
        },
        availableBytes,
      );
    },
  };
}

export type ResolvePinnedGeneration = () => Promise<
  | { ok: true; target: ResolvedLocalJournalGeneration }
  | { ok: false; reason: string; detail: string }
>;

export type OutboxOrchestrationDeps = {
  store: LocalMirrorOutboxStore;
  resolvePinnedGeneration: ResolvePinnedGeneration;
  /**
   * Runs Server GET + Local mirror. Must open/close candidate DB itself
   * (do not nest with outbox SQLite connections).
   */
  runMirror: (
    serverEntryId: string,
    availableBytes: number | null,
  ) => Promise<MirrorEntryResult>;
  availableBytes?: number | null;
  now?: () => string;
  /**
   * Optional: capture last Server fetch code for source_missing classification.
   * Prefer implementing inside runMirror via wrapping fetchEntry.
   */
  peekLastFetchCode?: () => string | null;
};

export function redactServerEntryIdForLog(serverEntryId: string): string {
  if (serverEntryId.length <= 8) return "[id]";
  return `${serverEntryId.slice(0, 4)}…${serverEntryId.slice(-4)}`;
}

export function targetIdentityMatchesItem(
  item: LocalMirrorOutboxItem,
  target: ResolvedLocalJournalGeneration,
): boolean {
  return (
    item.targetGenerationId === opaqueGenerationIdFromResolved(target) &&
    item.targetDatabaseId === target.databaseId &&
    item.targetMediaRootId === target.mediaRootId &&
    item.targetSchemaVersion === target.schemaVersion
  );
}

/**
 * Future production order (first candidate):
 * Server success → resolve → enqueue → mirror → ack
 *
 * Enqueue happens BEFORE mirror so crash between Server OK and mirror
 * cannot lose the pending row.
 */
export async function enqueueBeforeMirror(
  deps: Pick<OutboxOrchestrationDeps, "store">,
  input: {
    serverEntryId: string;
    target: ResolvedLocalJournalGeneration;
    now?: string;
    id?: string;
  },
): Promise<EnqueueResult> {
  if (isPlaintextProductionDatabaseId(input.target.databaseId)) {
    throw new Error("plaintext_forbidden");
  }
  assertDbMediaPairIntegrity(input.target);
  return deps.store.enqueue({
    serverEntryId: input.serverEntryId,
    target: input.target,
    now: input.now,
    id: input.id,
  });
}

function classifyFetchFailure(
  result: MirrorEntryResult,
  lastFetchCode: string | null,
): OutboxLastResult {
  if (lastFetchCode === "NOT_FOUND") return "source_missing";
  if (result.status === "source_changed") return "attention_required";
  if (result.status === "failed" && result.needsRetry) return "retry_needed";
  if (result.status === "failed") return "failed";
  return "failed";
}

/**
 * Attempt mirror for an existing outbox row.
 * - Pins to enqueue-time generation identity
 * - Requires live resolve/preflight success (snapshot is not a fallback open table)
 * - Silent retarget to a different active generation is forbidden
 */
export async function attemptOutboxMirror(
  deps: OutboxOrchestrationDeps,
  itemId: string,
): Promise<OutboxAttemptOutcome> {
  const now = deps.now?.() ?? new Date().toISOString();
  const item = await deps.store.getById(itemId);
  if (!item) {
    return {
      kind: "blocked",
      lastResult: "failed",
      item: null,
      detail: "outbox_item_missing",
    };
  }

  if (isPlaintextProductionDatabaseId(item.targetDatabaseId)) {
    const updated = await deps.store.updateAttempt({
      id: item.id,
      lastResult: "failed",
      lastAttemptAt: now,
      incrementRetry: true,
    });
    return {
      kind: "blocked",
      lastResult: "failed",
      item: updated,
      detail: "plaintext_forbidden",
    };
  }

  const resolved = await deps.resolvePinnedGeneration();
  if (!resolved.ok) {
    // Fail-closed: do not open DB from outbox snapshot alone.
    const updated = await deps.store.updateAttempt({
      id: item.id,
      lastResult: "target_unavailable",
      lastAttemptAt: now,
      incrementRetry: true,
    });
    return {
      kind: "retained",
      lastResult: "target_unavailable",
      item: updated,
      detail: `${resolved.reason}:${resolved.detail}`,
    };
  }

  // Identity check before any open/write. Snapshot is not a fallback routing table;
  // a different live target must not be used (no silent retarget).
  if (!targetIdentityMatchesItem(item, resolved.target)) {
    const updated = await deps.store.updateAttempt({
      id: item.id,
      lastResult: "generation_changed",
      lastAttemptAt: now,
      incrementRetry: true,
    });
    return {
      kind: "retained",
      lastResult: "generation_changed",
      item: updated,
      detail: "silent_retarget_forbidden",
    };
  }

  try {
    assertDbMediaPairIntegrity(resolved.target);
  } catch (error) {
    const updated = await deps.store.updateAttempt({
      id: item.id,
      lastResult: "target_unavailable",
      lastAttemptAt: now,
      incrementRetry: true,
    });
    return {
      kind: "retained",
      lastResult: "target_unavailable",
      item: updated,
      detail: String(error),
    };
  }

  let lastFetchCode: string | null = null;
  const mirrored = await deps.runMirror(
    item.serverEntryId,
    deps.availableBytes ?? null,
  );
  if (deps.peekLastFetchCode) {
    lastFetchCode = deps.peekLastFetchCode();
  }

  if (mirrored.status === "mirrored" || mirrored.status === "already_present") {
    await deps.store.updateAttempt({
      id: item.id,
      lastResult: mirrored.status,
      lastAttemptAt: now,
      incrementRetry: true,
    });
    await deps.store.ackRemove(item.id);
    return {
      kind: "acked",
      mirrorStatus: mirrored.status,
      itemId: item.id,
    };
  }

  const lastResult = classifyFetchFailure(mirrored, lastFetchCode);
  const updated = await deps.store.updateAttempt({
    id: item.id,
    lastResult,
    lastAttemptAt: now,
    incrementRetry: true,
  });

  return {
    kind: "retained",
    lastResult: lastResult as Exclude<
      OutboxLastResult,
      null | "mirrored" | "already_present"
    >,
    item: updated,
    detail: mirrored.detail,
  };
}

/**
 * Developer orchestration for one Server entry after a simulated Server success:
 * resolve → enqueue → mirror → ack|retain
 */
export async function orchestrateEnqueueThenMirror(
  deps: OutboxOrchestrationDeps,
  serverEntryId: string,
): Promise<{
  enqueue: EnqueueResult | null;
  attempt: OutboxAttemptOutcome;
  /** True when enqueue completed and mirror has not been started (caller can stop here). */
  enqueuedBeforeMirror: true;
}> {
  const resolved = await deps.resolvePinnedGeneration();
  if (!resolved.ok) {
    return {
      enqueue: null,
      enqueuedBeforeMirror: true,
      attempt: {
        kind: "blocked",
        lastResult: "target_unavailable",
        item: null,
        detail: `${resolved.reason}:${resolved.detail}`,
      },
    };
  }

  const enqueue = await enqueueBeforeMirror(deps, {
    serverEntryId,
    target: resolved.target,
  });

  const attempt = await attemptOutboxMirror(deps, enqueue.item.id);
  return { enqueue, attempt, enqueuedBeforeMirror: true };
}

export const LocalMirrorOutboxService = {
  enqueueBeforeMirror,
  attemptOutboxMirror,
  orchestrateEnqueueThenMirror,
  redactServerEntryIdForLog,
  targetIdentityMatchesItem,
};
