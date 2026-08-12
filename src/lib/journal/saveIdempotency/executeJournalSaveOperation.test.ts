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
import type {
  JournalSaveOperationRecord,
  JournalSaveOperationRequest,
} from "@/lib/journal/saveIdempotency/types";

const USER = "user@example.com";
const OP = "01HXSAVEOPERATIONID00000001";

function fp(overrides?: Partial<{ contentHash: string; entryDate: string; photoIdentity: string }>) {
  return buildJournalSaveRequestFingerprint({
    contentHash: overrides?.contentHash ?? "abc123",
    entryDate: overrides?.entryDate ?? "2026-08-12",
    photoIdentity: overrides?.photoIdentity ?? "none",
  });
}

function req(overrides?: Partial<JournalSaveOperationRequest>): JournalSaveOperationRequest {
  return {
    userId: USER,
    saveOperationId: OP,
    requestFingerprint: fp(),
    entryDate: "2026-08-12",
    hasPhoto: false,
    ...overrides,
  };
}

describe("journal save idempotency core (4B-4N)", () => {
  it("first operation creates one entry, charges once, completes", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind).toBe("completed");
    if (out.kind !== "completed") return;
    expect(out.reusedExisting).toBe(false);
    expect(out.donguriCharged).toBe(true);
    expect(world.createCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
    expect(world.entries.size).toBe(1);

    const lookup = await getJournalSaveOperationResult(store, {
      userId: USER,
      saveOperationId: OP,
    });
    expect(lookup.status).toBe("completed");
    if (lookup.status === "completed") {
      expect(lookup.journalEntryId).toBe(out.journalEntryId);
    }
  });

  it("completed retry returns same entry without new create or charge", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    const first = await executeJournalSaveOperation(store, ports, req());
    expect(first.kind).toBe("completed");
    if (first.kind !== "completed") return;

    const second = await executeJournalSaveOperation(store, ports, req());
    expect(second.kind).toBe("completed");
    if (second.kind !== "completed") return;
    expect(second.journalEntryId).toBe(first.journalEntryId);
    expect(second.reusedExisting).toBe(true);
    expect(world.createCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
  });

  it("response-lost retry (N5): completed before response → same canonical entry", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    const first = await executeJournalSaveOperation(store, ports, req());
    expect(first.kind).toBe("completed");
    if (first.kind !== "completed") return;

    // Client never saw 200; re-POST / lookup with same saveOperationId.
    const retry = await executeJournalSaveOperation(store, ports, req());
    const lookup = await getJournalSaveOperationResult(store, {
      userId: USER,
      saveOperationId: OP,
    });
    expect(retry.kind).toBe("completed");
    if (retry.kind === "completed") {
      expect(retry.journalEntryId).toBe(first.journalEntryId);
    }
    expect(lookup.status).toBe("completed");
    if (lookup.status === "completed") {
      expect(lookup.journalEntryId).toBe(first.journalEntryId);
    }
    expect(world.createCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
  });

  it("concurrent duplicate claim: only one entry and one charge", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const request = req();

    const [a, b] = await Promise.all([
      executeJournalSaveOperation(store, ports, request),
      executeJournalSaveOperation(store, ports, request),
    ]);

    const completed = [a, b].filter((x) => x.kind === "completed");
    expect(completed.length).toBeGreaterThanOrEqual(1);
    const ids = new Set(
      completed
        .filter((x): x is Extract<typeof x, { kind: "completed" }> => x.kind === "completed")
        .map((x) => x.journalEntryId),
    );
    expect(ids.size).toBe(1);
    // Orphans deleted; at most one live entry for this operation.
    expect(world.entries.size).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
    expect(store.listAll()).toHaveLength(1);
  });

  it("processing duplicate mid-flight returns processing or converges without dual charge", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    // Seed processing after entry create (simulates other executor mid-flight).
    const now = "2026-08-12T00:00:00.000Z";
    await store.tryInsertClaim({
      id: "op_seed",
      userId: USER,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "entry_created",
      journalEntryId: "entry_seed_1",
      requestFingerprint: fp(),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
    world.entries.set("entry_seed_1", {
      userId: USER,
      entryDate: "2026-08-12",
      photo: false,
    });

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind === "completed" || out.kind === "processing").toBe(true);
    if (out.kind === "completed") {
      expect(out.journalEntryId).toBe("entry_seed_1");
    }
    expect(world.createCount).toBe(0);
    expect(world.chargeSuccessCount).toBeLessThanOrEqual(1);
  });

  it("N1: crash after claim before entry → retry creates once and completes", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const now = "2026-08-12T00:00:00.000Z";
    await store.tryInsertClaim({
      id: "op_n1",
      userId: USER,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "claimed",
      journalEntryId: null,
      requestFingerprint: fp(),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind).toBe("completed");
    expect(world.createCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
  });

  it("N2: crash after entry before photo → retry no second create", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const now = "2026-08-12T00:00:00.000Z";
    world.entries.set("entry_n2", {
      userId: USER,
      entryDate: "2026-08-12",
      photo: false,
    });
    await store.tryInsertClaim({
      id: "op_n2",
      userId: USER,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "entry_created",
      journalEntryId: "entry_n2",
      requestFingerprint: fp(),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind).toBe("completed");
    if (out.kind === "completed") expect(out.journalEntryId).toBe("entry_n2");
    expect(world.createCount).toBe(0);
    expect(world.photoApplyCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
  });

  it("N3: crash after photo before donguri → retry charges once", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const now = "2026-08-12T00:00:00.000Z";
    world.entries.set("entry_n3", {
      userId: USER,
      entryDate: "2026-08-12",
      photo: true,
    });
    await store.tryInsertClaim({
      id: "op_n3",
      userId: USER,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "photo_completed",
      journalEntryId: "entry_n3",
      requestFingerprint: fp({ photoIdentity: "none" }),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind).toBe("completed");
    expect(world.createCount).toBe(0);
    expect(world.chargeSuccessCount).toBe(1);
  });

  it("N4: donguri success then crash before completed mark → converge without re-charge", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const now = "2026-08-12T00:00:00.000Z";
    world.entries.set("entry_n4", {
      userId: USER,
      entryDate: "2026-08-12",
      photo: false,
    });
    world.donguriChargedEntryIds.add("entry_n4");
    world.chargeSuccessCount = 1;
    await store.tryInsertClaim({
      id: "op_n4",
      userId: USER,
      saveOperationId: OP,
      status: "processing",
      checkpoint: "donguri_settled",
      journalEntryId: "entry_n4",
      requestFingerprint: fp(),
      resultCode: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const out = await executeJournalSaveOperation(store, ports, req());
    expect(out.kind).toBe("completed");
    if (out.kind === "completed") {
      expect(out.journalEntryId).toBe("entry_n4");
      expect(out.donguriAlreadyCharged).toBe(true);
    }
    // No additional successful debit beyond the pre-crash one.
    expect(world.chargeSuccessCount).toBe(1);
    expect(world.donguriChargedEntryIds.size).toBe(1);

    const lookup = await getJournalSaveOperationResult(store, {
      userId: USER,
      saveOperationId: OP,
    });
    expect(lookup.status).toBe("completed");
  });

  it("insufficient donguri → failed_final; replay does not create more entries or charges", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld({ insufficientBalance: true });
    const ports = createFakeSavePorts(world);

    const first = await executeJournalSaveOperation(store, ports, req());
    expect(first.kind).toBe("failed_final");
    if (first.kind === "failed_final") {
      expect(first.resultCode).toBe("ACORN_INSUFFICIENT");
    }
    expect(world.entries.size).toBe(0);
    expect(world.chargeSuccessCount).toBe(0);

    const replay = await executeJournalSaveOperation(store, ports, req());
    expect(replay.kind).toBe("failed_final");
    expect(world.createCount).toBe(1); // only first attempt created then deleted
    expect(world.chargeSuccessCount).toBe(0);
    expect(store.listAll()[0]?.status).toBe("failed_final");
  });

  it("request fingerprint conflict → idempotency_conflict", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);

    const first = await executeJournalSaveOperation(store, ports, req());
    expect(first.kind).toBe("completed");

    const conflict = await executeJournalSaveOperation(
      store,
      ports,
      req({
        requestFingerprint: fp({ contentHash: "different" }),
      }),
    );
    expect(conflict.kind).toBe("idempotency_conflict");
    expect(world.createCount).toBe(1);
  });

  it("cross-user isolation: other user cannot see operation", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    await executeJournalSaveOperation(store, ports, req());

    const other = await getJournalSaveOperationResult(store, {
      userId: "other@example.com",
      saveOperationId: OP,
    });
    expect(other.status).toBe("not_found");
  });

  it("operation metadata has no content/secret fields", async () => {
    const store = createMemoryJournalSaveOperationStore();
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    await executeJournalSaveOperation(store, ports, req());
    const row = store.listAll()[0] as JournalSaveOperationRecord;
    const keys = Object.keys(row).sort();
    expect(keys).toEqual(
      [
        "checkpoint",
        "completedAt",
        "createdAt",
        "id",
        "journalEntryId",
        "requestFingerprint",
        "resultCode",
        "saveOperationId",
        "status",
        "updatedAt",
        "userId",
      ].sort(),
    );
    expect(JSON.stringify(row)).not.toMatch(/secret|password|photoData|content":/i);
    expect(row.requestFingerprint.startsWith("v1|")).toBe(true);
  });
});
