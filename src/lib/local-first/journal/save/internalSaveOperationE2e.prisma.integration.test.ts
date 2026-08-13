/**
 * 4B-4Q Prisma-backed response-lost E2E (local disposable DB only).
 *
 * RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *   src/lib/local-first/journal/save/internalSaveOperationE2e.prisma.integration.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  createFakeJournalWorld,
  createFakeSavePorts,
} from "@/lib/journal/saveIdempotency/fakePorts";
import { createPrismaJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/prismaJournalSaveOperationStore";
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { createMemoryLocalSaveOperationIntentStore } from "@/lib/local-first/journal/saveIntent/memoryStore";
import {
  assertSuccessfulFinalInvariant,
  createMemoryLocalMirrorSink,
  recoverInternalSaveOperationE2e,
  runInternalSaveOperationE2e,
} from "@/lib/local-first/journal/save/internalSaveOperationE2e";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const run = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

describe.skipIf(!run)("4B-4Q Prisma response-lost E2E (local DB)", () => {
  const serverStore = createPrismaJournalSaveOperationStore(prisma);
  const opIds: string[] = [];

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1 FROM "JournalSaveOperation" LIMIT 1`;
  });

  afterAll(async () => {
    if (opIds.length) {
      await prisma.journalSaveOperation.deleteMany({
        where: { saveOperationId: { in: opIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("response lost → lookup → mirror complete; one entry/charge", async () => {
    const op = `01HX4B4QPRISMA${Date.now().toString(16)}`.slice(0, 26);
    opIds.push(op);
    const world = createFakeJournalWorld();
    const ports = createFakeSavePorts(world);
    const deps = {
      actorEmail: "4b4q-prisma@example.com",
      intentStore: createMemoryLocalSaveOperationIntentStore(),
      serverStore,
      ports,
      outboxStore: createMemoryLocalMirrorOutboxStore(),
      localMirror: createMemoryLocalMirrorSink(),
      contentHash: "prismae2e",
      entryDate: "2026-08-13",
      saveOperationId: op,
      hasPhoto: false,
    };

    const lost = await runInternalSaveOperationE2e({
      ...deps,
      crashAt: "response_lost_after_server_completed",
    });
    expect(lost.phase).toBe("response_lost");

    const recovered = await recoverInternalSaveOperationE2e({
      ...deps,
      saveOperationId: op,
      requestFingerprint: lost.requestFingerprint,
      completeMirror: true,
    });
    expect(recovered.phase).toBe("completed");
    assertSuccessfulFinalInvariant({
      result: recovered,
      journalEntryCount: world.entries.size,
      donguriChargeCount: world.chargeSuccessCount,
    });
    expect(world.createCount).toBe(1);
    expect(world.chargeSuccessCount).toBe(1);
  });
});
