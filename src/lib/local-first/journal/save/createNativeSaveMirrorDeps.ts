/**
 * Native mirror + outbox deps for internal save wiring (4B-4L).
 * Mirror primitive does not read manifest/registry — routing happens in application layer.
 */

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  attemptOutboxMirror,
  type OutboxOrchestrationDeps,
  type ResolvePinnedGeneration,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { assertSaveMirrorRoutingPreconditions } from "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import { mirrorServerJournalEntryToLocalGeneration } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import type { MirrorEntryResult } from "@/lib/local-first/journal/secureCopy/types";
import {
  downloadJournalPhotoBase64,
  fetchAuthenticatedJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";

export function createResolvePinnedGenerationForSaveMirror(
  cached?: ResolvedLocalJournalGeneration,
): ResolvePinnedGeneration {
  return async () => {
    const preflight = await assertSaveMirrorRoutingPreconditions({
      allowUnknownCapacity: true,
    });
    if (!preflight.ok) {
      return {
        ok: false,
        reason: preflight.reason,
        detail: preflight.detail,
      };
    }
    if (
      cached &&
      (cached.databaseId !== preflight.target.databaseId ||
        cached.mediaRootId !== preflight.target.mediaRootId ||
        cached.manifestChecksum !== preflight.target.manifestChecksum)
    ) {
      return {
        ok: false,
        reason: "generation_changed",
        detail: "silent_retarget_forbidden",
      };
    }
    return { ok: true, target: preflight.target };
  };
}

export function createNativeSaveMirrorRunMirror(options?: {
  injectLocalFailure?: "save" | "media_write" | false;
}): {
  runMirror: (
    serverEntryId: string,
    availableBytes: number | null,
  ) => Promise<MirrorEntryResult>;
  peekLastFetchCode: () => string | null;
} {
  let lastFetchCode: string | null = null;
  return {
    peekLastFetchCode: () => lastFetchCode,
    async runMirror(serverEntryId, availableBytes) {
      lastFetchCode = null;
      const media = await createNativeCandidateMediaStore();
      return withCandidateRepository(async (repository) =>
        mirrorServerJournalEntryToLocalGeneration(
          serverEntryId,
          {
            fetchEntry: async (id) => {
              const fetched = await fetchAuthenticatedJournalEntry(id);
              lastFetchCode = fetched.ok ? null : fetched.code;
              return fetched;
            },
            downloadPhoto: downloadJournalPhotoBase64,
            repository,
            media,
            createStableId: createLocalStableId,
            injectLocalFailure: options?.injectLocalFailure ?? false,
          },
          availableBytes,
        ),
      );
    },
  };
}

export function createNativeSaveMirrorOrchestrationDeps(input: {
  store: LocalMirrorOutboxStore;
  pinnedTarget?: ResolvedLocalJournalGeneration;
  availableBytes?: number | null;
  injectLocalFailure?: "save" | "media_write" | false;
}): OutboxOrchestrationDeps {
  const mirror = createNativeSaveMirrorRunMirror({
    injectLocalFailure: input.injectLocalFailure ?? false,
  });
  return {
    store: input.store,
    resolvePinnedGeneration: createResolvePinnedGenerationForSaveMirror(
      input.pinnedTarget,
    ),
    runMirror: mirror.runMirror,
    peekLastFetchCode: mirror.peekLastFetchCode,
    availableBytes: input.availableBytes ?? null,
  };
}

export async function attemptNativeSaveMirror(
  deps: OutboxOrchestrationDeps,
  outboxItemId: string,
) {
  return attemptOutboxMirror(deps, outboxItemId);
}
