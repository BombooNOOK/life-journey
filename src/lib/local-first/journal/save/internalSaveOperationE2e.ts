/**
 * Internal-only Save Operation Recovery E2E orchestrator (4B-4Q).
 *
 * Order (mandatory):
 *   generate saveOperationId → Local intent durable → internal Server save
 * Never POST/create before intent. Never production POST /api/journal.
 *
 * Domain / memory / disposable Prisma only. Not a Local SoT switch.
 */

import {
  executeJournalSaveOperation,
  getJournalSaveOperationResult,
} from "@/lib/journal/saveIdempotency/executeJournalSaveOperation";
import { buildJournalSaveRequestFingerprint } from "@/lib/journal/saveIdempotency/requestFingerprint";
import type {
  ExecuteJournalSaveOperationOutcome,
  JournalSaveOperationStore,
  JournalSaveSideEffectPorts,
} from "@/lib/journal/saveIdempotency/types";
import {
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
} from "@/lib/local-first/journal/activation/types";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { enqueueBeforeMirror } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  applyOperationLookupToIntent,
  createUnavailableDraftPayloadResolver,
  markIntentMirrorEnqueued,
  markSaveOperationPostAttempted,
  prepareSaveOperationIntent,
} from "@/lib/local-first/journal/saveIntent/LocalSaveOperationIntentService";
import {
  actorKeyFromViewerEmail,
  type LocalSaveOperationIntentRecord,
  type LocalSaveOperationIntentStore,
} from "@/lib/local-first/journal/saveIntent/types";

export const INTERNAL_SAVE_E2E_FLAG = "INTERNAL_SAVE_OPERATION_E2E" as const;

export type LocalMirrorSinkEntry = {
  legacyServerId: string;
  mirrored: true;
  photoSha256: string | null;
};

export type LocalMirrorSink = {
  byServerId: Map<string, LocalMirrorSinkEntry>;
  mirror(input: {
    serverEntryId: string;
    photoSha256?: string | null;
  }): Promise<LocalMirrorSinkEntry>;
};

export function createMemoryLocalMirrorSink(): LocalMirrorSink {
  const byServerId = new Map<string, LocalMirrorSinkEntry>();
  return {
    byServerId,
    async mirror(input) {
      const existing = byServerId.get(input.serverEntryId);
      if (existing) return existing;
      const row: LocalMirrorSinkEntry = {
        legacyServerId: input.serverEntryId,
        mirrored: true,
        photoSha256: input.photoSha256 ?? null,
      };
      byServerId.set(input.serverEntryId, row);
      return row;
    },
  };
}

export type InternalSaveE2eCrashPoint =
  | "none"
  | /** Q1: before intent durable */
  "before_intent"
  | /** Q2: after intent, before server execute */
  "after_intent_before_post"
  | /** Q3: server completed, client did not observe response */
  "response_lost_after_server_completed"
  | /** Q4: after bind server_completed, before outbox enqueue */
  "after_bind_before_outbox"
  | /** Q5: after outbox enqueue, before local mirror */
  "after_outbox_before_mirror"
  | /** Q6: after mirror, before outbox ack / intent completed mark */
  "after_mirror_before_ack";

export type InternalSaveE2eDeps = {
  actorEmail: string;
  intentStore: LocalSaveOperationIntentStore;
  serverStore: JournalSaveOperationStore;
  ports: JournalSaveSideEffectPorts;
  outboxStore: LocalMirrorOutboxStore;
  localMirror: LocalMirrorSink;
  contentHash: string;
  entryDate: string;
  photoIdentity?: string;
  photoSha256?: string | null;
  hasPhoto?: boolean;
  saveOperationId?: string;
  crashAt?: InternalSaveE2eCrashPoint;
  generationTarget?: ResolvedLocalJournalGeneration;
  now?: string;
};

export type InternalSaveE2eInvariant = {
  saveOperationRows: number;
  journalEntryCount: number;
  donguriChargeCount: number;
  canonicalEntryId: string | null;
  intentStatus: LocalSaveOperationIntentRecord["status"] | null;
  outboxPendingCount: number;
  localMirrorCount: number;
  legacyServerId: string | null;
};

export type InternalSaveE2eResult = {
  saveOperationId: string;
  requestFingerprint: string;
  actorKey: string;
  crashAt: InternalSaveE2eCrashPoint;
  phase:
    | "stopped_before_intent"
    | "stopped_after_intent"
    | "response_lost"
    | "stopped_before_outbox"
    | "stopped_before_mirror"
    | "stopped_before_ack"
    | "completed"
    | "recovery_required"
    | "failed_final"
    | "idempotency_conflict"
    | "processing";
  serverOutcome: ExecuteJournalSaveOperationOutcome | null;
  observedResponse: boolean;
  intent: LocalSaveOperationIntentRecord | null;
  canonicalEntryId: string | null;
  invariant: InternalSaveE2eInvariant;
};

function newSaveOperationId(): string {
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  return `01HX4B4Q${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`.slice(
    0,
    26,
  );
}

function defaultTarget(): ResolvedLocalJournalGeneration {
  return {
    generation: TECHNICAL_CANDIDATE_GENERATION,
    databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    manifestChecksum: "e2e_checksum",
  };
}

async function countServerOps(
  store: JournalSaveOperationStore,
  actorKey: string,
  saveOperationId: string,
): Promise<number> {
  const row = await store.findByUserAndOperationId(actorKey, saveOperationId);
  return row ? 1 : 0;
}

/**
 * Recover after crash / response lost using lookup first (never re-save blindly).
 */
export async function recoverInternalSaveOperationE2e(
  deps: Omit<InternalSaveE2eDeps, "crashAt" | "contentHash" | "entryDate"> & {
    saveOperationId: string;
    requestFingerprint: string;
    /** When true, run mirror + ack after enqueue. */
    completeMirror?: boolean;
    photoSha256?: string | null;
  },
): Promise<InternalSaveE2eResult> {
  const actorKey = actorKeyFromViewerEmail(deps.actorEmail);
  const target = deps.generationTarget ?? defaultTarget();
  const crashAt: InternalSaveE2eCrashPoint = "none";

  const intentBefore = await deps.intentStore.findByActorAndSaveOperationId(
    actorKey,
    deps.saveOperationId,
  );
  if (!intentBefore) {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_intent",
      serverOutcome: null,
      observedResponse: false,
      intent: null,
      canonicalEntryId: null,
    });
  }

  if (intentBefore.status === "completed" && intentBefore.serverEntryId) {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "completed",
      serverOutcome: null,
      observedResponse: true,
      intent: intentBefore,
      canonicalEntryId: intentBefore.serverEntryId,
    });
  }

  if (intentBefore.status === "prepared") {
    // Q1 recovery: intent exists but never POSTed — do not invent payload replay.
    // E2E continues by marking attempt + server execute only when caller wants full resume.
  }

  const applied = await applyOperationLookupToIntent(
    deps.intentStore,
    {
      lookup: {
        getJournalSaveOperationResult: (input) =>
          getJournalSaveOperationResult(deps.serverStore, input),
      },
      draftResolver: createUnavailableDraftPayloadResolver(),
      generationResolver: {
        async resolveHealthyTechnicalActive() {
          return { ok: true, target };
        },
      },
    },
    {
      actorKey,
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
    },
  );

  if (applied.kind === "recovery_required") {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "recovery_required",
      serverOutcome: null,
      observedResponse: false,
      intent: applied.intent,
      canonicalEntryId: null,
    });
  }
  if (applied.kind === "server_failed_final") {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "failed_final",
      serverOutcome: null,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: applied.intent.serverEntryId,
    });
  }
  if (applied.kind === "awaiting_result") {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "processing",
      serverOutcome: null,
      observedResponse: false,
      intent: applied.intent,
      canonicalEntryId: null,
    });
  }
  if (applied.kind === "fingerprint_conflict") {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "idempotency_conflict",
      serverOutcome: null,
      observedResponse: false,
      intent: applied.intent,
      canonicalEntryId: null,
    });
  }

  // completed or server_completed
  if (applied.kind === "completed") {
    const entryId = applied.intent.serverEntryId;
    if (!entryId) throw new Error("canonical_entry_missing");
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "completed",
      serverOutcome: null,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  // server_completed → enqueue → mirror → ack → intent completed
  const entryId = applied.serverEntryId;
  const candidate = applied.mirrorEnqueueCandidate;
  if (!candidate) {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_outbox",
      serverOutcome: null,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  await enqueueBeforeMirror(
    { store: deps.outboxStore },
    {
      serverEntryId: candidate.enqueueInput.serverEntryId,
      target: candidate.enqueueInput.target,
    },
  );

  if (deps.completeMirror === false) {
    return finish(deps, {
      saveOperationId: deps.saveOperationId,
      requestFingerprint: deps.requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_mirror",
      serverOutcome: null,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  await deps.localMirror.mirror({
    serverEntryId: entryId,
    photoSha256: deps.photoSha256 ?? null,
  });

  // Window D: ack = remove pending outbox row(s) for this entry+generation
  const pending = await deps.outboxStore.listPending();
  for (const item of pending) {
    if (item.serverEntryId === entryId) {
      await deps.outboxStore.ackRemove(item.id);
    }
  }

  const done = await markIntentMirrorEnqueued(deps.intentStore, {
    actorKey,
    saveOperationId: deps.saveOperationId,
    serverEntryId: entryId,
  });

  return finish(deps, {
    saveOperationId: deps.saveOperationId,
    requestFingerprint: deps.requestFingerprint,
    actorKey,
    crashAt,
    phase: "completed",
    serverOutcome: null,
    observedResponse: true,
    intent: done,
    canonicalEntryId: entryId,
  });
}

/**
 * First-pass E2E with optional crash injection points (Q1–Q6).
 */
export async function runInternalSaveOperationE2e(
  deps: InternalSaveE2eDeps,
): Promise<InternalSaveE2eResult> {
  const actorKey = actorKeyFromViewerEmail(deps.actorEmail);
  const saveOperationId = deps.saveOperationId ?? newSaveOperationId();
  const requestFingerprint = buildJournalSaveRequestFingerprint({
    contentHash: deps.contentHash,
    entryDate: deps.entryDate,
    photoIdentity: deps.photoIdentity ?? "none",
  });
  const crashAt = deps.crashAt ?? "none";
  const target = deps.generationTarget ?? defaultTarget();

  if (crashAt === "before_intent") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_intent",
      serverOutcome: null,
      observedResponse: false,
      intent: null,
      canonicalEntryId: null,
    });
  }

  const prepared = await prepareSaveOperationIntent(deps.intentStore, {
    actorKey,
    saveOperationId,
    requestFingerprint,
    draftRef: null,
    now: deps.now,
  });
  if (prepared.kind === "fingerprint_conflict") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "idempotency_conflict",
      serverOutcome: null,
      observedResponse: false,
      intent: prepared.intent,
      canonicalEntryId: null,
    });
  }

  if (crashAt === "after_intent_before_post") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_after_intent",
      serverOutcome: null,
      observedResponse: false,
      intent: prepared.intent,
      canonicalEntryId: null,
    });
  }

  await markSaveOperationPostAttempted(deps.intentStore, {
    actorKey,
    saveOperationId,
    now: deps.now,
  });

  const serverOutcome = await executeJournalSaveOperation(
    deps.serverStore,
    deps.ports,
    {
      userId: actorKey,
      saveOperationId,
      requestFingerprint,
      entryDate: deps.entryDate,
      hasPhoto: deps.hasPhoto ?? false,
    },
  );

  const responseLost = crashAt === "response_lost_after_server_completed";
  if (responseLost) {
    // Client never saw response — recover via lookup only.
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "response_lost",
      serverOutcome,
      observedResponse: false,
      intent: await deps.intentStore.findByActorAndSaveOperationId(
        actorKey,
        saveOperationId,
      ),
      canonicalEntryId:
        serverOutcome.kind === "completed" ? serverOutcome.journalEntryId : null,
    });
  }

  if (serverOutcome.kind === "failed_final") {
    await applyOperationLookupToIntent(
      deps.intentStore,
      {
        lookup: {
          getJournalSaveOperationResult: (input) =>
            getJournalSaveOperationResult(deps.serverStore, input),
        },
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: {
          async resolveHealthyTechnicalActive() {
            return { ok: true, target };
          },
        },
      },
      { actorKey, saveOperationId, requestFingerprint },
    );
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "failed_final",
      serverOutcome,
      observedResponse: true,
      intent: await deps.intentStore.findByActorAndSaveOperationId(
        actorKey,
        saveOperationId,
      ),
      canonicalEntryId: serverOutcome.journalEntryId,
    });
  }

  if (serverOutcome.kind !== "completed") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase:
        serverOutcome.kind === "processing"
          ? "processing"
          : serverOutcome.kind === "idempotency_conflict"
            ? "idempotency_conflict"
            : "processing",
      serverOutcome,
      observedResponse: true,
      intent: await deps.intentStore.findByActorAndSaveOperationId(
        actorKey,
        saveOperationId,
      ),
      canonicalEntryId: null,
    });
  }

  const applied = await applyOperationLookupToIntent(
    deps.intentStore,
    {
      lookup: {
        getJournalSaveOperationResult: (input) =>
          getJournalSaveOperationResult(deps.serverStore, input),
      },
      draftResolver: createUnavailableDraftPayloadResolver(),
      generationResolver: {
        async resolveHealthyTechnicalActive() {
          return { ok: true, target };
        },
      },
    },
    { actorKey, saveOperationId, requestFingerprint },
  );

  if (applied.kind !== "server_completed" && applied.kind !== "completed") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase:
        applied.kind === "recovery_required"
          ? "recovery_required"
          : applied.kind === "server_failed_final"
            ? "failed_final"
            : applied.kind === "fingerprint_conflict"
              ? "idempotency_conflict"
              : "processing",
      serverOutcome,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: serverOutcome.journalEntryId,
    });
  }

  const entryId =
    applied.kind === "server_completed"
      ? applied.serverEntryId
      : applied.intent.serverEntryId!;

  if (crashAt === "after_bind_before_outbox") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_outbox",
      serverOutcome,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  const candidate =
    applied.kind === "server_completed" ? applied.mirrorEnqueueCandidate : null;
  if (!candidate && applied.kind === "server_completed") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_outbox",
      serverOutcome,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  if (candidate) {
    await enqueueBeforeMirror(
      { store: deps.outboxStore },
      {
        serverEntryId: candidate.enqueueInput.serverEntryId,
        target: candidate.enqueueInput.target,
      },
    );
  } else {
    // completed reuse path — still ensure outbox unique enqueue for recovery
    await enqueueBeforeMirror(
      { store: deps.outboxStore },
      { serverEntryId: entryId, target },
    );
  }

  if (crashAt === "after_outbox_before_mirror") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_mirror",
      serverOutcome,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  await deps.localMirror.mirror({
    serverEntryId: entryId,
    photoSha256: deps.photoSha256 ?? null,
  });

  if (crashAt === "after_mirror_before_ack") {
    return finish(deps, {
      saveOperationId,
      requestFingerprint,
      actorKey,
      crashAt,
      phase: "stopped_before_ack",
      serverOutcome,
      observedResponse: true,
      intent: applied.intent,
      canonicalEntryId: entryId,
    });
  }

  const pending = await deps.outboxStore.listPending();
  for (const item of pending) {
    if (item.serverEntryId === entryId) {
      await deps.outboxStore.ackRemove(item.id);
    }
  }

  const done = await markIntentMirrorEnqueued(deps.intentStore, {
    actorKey,
    saveOperationId,
    serverEntryId: entryId,
  });

  return finish(deps, {
    saveOperationId,
    requestFingerprint,
    actorKey,
    crashAt,
    phase: "completed",
    serverOutcome,
    observedResponse: true,
    intent: done,
    canonicalEntryId: entryId,
  });
}

async function finish(
  deps: Pick<
    InternalSaveE2eDeps,
    "intentStore" | "serverStore" | "outboxStore" | "localMirror" | "ports"
  > & {
    actorEmail?: string;
  },
  partial: Omit<InternalSaveE2eResult, "invariant"> & {
    actorKey: string;
  },
): Promise<InternalSaveE2eResult> {
  const worldPorts = deps.ports as JournalSaveSideEffectPorts & {
    /* fake world may sit alongside */
  };
  void worldPorts;

  const saveOperationRows = await countServerOps(
    deps.serverStore,
    partial.actorKey,
    partial.saveOperationId,
  );
  const outboxPending = (await deps.outboxStore.listPending()).length;
  const local = deps.localMirror.byServerId;
  const localMirrorCount = local.size;
  const legacy =
    partial.canonicalEntryId != null
      ? (local.get(partial.canonicalEntryId)?.legacyServerId ?? null)
      : null;

  // Entry/charge counts come from fake world when present via ports closures —
  // callers pass FakeJournalWorld separately for strict asserts in tests.
  const invariant: InternalSaveE2eInvariant = {
    saveOperationRows,
    journalEntryCount: -1,
    donguriChargeCount: -1,
    canonicalEntryId: partial.canonicalEntryId,
    intentStatus: partial.intent?.status ?? null,
    outboxPendingCount: outboxPending,
    localMirrorCount,
    legacyServerId: legacy,
  };

  return { ...partial, invariant };
}

export function assertSuccessfulFinalInvariant(input: {
  result: InternalSaveE2eResult;
  journalEntryCount: number;
  donguriChargeCount: number;
}): void {
  const { result, journalEntryCount, donguriChargeCount } = input;
  if (result.phase !== "completed") {
    throw new Error(`expected_completed_got_${result.phase}`);
  }
  if (result.invariant.saveOperationRows !== 1) {
    throw new Error("save_operation_not_one");
  }
  if (journalEntryCount !== 1) throw new Error("journal_entry_not_one");
  if (donguriChargeCount !== 1) throw new Error("donguri_not_one");
  if (!result.canonicalEntryId) throw new Error("canonical_missing");
  if (result.intent?.status !== "completed") throw new Error("intent_not_completed");
  if (result.invariant.outboxPendingCount !== 0) {
    throw new Error("outbox_not_drained");
  }
  if (result.invariant.localMirrorCount !== 1) {
    throw new Error("local_mirror_not_one");
  }
  if (result.invariant.legacyServerId !== result.canonicalEntryId) {
    throw new Error("legacy_server_id_mismatch");
  }
}
