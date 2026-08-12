/**
 * Manual developer foreground retry for pending internal save mirror outbox rows.
 * serverEntryId → canonical GET → pinned generation → mirror → ack.
 * Never re-invokes Server create API or donguri charge.
 */

import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import {
  attemptNativeSaveMirror,
  createNativeSaveMirrorOrchestrationDeps,
} from "@/lib/local-first/journal/save/createNativeSaveMirrorDeps";
import { canRunInternalJournalSaveMirror } from "@/lib/local-first/journal/save/internalSaveMirrorGate";
import { assertSaveMirrorRoutingPreconditions } from "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions";
import type {
  ConfirmedServerJournalMirrorResult,
  RetryPendingServerJournalMirrorInput,
} from "@/lib/local-first/journal/save/types";
import { handleConfirmedServerJournalMirror } from "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror";

export async function retryPendingServerJournalMirror(
  input: RetryPendingServerJournalMirrorInput,
): Promise<ConfirmedServerJournalMirrorResult> {
  if (!canRunInternalJournalSaveMirror()) {
    return {
      status: "disabled",
      serverEntryId: input.serverEntryId ?? "",
    };
  }

  const routing = await assertSaveMirrorRoutingPreconditions({
    allowUnknownCapacity: true,
  });
  if (!routing.ok) {
    return {
      status: "routing_unavailable",
      serverEntryId: input.serverEntryId ?? "",
      reason: routing.reason,
      detail: routing.detail,
    };
  }

  const opened = await openLocalMirrorOutboxSqliteStore();
  try {
    let itemId = input.outboxItemId?.trim();
    if (!itemId && input.serverEntryId?.trim()) {
      const pending = await opened.store.listPending();
      const match = pending.find(
        (row) => row.serverEntryId === input.serverEntryId?.trim(),
      );
      itemId = match?.id;
    }
    if (!itemId) {
      return {
        status: "routing_unavailable",
        serverEntryId: input.serverEntryId ?? "",
        reason: "outbox_item_missing",
        detail: "no pending row for retry",
      };
    }

    const item = await opened.store.getById(itemId);
    if (!item) {
      return {
        status: "routing_unavailable",
        serverEntryId: input.serverEntryId ?? "",
        reason: "outbox_item_missing",
        detail: itemId,
      };
    }

    const deps = createNativeSaveMirrorOrchestrationDeps({
      store: opened.store,
      pinnedTarget: routing.target,
      availableBytes: routing.availableBytes,
      injectLocalFailure: input.injectLocalFailure ?? false,
    });

    const attempt = await attemptNativeSaveMirror(deps, itemId);
    if (attempt.kind === "acked") {
      return {
        status: attempt.mirrorStatus,
        serverEntryId: item.serverEntryId,
        outboxItemId: attempt.itemId,
      };
    }
    if (attempt.kind === "blocked") {
      return {
        status: "queued_retry",
        serverEntryId: item.serverEntryId,
        outboxItemId: itemId,
        lastResult: attempt.lastResult,
        detail: attempt.detail,
      };
    }
    if (attempt.lastResult === "attention_required") {
      return {
        status: "attention_required",
        serverEntryId: item.serverEntryId,
        outboxItemId: item.id,
        detail: attempt.detail,
      };
    }
    return {
      status: "queued_retry",
      serverEntryId: item.serverEntryId,
      outboxItemId: item.id,
      lastResult: attempt.lastResult,
      detail: attempt.detail,
    };
  } finally {
    await opened.close();
  }
}

export { handleConfirmedServerJournalMirror };
