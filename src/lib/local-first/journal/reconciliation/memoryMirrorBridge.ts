/**
 * Test / PoC helpers for lightweight create reconciliation (memory only).
 */

import {
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
} from "@/lib/local-first/journal/activation/types";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  enqueueBeforeMirror,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import type { OutboxAttemptOutcome } from "@/lib/local-first/journal/outbox/types";
import type { LocalLegacyIndexPort } from "@/lib/local-first/journal/reconciliation/reconcileMissingServerJournalCreates";

export function technicalActiveTarget(
  checksum = "4b4s_checksum",
): ResolvedLocalJournalGeneration {
  return {
    generation: TECHNICAL_CANDIDATE_GENERATION,
    databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    manifestChecksum: checksum,
  };
}

/**
 * Memory mirror: on attempt, add serverEntryId to Local index and ack-remove outbox.
 * Models successful GET→mirror→ack without SQLCipher.
 */
export function createMemoryAttemptMirror(input: {
  outboxStore: LocalMirrorOutboxStore;
  localIndex: LocalLegacyIndexPort & { add(id: string): void };
  /** Fail mirror for these server entry ids (leave pending). */
  failServerIds?: Set<string>;
  /** Simulate source_changed — should not overwrite; for create recon we only call for missing. */
  refuseOverwrite?: boolean;
}): (itemId: string) => Promise<OutboxAttemptOutcome> {
  return async (itemId) => {
    const item = await input.outboxStore.getById(itemId);
    if (!item) {
      return {
        kind: "blocked",
        lastResult: "failed",
        item: null,
        detail: "outbox_item_missing",
      };
    }
    if (input.failServerIds?.has(item.serverEntryId)) {
      const updated = await input.outboxStore.updateAttempt({
        id: item.id,
        lastResult: "retry_needed",
        lastAttemptAt: new Date().toISOString(),
        incrementRetry: true,
      });
      return {
        kind: "retained",
        lastResult: "retry_needed",
        item: updated,
        detail: "injected_mirror_failure",
      };
    }
    if (await input.localIndex.hasLegacyServerId(item.serverEntryId)) {
      await input.outboxStore.ackRemove(item.id);
      return {
        kind: "acked",
        mirrorStatus: "already_present",
        itemId: item.id,
      };
    }
    input.localIndex.add(item.serverEntryId);
    await input.outboxStore.ackRemove(item.id);
    return {
      kind: "acked",
      mirrorStatus: "mirrored",
      itemId: item.id,
    };
  };
}

/** Enqueue-only path for tests that assert capture without mirror. */
export async function enqueueOnly(
  outboxStore: LocalMirrorOutboxStore,
  target: ResolvedLocalJournalGeneration,
  serverEntryId: string,
) {
  return enqueueBeforeMirror({ store: outboxStore }, { target, serverEntryId });
}
