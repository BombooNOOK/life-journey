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
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { createMemoryLocalSaveOperationIntentStore } from "@/lib/local-first/journal/saveIntent/memoryStore";
import { actorKeyFromViewerEmail } from "@/lib/local-first/journal/saveIntent/types";
import {
  assertSuccessfulFinalInvariant,
  createMemoryLocalMirrorSink,
  recoverInternalSaveOperationE2e,
  runInternalSaveOperationE2e,
} from "@/lib/local-first/journal/save/internalSaveOperationE2e";

const ACTOR = "4b4q-e2e@example.com";

function baseDeps(world = createFakeJournalWorld()) {
  const ports = createFakeSavePorts(world);
  return {
    world,
    ports,
    actorEmail: ACTOR,
    intentStore: createMemoryLocalSaveOperationIntentStore(),
    serverStore: createMemoryJournalSaveOperationStore(),
    outboxStore: createMemoryLocalMirrorOutboxStore(),
    localMirror: createMemoryLocalMirrorSink(),
    contentHash: "e2ehash",
    entryDate: "2026-08-13",
    photoIdentity: "fixture-photo-sha",
    photoSha256: "sha256:fixture",
    hasPhoto: true,
  };
}

describe("4B-4Q internal save operation E2E (memory)", () => {
  it("happy path: intent→server→outbox→mirror→completed invariants", async () => {
    const d = baseDeps();
    const result = await runInternalSaveOperationE2e(d);
    expect(result.phase).toBe("completed");
    assertSuccessfulFinalInvariant({
      result,
      journalEntryCount: d.world.entries.size,
      donguriChargeCount: d.world.chargeSuccessCount,
    });
    expect(result.invariant.legacyServerId).toBe(result.canonicalEntryId);
  });

  it("intent-before-POST: prepare leaves prepared without server op", async () => {
    const d = baseDeps();
    const stopped = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "after_intent_before_post",
    });
    expect(stopped.phase).toBe("stopped_after_intent");
    expect(stopped.intent?.status).toBe("prepared");
    expect(
      await d.serverStore.findByUserAndOperationId(
        stopped.actorKey,
        stopped.saveOperationId,
      ),
    ).toBeNull();
  });

  it("Q1 before_intent: no server POST, no entry", async () => {
    const d = baseDeps();
    const r = await runInternalSaveOperationE2e({ ...d, crashAt: "before_intent" });
    expect(r.phase).toBe("stopped_before_intent");
    expect(d.world.createCount).toBe(0);
    expect(r.invariant.saveOperationRows).toBe(0);
  });

  it("Q2 after intent before post: relaunch does not create until execute", async () => {
    const d = baseDeps();
    const stopped = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "after_intent_before_post",
      saveOperationId: "01HX4B4QQ2INTENTBEFOREPOST",
    });
    // reopen intent store
    const reopenedIntent = createMemoryLocalSaveOperationIntentStore(
      await d.intentStore.dumpRows(),
    );
    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      intentStore: reopenedIntent,
      saveOperationId: stopped.saveOperationId,
      requestFingerprint: stopped.requestFingerprint,
      completeMirror: true,
    });
    // Server never ran → not_found → recovery_required (no empty auto POST)
    expect(recovered.phase).toBe("recovery_required");
    expect(d.world.createCount).toBe(0);
  });

  it("Q3 response lost: lookup recovers same entry; no duplicate create/charge", async () => {
    const d = baseDeps();
    const lost = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "response_lost_after_server_completed",
      saveOperationId: "01HX4B4QQ3RESPONSELOST00001",
    });
    expect(lost.phase).toBe("response_lost");
    expect(lost.observedResponse).toBe(false);
    expect(d.world.entries.size).toBe(1);
    expect(d.world.chargeSuccessCount).toBe(1);

    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      saveOperationId: lost.saveOperationId,
      requestFingerprint: lost.requestFingerprint,
      completeMirror: true,
      photoSha256: "sha256:fixture",
    });
    expect(recovered.phase).toBe("completed");
    expect(recovered.canonicalEntryId).toBe(lost.canonicalEntryId);
    expect(d.world.createCount).toBe(1);
    expect(d.world.chargeSuccessCount).toBe(1);
    assertSuccessfulFinalInvariant({
      result: recovered,
      journalEntryCount: d.world.entries.size,
      donguriChargeCount: d.world.chargeSuccessCount,
    });
  });

  it("Q4 Window C: bind then kill before outbox → relaunch enqueues", async () => {
    const d = baseDeps();
    const stopped = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "after_bind_before_outbox",
      saveOperationId: "01HX4B4QQ4WINDOWC000000001",
    });
    expect(stopped.phase).toBe("stopped_before_outbox");
    expect(stopped.intent?.status).toBe("server_completed");
    expect(stopped.intent?.serverEntryId).toBeTruthy();
    expect((await d.outboxStore.dumpRows()).length).toBe(0);

    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      saveOperationId: stopped.saveOperationId,
      requestFingerprint: stopped.requestFingerprint,
      completeMirror: true,
    });
    expect(recovered.phase).toBe("completed");
    expect(recovered.canonicalEntryId).toBe(stopped.canonicalEntryId);
    expect(d.world.createCount).toBe(1);
    assertSuccessfulFinalInvariant({
      result: recovered,
      journalEntryCount: d.world.entries.size,
      donguriChargeCount: d.world.chargeSuccessCount,
    });
  });

  it("Q5 Window D: outbox pending survives; recover mirrors and acks", async () => {
    const d = baseDeps();
    const stopped = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "after_outbox_before_mirror",
      saveOperationId: "01HX4B4QQ5WINDOWDOUTBOX0001",
    });
    expect(stopped.phase).toBe("stopped_before_mirror");
    expect((await d.outboxStore.listPending()).length).toBe(1);

    // Simulate kill/relaunch of outbox memory
    const outbox2 = createMemoryLocalMirrorOutboxStore(
      await d.outboxStore.dumpRows(),
    );
    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      outboxStore: outbox2,
      saveOperationId: stopped.saveOperationId,
      requestFingerprint: stopped.requestFingerprint,
      completeMirror: true,
    });
    // recover will enqueue again (unique → 1 row) then mirror+ack
    expect(recovered.phase).toBe("completed");
    expect((await outbox2.listPending()).length).toBe(0);
    expect(d.world.createCount).toBe(1);
  });

  it("Q6 after mirror before ack: drain outbox and complete intent", async () => {
    const d = baseDeps();
    const stopped = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "after_mirror_before_ack",
      saveOperationId: "01HX4B4QQ6MIRRORBEFOREACK01",
    });
    expect(stopped.phase).toBe("stopped_before_ack");
    expect(d.localMirror.byServerId.size).toBe(1);
    expect((await d.outboxStore.listPending()).length).toBe(1);

    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      saveOperationId: stopped.saveOperationId,
      requestFingerprint: stopped.requestFingerprint,
      completeMirror: true,
    });
    expect(recovered.phase).toBe("completed");
    expect((await d.outboxStore.listPending()).length).toBe(0);
    expect(d.localMirror.byServerId.size).toBe(1);
  });

  it("duplicate saveOperationId: no second entry/charge/outbox/local", async () => {
    const d = baseDeps();
    const op = "01HX4B4QDUPLICATEOPERATION01";
    const first = await runInternalSaveOperationE2e({
      ...d,
      saveOperationId: op,
    });
    expect(first.phase).toBe("completed");

    const second = await runInternalSaveOperationE2e({
      ...d,
      saveOperationId: op,
    });
    // second run: prepare existing → server completed reuse → enqueue unique → mirror existing
    expect(second.canonicalEntryId).toBe(first.canonicalEntryId);
    expect(d.world.createCount).toBe(1);
    expect(d.world.chargeSuccessCount).toBe(1);
    expect(d.localMirror.byServerId.size).toBe(1);
    expect((await d.outboxStore.listPending()).length).toBe(0);
  });

  it("fingerprint conflict shared algorithm", async () => {
    const d = baseDeps();
    const op = "01HX4B4QFINGERPRINTCONFLICT1";
    await runInternalSaveOperationE2e({ ...d, saveOperationId: op });
    const otherFp = buildJournalSaveRequestFingerprint({
      contentHash: "other",
      entryDate: "2026-08-13",
      photoIdentity: "none",
    });
    const conflict = await executeJournalSaveOperation(d.serverStore, d.ports, {
      userId: actorKeyFromViewerEmail(ACTOR),
      saveOperationId: op,
      requestFingerprint: otherFp,
      entryDate: "2026-08-13",
      hasPhoto: false,
    });
    expect(conflict.kind).toBe("idempotency_conflict");
    expect(d.world.createCount).toBe(1);
  });

  it("failed_final: no outbox / no mirror / no duplicate", async () => {
    const world = createFakeJournalWorld({ insufficientBalance: true });
    const d = baseDeps(world);
    const r = await runInternalSaveOperationE2e({
      ...d,
      saveOperationId: "01HX4B4QFAILEDFINAL0000001",
    });
    expect(r.phase).toBe("failed_final");
    expect((await d.outboxStore.dumpRows()).length).toBe(0);
    expect(d.localMirror.byServerId.size).toBe(0);
    expect(world.chargeSuccessCount).toBe(0);

    const replay = await runInternalSaveOperationE2e({
      ...d,
      saveOperationId: "01HX4B4QFAILEDFINAL0000001",
    });
    expect(replay.phase).toBe("failed_final");
    expect(world.createCount).toBe(1);
  });

  it("ambiguous Window B: lookup first; completed → recover without re-create", async () => {
    const d = baseDeps();
    const lost = await runInternalSaveOperationE2e({
      ...d,
      crashAt: "response_lost_after_server_completed",
      saveOperationId: "01HX4B4QWINDOWBAMBIGUOUS001",
    });
    const lookup = await getJournalSaveOperationResult(d.serverStore, {
      userId: lost.actorKey,
      saveOperationId: lost.saveOperationId,
    });
    expect(lookup.status).toBe("completed");
    // Must not start a new operation id / create
    const recovered = await recoverInternalSaveOperationE2e({
      ...d,
      saveOperationId: lost.saveOperationId,
      requestFingerprint: lost.requestFingerprint,
      completeMirror: true,
    });
    expect(recovered.phase).toBe("completed");
    expect(d.world.createCount).toBe(1);
  });
});
