/**
 * Application orchestration: confirmed Server journal entry → Local mirror via outbox.
 *
 * Conceptual flow (4B-4L internal PoC only):
 * confirmed server entry id
 * → manifest resolve + registry validation + candidate preflight
 * → ResolvedLocalJournalGeneration
 * → outbox enqueue (durable, before mirror)
 * → canonical Server GET + mirror primitive
 * → ack on mirrored | already_present
 *
 * Server POST / donguri charge are NEVER invoked here.
 * Mirror failure does NOT roll back Server.
 * Local result is distinct from Server save success.
 *
 * Residual gap: see SERVER_SUCCESS_TO_OUTBOX_GAP in releaseBlockers.ts
 */

import {
  enqueueBeforeMirror,
  redactServerEntryIdForLog,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import type { OutboxAttemptOutcome } from "@/lib/local-first/journal/outbox/types";
import {
  attemptNativeSaveMirror,
  createNativeSaveMirrorOrchestrationDeps,
} from "@/lib/local-first/journal/save/createNativeSaveMirrorDeps";
import { canRunInternalJournalSaveMirror } from "@/lib/local-first/journal/save/internalSaveMirrorGate";
import {
  SERVER_SUCCESS_TO_OUTBOX_GAP,
  SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION,
} from "@/lib/local-first/journal/save/releaseBlockers";
import { assertSaveMirrorRoutingPreconditions } from "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions";
import type {
  ConfirmedServerJournalMirrorInput,
  ConfirmedServerJournalMirrorResult,
} from "@/lib/local-first/journal/save/types";
import { SAVE_WIRING_POC_ENTRY_ID_PATH } from "@/lib/local-first/journal/save/types";

/** Record this save's entry id for L2–L11 live PoC (gate ON only; never searches journal list). */
async function recordSaveWiringTestEntryId(serverEntryId: string): Promise<void> {
  try {
    const { Directory, Encoding, Filesystem } = await import("@capacitor/filesystem");
    await Filesystem.writeFile({
      path: SAVE_WIRING_POC_ENTRY_ID_PATH,
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: serverEntryId,
      recursive: true,
    });
  } catch {
    /* optional — live PoC helper only */
  }
}

function mapAttemptOutcome(
  serverEntryId: string,
  attempt: OutboxAttemptOutcome,
  outboxItemId: string | null,
): ConfirmedServerJournalMirrorResult {
  if (attempt.kind === "acked") {
    return {
      status: attempt.mirrorStatus,
      serverEntryId,
      outboxItemId: attempt.itemId,
    };
  }
  if (attempt.kind === "blocked") {
    return {
      status: "queued_retry",
      serverEntryId,
      outboxItemId,
      lastResult: attempt.lastResult,
      detail: attempt.detail,
    };
  }
  if (attempt.lastResult === "attention_required") {
    return {
      status: "attention_required",
      serverEntryId,
      outboxItemId: attempt.item.id,
      detail: attempt.detail,
    };
  }
  return {
    status: "queued_retry",
    serverEntryId,
    outboxItemId: attempt.item.id,
    lastResult: attempt.lastResult,
    detail: attempt.detail,
  };
}

/**
 * After Server save succeeds (`res.ok && entry.id`), optionally mirror to Local encrypted generation.
 * Fire-and-forget from UI — errors are returned, not thrown to save UX.
 */
export async function handleConfirmedServerJournalMirror(
  input: ConfirmedServerJournalMirrorInput,
): Promise<ConfirmedServerJournalMirrorResult> {
  const serverEntryId = input.serverEntryId.trim();
  if (!serverEntryId) {
    return {
      status: "routing_unavailable",
      serverEntryId: "",
      reason: "invalid_input",
      detail: "missing serverEntryId",
    };
  }

  if (!canRunInternalJournalSaveMirror()) {
    return { status: "disabled", serverEntryId };
  }

  // Capture entry id from this confirmed Server save response (not from browsing entries).
  await recordSaveWiringTestEntryId(serverEntryId);

  const routing = await assertSaveMirrorRoutingPreconditions({
    allowUnknownCapacity: true,
  });
  if (!routing.ok) {
    return {
      status: "routing_unavailable",
      serverEntryId,
      reason: routing.reason,
      detail: routing.detail,
    };
  }

  if (input.developer?.simulateCrashBeforeEnqueue) {
    return {
      status: "queued_retry",
      serverEntryId,
      outboxItemId: null,
      lastResult: "not_enqueued",
      detail: SERVER_SUCCESS_TO_OUTBOX_GAP,
    };
  }

  const opened = await openLocalMirrorOutboxSqliteStore();
  try {
    const enqueue = await enqueueBeforeMirror(
      { store: opened.store },
      {
        serverEntryId,
        target: routing.target,
      },
    );

    const deps = createNativeSaveMirrorOrchestrationDeps({
      store: opened.store,
      pinnedTarget: routing.target,
      availableBytes: routing.availableBytes,
      injectLocalFailure: input.developer?.injectLocalFailureAfterEnqueue ?? false,
    });

    const attempt = await attemptNativeSaveMirror(deps, enqueue.item.id);
    return mapAttemptOutcome(serverEntryId, attempt, enqueue.item.id);
  } finally {
    await opened.close();
  }
}

/** Non-PII log label for developer diagnostics. */
export function redactConfirmedMirrorLog(serverEntryId: string): string {
  return redactServerEntryIdForLog(serverEntryId);
}

export {
  SERVER_SUCCESS_TO_OUTBOX_GAP,
  SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION,
};
