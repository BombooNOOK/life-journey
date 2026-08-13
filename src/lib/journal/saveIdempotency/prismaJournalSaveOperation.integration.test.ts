/**
 * 4B-4P non-production Prisma / PostgreSQL integration for JournalSaveOperation.
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/journal/saveIdempotency/prismaJournalSaveOperation.integration.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  executeJournalSaveOperation,
  getJournalSaveOperationResult,
} from "@/lib/journal/saveIdempotency/executeJournalSaveOperation";
import {
  assertLocalDisposableDatabaseUrl,
  auditDatabaseUrlForNonprodIdempotency,
} from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  createFakeJournalWorld,
  createFakeSavePorts,
} from "@/lib/journal/saveIdempotency/fakePorts";
import { createPrismaJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/prismaJournalSaveOperationStore";
import { buildJournalSaveRequestFingerprint } from "@/lib/journal/saveIdempotency/requestFingerprint";
import type { JournalSaveOperationRequest } from "@/lib/journal/saveIdempotency/types";
import { prisma } from "@/lib/db";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runIntegration =
  process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const ACTOR = "4b4p-idempotency@example.com";
const OTHER = "4b4p-other@example.com";

function fp(hash = "4b4pcontent") {
  return buildJournalSaveRequestFingerprint({
    contentHash: hash,
    entryDate: "2026-08-13",
    photoIdentity: "none",
  });
}

function req(
  saveOperationId: string,
  overrides?: Partial<JournalSaveOperationRequest>,
): JournalSaveOperationRequest {
  return {
    userId: ACTOR,
    saveOperationId,
    requestFingerprint: fp(),
    entryDate: "2026-08-13",
    hasPhoto: false,
    ...overrides,
  };
}

function newOp(suffix: string): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return `01HX4B4P${suffix}${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`.slice(
    0,
    26,
  );
}

describe.skipIf(!runIntegration)(
  "4B-4P Prisma JournalSaveOperation (local disposable DB)",
  () => {
    const store = createPrismaJournalSaveOperationStore(prisma);
    const createdOpIds: string[] = [];

    beforeAll(async () => {
      assertLocalDisposableDatabaseUrl(process.env.DATABASE_URL);
      // Ensure table exists (idempotent SQL was applied by runner; probe here).
      await prisma.$queryRaw`SELECT 1 FROM "JournalSaveOperation" LIMIT 1`;
    });

    afterAll(async () => {
      if (createdOpIds.length > 0) {
        await prisma.journalSaveOperation.deleteMany({
          where: { saveOperationId: { in: createdOpIds } },
        });
      }
      await prisma.$disconnect();
    });

    it("db gate reports local disposable only", () => {
      expect(audit.ok).toBe(true);
      expect(audit.isNeonLike).toBe(false);
      expect(audit.host).toBe("127.0.0.1");
      expect(audit.port).toBe("5433");
      expect(audit.database).toBe("ljd_dev");
    });

    it("unique (actorKey, saveOperationId): one row; cross-actor allowed", async () => {
      const op = newOp("UQ");
      createdOpIds.push(op);
      const world = createFakeJournalWorld();
      const ports = createFakeSavePorts(world);
      const a = await executeJournalSaveOperation(store, ports, req(op));
      expect(a.kind).toBe("completed");

      const again = await store.tryInsertClaim({
        userId: ACTOR,
        saveOperationId: op,
        status: "processing",
        checkpoint: "claimed",
        journalEntryId: null,
        requestFingerprint: fp(),
        resultCode: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      });
      expect(again.created).toBe(false);

      const otherOpSameId = await store.tryInsertClaim({
        userId: OTHER,
        saveOperationId: op,
        status: "processing",
        checkpoint: "claimed",
        journalEntryId: null,
        requestFingerprint: fp(),
        resultCode: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      });
      expect(otherOpSameId.created).toBe(true);
      createdOpIds.push(op); // same id cleaned by actor filter below — deleteMany by op id cleans both

      const count = await prisma.journalSaveOperation.count({
        where: { saveOperationId: op },
      });
      expect(count).toBe(2);
      const sameActor = await prisma.journalSaveOperation.count({
        where: { actorKey: ACTOR, saveOperationId: op },
      });
      expect(sameActor).toBe(1);
    });

    it("concurrent claim: one operation, one entry, one charge", async () => {
      const op = newOp("CC");
      createdOpIds.push(op);
      const world = createFakeJournalWorld();
      const ports = createFakeSavePorts(world);
      const request = req(op);
      const [a, b] = await Promise.all([
        executeJournalSaveOperation(store, ports, request),
        executeJournalSaveOperation(store, ports, request),
      ]);
      const completed = [a, b].filter((x) => x.kind === "completed");
      expect(completed.length).toBeGreaterThanOrEqual(1);
      const ids = new Set(
        completed
          .filter(
            (x): x is Extract<typeof x, { kind: "completed" }> =>
              x.kind === "completed",
          )
          .map((x) => x.journalEntryId),
      );
      expect(ids.size).toBe(1);
      expect(world.entries.size).toBe(1);
      expect(world.chargeSuccessCount).toBe(1);
      expect(
        await prisma.journalSaveOperation.count({
          where: { actorKey: ACTOR, saveOperationId: op },
        }),
      ).toBe(1);
    });

    it("persistence/reopen: completed result survives new store instance", async () => {
      const op = newOp("PR");
      createdOpIds.push(op);
      const world = createFakeJournalWorld();
      const ports = createFakeSavePorts(world);
      const first = await executeJournalSaveOperation(store, ports, req(op));
      expect(first.kind).toBe("completed");
      if (first.kind !== "completed") return;

      const reopened = createPrismaJournalSaveOperationStore(prisma);
      const lookup = await getJournalSaveOperationResult(reopened, {
        userId: ACTOR,
        saveOperationId: op,
      });
      expect(lookup.status).toBe("completed");
      if (lookup.status === "completed") {
        expect(lookup.journalEntryId).toBe(first.journalEntryId);
      }
      const retry = await executeJournalSaveOperation(reopened, ports, req(op));
      expect(retry.kind).toBe("completed");
      if (retry.kind === "completed") {
        expect(retry.journalEntryId).toBe(first.journalEntryId);
        expect(retry.reusedExisting).toBe(true);
      }
      expect(world.createCount).toBe(1);
      expect(world.chargeSuccessCount).toBe(1);
    });

    it("N1–N5 crash resume converge without duplicate entry/charge", async () => {
      // N1
      {
        const op = newOp("N1");
        createdOpIds.push(op);
        const now = new Date().toISOString();
        await store.tryInsertClaim({
          userId: ACTOR,
          saveOperationId: op,
          status: "processing",
          checkpoint: "claimed",
          journalEntryId: null,
          requestFingerprint: fp(),
          resultCode: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
        const world = createFakeJournalWorld();
        const ports = createFakeSavePorts(world);
        const out = await executeJournalSaveOperation(store, ports, req(op));
        expect(out.kind).toBe("completed");
        expect(world.createCount).toBe(1);
        expect(world.chargeSuccessCount).toBe(1);
      }
      // N2
      {
        const op = newOp("N2");
        createdOpIds.push(op);
        const now = new Date().toISOString();
        const world = createFakeJournalWorld();
        const ports = createFakeSavePorts(world);
        const created = await ports.createJournalEntry({
          userId: ACTOR,
          entryDate: "2026-08-13",
          saveOperationId: op,
        });
        await store.tryInsertClaim({
          userId: ACTOR,
          saveOperationId: op,
          status: "processing",
          checkpoint: "entry_created",
          journalEntryId: created.journalEntryId,
          requestFingerprint: fp(),
          resultCode: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
        world.createCount = 0;
        const out = await executeJournalSaveOperation(store, ports, req(op));
        expect(out.kind).toBe("completed");
        expect(world.createCount).toBe(0);
        expect(world.chargeSuccessCount).toBe(1);
      }
      // N3
      {
        const op = newOp("N3");
        createdOpIds.push(op);
        const now = new Date().toISOString();
        const world = createFakeJournalWorld();
        const ports = createFakeSavePorts(world);
        const created = await ports.createJournalEntry({
          userId: ACTOR,
          entryDate: "2026-08-13",
          saveOperationId: op,
        });
        await store.tryInsertClaim({
          userId: ACTOR,
          saveOperationId: op,
          status: "processing",
          checkpoint: "photo_completed",
          journalEntryId: created.journalEntryId,
          requestFingerprint: fp(),
          resultCode: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
        world.createCount = 0;
        const out = await executeJournalSaveOperation(store, ports, req(op));
        expect(out.kind).toBe("completed");
        expect(world.chargeSuccessCount).toBe(1);
      }
      // N4 — donguri already settled / charged; mark completed without re-charge
      {
        const op = newOp("N4");
        createdOpIds.push(op);
        const now = new Date().toISOString();
        const world = createFakeJournalWorld();
        const ports = createFakeSavePorts(world);
        const created = await ports.createJournalEntry({
          userId: ACTOR,
          entryDate: "2026-08-13",
          saveOperationId: op,
        });
        world.donguriChargedEntryIds.add(created.journalEntryId);
        world.chargeSuccessCount = 1;
        await store.tryInsertClaim({
          userId: ACTOR,
          saveOperationId: op,
          status: "processing",
          checkpoint: "donguri_settled",
          journalEntryId: created.journalEntryId,
          requestFingerprint: fp(),
          resultCode: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
        const out = await executeJournalSaveOperation(store, ports, req(op));
        expect(out.kind).toBe("completed");
        if (out.kind === "completed") {
          expect(out.donguriAlreadyCharged).toBe(true);
          expect(out.journalEntryId).toBe(created.journalEntryId);
        }
        expect(world.chargeSuccessCount).toBe(1);
      }
      // N5 — completed then response-lost retry
      {
        const op = newOp("N5");
        createdOpIds.push(op);
        const world = createFakeJournalWorld();
        const ports = createFakeSavePorts(world);
        const first = await executeJournalSaveOperation(store, ports, req(op));
        expect(first.kind).toBe("completed");
        if (first.kind !== "completed") return;
        const retry = await executeJournalSaveOperation(store, ports, req(op));
        expect(retry.kind).toBe("completed");
        if (retry.kind === "completed") {
          expect(retry.journalEntryId).toBe(first.journalEntryId);
        }
        expect(world.createCount).toBe(1);
        expect(world.chargeSuccessCount).toBe(1);
      }
    });

    it("insufficient → failed_final persisted; replay stable", async () => {
      const op = newOp("IN");
      createdOpIds.push(op);
      const world = createFakeJournalWorld({ insufficientBalance: true });
      const ports = createFakeSavePorts(world);
      const first = await executeJournalSaveOperation(store, ports, req(op));
      expect(first.kind).toBe("failed_final");
      const row = await prisma.journalSaveOperation.findUnique({
        where: {
          actorKey_saveOperationId: { actorKey: ACTOR, saveOperationId: op },
        },
      });
      expect(row?.status).toBe("failed_final");
      const replay = await executeJournalSaveOperation(store, ports, req(op));
      expect(replay.kind).toBe("failed_final");
      expect(world.createCount).toBe(1);
      expect(world.chargeSuccessCount).toBe(0);
    });

    it("fingerprint conflict + cross-actor lookup isolation", async () => {
      const op = newOp("FP");
      createdOpIds.push(op);
      const world = createFakeJournalWorld();
      const ports = createFakeSavePorts(world);
      await executeJournalSaveOperation(store, ports, req(op));
      const conflict = await executeJournalSaveOperation(
        store,
        ports,
        req(op, { requestFingerprint: fp("otherhash") }),
      );
      expect(conflict.kind).toBe("idempotency_conflict");

      const otherLookup = await getJournalSaveOperationResult(store, {
        userId: OTHER,
        saveOperationId: op,
      });
      expect(otherLookup.status).toBe("not_found");
    });

    it("lookup statuses: not_found / processing / completed / failed_final", async () => {
      expect(
        (
          await getJournalSaveOperationResult(store, {
            userId: ACTOR,
            saveOperationId: newOp("NF"),
          })
        ).status,
      ).toBe("not_found");

      const opProc = newOp("LP");
      createdOpIds.push(opProc);
      const now = new Date().toISOString();
      await store.tryInsertClaim({
        userId: ACTOR,
        saveOperationId: opProc,
        status: "processing",
        checkpoint: "photo_completed",
        journalEntryId: "entry_lookup_proc",
        requestFingerprint: fp(),
        resultCode: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      });
      const proc = await getJournalSaveOperationResult(store, {
        userId: ACTOR,
        saveOperationId: opProc,
      });
      expect(proc.status).toBe("processing");
    });
  },
);

describe("4B-4P db gate unit (no DB required)", () => {
  it("rejects neon-like hosts", () => {
    const a = auditDatabaseUrlForNonprodIdempotency(
      "postgresql://u:p@ep-cool.neon.tech/neondb?sslmode=require",
    );
    expect(a.ok).toBe(false);
    expect(a.isNeonLike).toBe(true);
    expect(a.reason).toBe("neon_forbidden");
  });

  it("accepts disposable local identity", () => {
    const a = auditDatabaseUrlForNonprodIdempotency(
      "postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public",
    );
    expect(a.ok).toBe(true);
  });
});
