/**
 * Optional local Postgres fixture for 4B-4S old-client insurance.
 *
 * RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *   src/lib/local-first/journal/reconciliation/createReconciliation.prisma.integration.test.ts
 *
 * Hard gate: 127.0.0.1:5433/ljd_dev only. No Neon. No JournalSaveOperation row.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  assertLocalDisposableDatabaseUrl,
  auditDatabaseUrlForNonprodIdempotency,
} from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { prisma } from "@/lib/db";
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { createMemoryCreateReconciliationCheckpointStore } from "@/lib/local-first/journal/reconciliation/CreateReconciliationCheckpointStore";
import { JOURNAL_API_MONTH_TAKE_CALENDAR } from "@/lib/local-first/journal/reconciliation/journalListCaps";
import { createMemoryAttemptMirror, technicalActiveTarget } from "@/lib/local-first/journal/reconciliation/memoryMirrorBridge";
import { createPrismaServerMonthListPort } from "@/lib/local-first/journal/reconciliation/prismaServerMonthListPort";
import {
  createMemoryLocalLegacyIndex,
  reconcileMissingServerJournalCreates,
} from "@/lib/local-first/journal/reconciliation/reconcileMissingServerJournalCreates";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runIntegration =
  process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const EMAIL = "4b4s-recon-fixture@example.com";
const PROFILE = "4b4s-poc";

describe.skipIf(!runIntegration)(
  "4B-4S Prisma Server-only fixture (local disposable)",
  () => {
    const createdIds: string[] = [];

    beforeAll(async () => {
      assertLocalDisposableDatabaseUrl(process.env.DATABASE_URL);
    });

    afterAll(async () => {
      if (createdIds.length) {
        await prisma.journalEntry.deleteMany({
          where: { id: { in: createdIds } },
        });
      }
      // No JournalSaveOperation rows expected / created for old-client fixture
    });

    it("lists old-client Server-only entry and mirrors via reconciliation", async () => {
      const row = await prisma.journalEntry.create({
        data: {
          email: EMAIL,
          profileId: PROFILE,
          content: "4B-4S fixture S-OLD #4B4STest",
          createdAt: new Date("2026-06-18T08:00:00.000Z"),
          mood: "calm",
          activity: "record_anyway",
          companionType: "owl",
          photoDataUrl: "data:image/png;base64,AAAA",
        },
      });
      createdIds.push(row.id);

      // Prove no save-operation metadata (old client)
      const ops = await prisma.journalSaveOperation.count({
        where: { actorKey: EMAIL },
      }).catch(() => 0);
      expect(ops).toBe(0);

      const serverList = createPrismaServerMonthListPort({
        prisma,
        email: EMAIL,
        profileId: PROFILE,
        configuredCap: JOURNAL_API_MONTH_TAKE_CALENDAR,
      });
      const listed = await serverList.listByUtcMonth("2026-06");
      expect(listed.ok).toBe(true);
      if (!listed.ok) return;
      expect(listed.entries.some((e) => e.id === row.id)).toBe(true);
      expect(listed.entries.find((e) => e.id === row.id)?.hasPhoto).toBe(true);

      const localIndex = createMemoryLocalLegacyIndex();
      const outboxStore = createMemoryLocalMirrorOutboxStore();
      const checkpointStore = createMemoryCreateReconciliationCheckpointStore(null);
      const target = technicalActiveTarget();
      const r = await reconcileMissingServerJournalCreates({
        serverList,
        localIndex,
        outboxStore,
        checkpointStore,
        resolveHealthyGeneration: async () => ({ ok: true, target }),
        attemptMirror: createMemoryAttemptMirror({ outboxStore, localIndex }),
        bootstrapMonths: ["2026-06"],
        configuredListCap: JOURNAL_API_MONTH_TAKE_CALENDAR,
        nowUtc: new Date("2026-08-13T12:00:00.000Z"),
      });

      expect(await localIndex.hasLegacyServerId(row.id)).toBe(true);
      expect(
        r.months.find((m) => m.month === "2026-06")?.recoveredIds,
      ).toContain(row.id);
    });
  },
);
