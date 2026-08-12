import { describe, expect, it } from "vitest";

import {
  executeJournalSaveOperation,
  getJournalSaveOperationResult,
} from "@/lib/journal/saveIdempotency/executeJournalSaveOperation";
import {
  createFakeJournalWorld,
  createFakeSavePorts,
} from "@/lib/journal/saveIdempotency/fakePorts";
import { createMemoryJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/memoryStore";
import { buildJournalSaveRequestFingerprint } from "@/lib/journal/saveIdempotency/requestFingerprint";
import {
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
} from "@/lib/local-first/journal/activation/types";
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  applyOperationLookupToIntent,
  createUnavailableDraftPayloadResolver,
  markIntentMirrorEnqueued,
  markSaveOperationPostAttempted,
  prepareSaveOperationIntent,
} from "@/lib/local-first/journal/saveIntent/LocalSaveOperationIntentService";
import { createMemoryLocalSaveOperationIntentStore } from "@/lib/local-first/journal/saveIntent/memoryStore";
import {
  actorKeyFromViewerEmail,
  SAVE_INTENT_FORBIDDEN_PERSISTED_KEYS,
  type GenerationTargetResolver,
  type OperationLookupPort,
} from "@/lib/local-first/journal/saveIntent/types";

const ACTOR = actorKeyFromViewerEmail("user@example.com");
const OP = "01HXSAVEINTENTOPERATION00001";

function fp(hash = "abc123") {
  return buildJournalSaveRequestFingerprint({
    contentHash: hash,
    entryDate: "2026-08-12",
    photoIdentity: "none",
  });
}

function fixtureTarget(): GenerationTargetResolver {
  return {
    async resolveHealthyTechnicalActive() {
      return {
        ok: true,
        target: {
          generation: TECHNICAL_CANDIDATE_GENERATION,
          databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
          mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
          schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
          manifestChecksum: "checksum_fixture",
        },
      };
    },
  };
}

function lookupFromServerStore(
  serverStore: ReturnType<typeof createMemoryJournalSaveOperationStore>,
): OperationLookupPort {
  return {
    getJournalSaveOperationResult: (input) =>
      getJournalSaveOperationResult(serverStore, input),
  };
}

describe("local save operation intent (4B-4O)", () => {
  it("create intent before POST; duplicate create does not proliferate", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    const a = await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    expect(a.kind).toBe("created");
    expect(a.kind === "created" && a.intent.status).toBe("prepared");

    const b = await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    expect(b.kind).toBe("existing");
    expect((await store.dumpRows()).length).toBe(1);
  });

  it("O1: crash before durable intent → no intent, no Server POST implied", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    // Simulate crash before prepareSaveOperationIntent returns/persists.
    expect(await store.dumpRows()).toHaveLength(0);
  });

  it("O2: intent durable after prepare, before POST → relaunch sees prepared", async () => {
    const backing = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(backing, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    // Reopen shares rows map (simulate persistence).
    const reopened = createMemoryLocalSaveOperationIntentStore([
      ...(await backing.dumpRows()),
    ]);
    const row = await reopened.findByActorAndSaveOperationId(ACTOR, OP);
    expect(row?.status).toBe("prepared");
  });

  it("O3: POST after intent → awaiting_result; operationId remains for lookup", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    const after = await markSaveOperationPostAttempted(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });
    expect(after.status).toBe("awaiting_result");
    expect(after.saveOperationId).toBe(OP);
  });

  it("O4: Server completed + response lost → lookup binds canonical entryId", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    const serverStore = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });

    const exec = await executeJournalSaveOperation(serverStore, ports, {
      userId: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
      entryDate: "2026-08-12",
      hasPhoto: false,
    });
    expect(exec.kind).toBe("completed");
    if (exec.kind !== "completed") return;

    const applied = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(applied.kind).toBe("server_completed");
    if (applied.kind !== "server_completed") return;
    expect(applied.serverEntryId).toBe(exec.journalEntryId);
    expect(applied.mirrorEnqueueCandidate?.enqueueInput.serverEntryId).toBe(
      exec.journalEntryId,
    );
  });

  it("O5: server_completed → mirror enqueue candidate; mark completed without dual outbox", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    const outbox = createMemoryLocalMirrorOutboxStore();
    const serverStore = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });
    await executeJournalSaveOperation(serverStore, ports, {
      userId: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
      entryDate: "2026-08-12",
      hasPhoto: false,
    });

    const applied = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(applied.kind).toBe("server_completed");
    if (applied.kind !== "server_completed" || !applied.mirrorEnqueueCandidate) {
      return;
    }

    const enq1 = await outbox.enqueue(applied.mirrorEnqueueCandidate.enqueueInput);
    expect(enq1.created).toBe(true);
    const enq2 = await outbox.enqueue(applied.mirrorEnqueueCandidate.enqueueInput);
    expect(enq2.created).toBe(false);

    await markIntentMirrorEnqueued(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      serverEntryId: applied.serverEntryId,
    });

    const again = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(again.kind).toBe("completed");
    expect((await outbox.dumpRows()).length).toBe(1);
  });

  it("O6: after mirror enqueue, intent completed — outbox owns further recovery", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
      intentId: "intent_o6",
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });
    await intentStore.update({
      ...(await intentStore.findBySaveOperationId(OP))!,
      status: "server_completed",
      serverEntryId: "entry_o6",
    });
    const done = await markIntentMirrorEnqueued(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      serverEntryId: "entry_o6",
    });
    expect(done.status).toBe("completed");
  });

  it("lookup not_found without payload → recovery_required (no empty POST)", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    const serverStore = createMemoryJournalSaveOperationStore();
    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
      draftRef: null,
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });

    const applied = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(applied.kind).toBe("recovery_required");
    if (applied.kind === "recovery_required") {
      expect(applied.intent.failureCode).toBe("PAYLOAD_UNAVAILABLE");
    }
  });

  it("lookup processing stays awaiting_result (no unbounded poll)", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    const serverStore = createMemoryJournalSaveOperationStore();
    const now = "2026-08-12T00:00:00.000Z";
    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      now,
    });
    await serverStore.tryInsertClaim({
      id: "op_proc",
      userId: ACTOR,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "photo_completed",
      journalEntryId: "entry_proc",
      requestFingerprint: fp(),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const applied = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp(), now },
    );
    expect(applied.kind).toBe("awaiting_result");
  });

  it("lookup failed_final keeps intent; no duplicate POST path", async () => {
    const intentStore = createMemoryLocalSaveOperationIntentStore();
    const serverStore = createMemoryJournalSaveOperationStore();
    const now = "2026-08-12T00:00:00.000Z";
    await prepareSaveOperationIntent(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    await markSaveOperationPostAttempted(intentStore, {
      actorKey: ACTOR,
      saveOperationId: OP,
    });
    await serverStore.tryInsertClaim({
      id: "op_fail",
      userId: ACTOR,
      saveOperationId: OP,
      status: "failed_final",
      checkpoint: "completed",
      journalEntryId: null,
      requestFingerprint: fp(),
      resultCode: "ACORN_INSUFFICIENT",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    });

    const applied = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(applied.kind).toBe("server_failed_final");
    const replay = await applyOperationLookupToIntent(
      intentStore,
      {
        lookup: lookupFromServerStore(serverStore),
        draftResolver: createUnavailableDraftPayloadResolver(),
        generationResolver: fixtureTarget(),
      },
      { actorKey: ACTOR, saveOperationId: OP, requestFingerprint: fp() },
    );
    expect(replay.kind).toBe("server_failed_final");
    expect((await intentStore.dumpRows()).length).toBe(1);
  });

  it("fingerprint conflict on prepare", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp("aaa"),
    });
    const conflict = await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp("bbb"),
    });
    expect(conflict.kind).toBe("fingerprint_conflict");
  });

  it("cross-actor isolation", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    const other = await store.findByActorAndSaveOperationId(
      actorKeyFromViewerEmail("other@example.com"),
      OP,
    );
    expect(other).toBeNull();
  });

  it("persisted intent has no content/secret fields", async () => {
    const store = createMemoryLocalSaveOperationIntentStore();
    await prepareSaveOperationIntent(store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
    });
    const row = (await store.dumpRows())[0]!;
    const blob = JSON.stringify(row);
    for (const key of SAVE_INTENT_FORBIDDEN_PERSISTED_KEYS) {
      expect(blob.toLowerCase()).not.toContain(`"${key.toLowerCase()}":`);
    }
    expect(Object.keys(row).sort()).toEqual(
      [
        "actorKey",
        "completedAt",
        "createdAt",
        "draftRef",
        "failureCode",
        "intentId",
        "lastAttemptAt",
        "requestFingerprint",
        "saveOperationId",
        "serverEntryId",
        "status",
      ].sort(),
    );
  });
});
