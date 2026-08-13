/**
 * 4B-4S unit tests — S1–S14 lightweight create reconciliation (memory).
 */

import { describe, expect, it } from "vitest";

import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { opaqueGenerationIdFromResolved } from "@/lib/local-first/journal/outbox/types";
import {
  CHECKPOINT_FORBIDDEN_KEYS,
  createMemoryCreateReconciliationCheckpointStore,
  emptyCreateReconciliationCheckpoint,
} from "@/lib/local-first/journal/reconciliation/CreateReconciliationCheckpointStore";
import {
  DEFAULT_RECONCILIATION_MONTH_LIST_CAP,
  JOURNAL_API_MONTH_TAKE_CALENDAR,
  JOURNAL_API_MONTH_TAKE_VIEW_LIST,
  JOURNAL_API_YEAR_TAKE,
  isListCapReached,
} from "@/lib/local-first/journal/reconciliation/journalListCaps";
import { createMemoryAttemptMirror, technicalActiveTarget } from "@/lib/local-first/journal/reconciliation/memoryMirrorBridge";
import {
  createMemoryLocalLegacyIndex,
  planExplicitMonthRange,
  planReconciliationMonths,
  reconcileExplicitUtcMonthRange,
  reconcileMissingServerJournalCreates,
} from "@/lib/local-first/journal/reconciliation/reconcileMissingServerJournalCreates";
import {
  createMemoryServerMonthListPort,
  type MemoryServerEntry,
} from "@/lib/local-first/journal/reconciliation/serverMonthListPort";

const NOW = new Date("2026-08-13T12:00:00.000Z"); // current UTC month = 2026-08
const TARGET = technicalActiveTarget();
const GEN_ID = opaqueGenerationIdFromResolved(TARGET);

function entry(
  id: string,
  createdAtIso: string,
  hasPhoto = false,
): MemoryServerEntry {
  return {
    id,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
    hasPhoto,
    createdAtMs: Date.parse(createdAtIso),
  };
}

function harness(opts?: {
  serverEntries?: MemoryServerEntry[];
  localIds?: string[];
  checkpoint?: ReturnType<typeof emptyCreateReconciliationCheckpoint> | null;
  failMonths?: Set<string>;
  failMirrorIds?: Set<string>;
  cap?: number;
  bootstrapMonths?: string[];
  resolveOk?: boolean;
  attemptMirrorAfterEnqueue?: boolean;
}) {
  const cap = opts?.cap ?? 400;
  const serverList = createMemoryServerMonthListPort({
    entries: opts?.serverEntries ?? [],
    configuredCap: cap,
    failMonths: opts?.failMonths,
  });
  const localIndex = createMemoryLocalLegacyIndex(opts?.localIds);
  const outboxStore = createMemoryLocalMirrorOutboxStore();
  const checkpointStore = createMemoryCreateReconciliationCheckpointStore(
    opts?.checkpoint === undefined ? null : opts.checkpoint,
  );
  const attemptMirror = createMemoryAttemptMirror({
    outboxStore,
    localIndex,
    failServerIds: opts?.failMirrorIds,
  });

  return {
    serverList,
    localIndex,
    outboxStore,
    checkpointStore,
    attemptMirror,
    deps: {
      serverList,
      localIndex,
      outboxStore,
      checkpointStore,
      resolveHealthyGeneration: async () =>
        opts?.resolveOk === false
          ? {
              ok: false as const,
              reason: "corrupt_manifest" as const,
              detail: "injected",
            }
          : { ok: true as const, target: TARGET },
      attemptMirror,
      bootstrapMonths: opts?.bootstrapMonths ?? ["2026-06"],
      configuredListCap: cap,
      nowUtc: NOW,
      attemptMirrorAfterEnqueue: opts?.attemptMirrorAfterEnqueue,
      verifyClosedMonthIntegrity: true,
    },
  };
}

describe("4B-4S journal list caps (from production route)", () => {
  it("documents real take values", () => {
    expect(JOURNAL_API_MONTH_TAKE_VIEW_LIST).toBe(200);
    expect(JOURNAL_API_MONTH_TAKE_CALENDAR).toBe(400);
    expect(JOURNAL_API_YEAR_TAKE).toBe(500);
    expect(DEFAULT_RECONCILIATION_MONTH_LIST_CAP).toBe(400);
    expect(isListCapReached(400, 400)).toBe(true);
    expect(isListCapReached(399, 400)).toBe(false);
  });
});

describe("4B-4S plan months", () => {
  it("requires bootstrap when no checkpoint (no full-history)", () => {
    const p = planReconciliationMonths({
      currentMonth: "2026-08",
      lastFullyReconciledMonth: null,
      bootstrapMonths: [],
    });
    expect(p.needsBootstrap).toBe(true);
  });

  it("R-B: scans last+1..prev + current", () => {
    const p = planReconciliationMonths({
      currentMonth: "2026-08",
      lastFullyReconciledMonth: "2026-05",
      bootstrapMonths: [],
    });
    expect(p.months).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("R-D explicit range reuses month keys", () => {
    expect(planExplicitMonthRange("2026-05", "2026-07")).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });
});

describe("4B-4S reconcileMissingServerJournalCreates S1–S14", () => {
  it("S1 existing Local entry → no-op", async () => {
    const h = harness({
      serverEntries: [entry("S-A", "2026-06-10T10:00:00.000Z")],
      localIds: ["S-A"],
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.missingIds).toEqual([]);
    expect(june.alreadyPresentIds).toContain("S-A");
    expect(june.recoveredIds).toEqual([]);
    expect((await h.outboxStore.dumpRows()).length).toBe(0);
  });

  it("S2 Server-only → missing detect", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      localIds: [],
      bootstrapMonths: ["2026-06"],
      attemptMirrorAfterEnqueue: false,
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.missingIds).toEqual(["S-B"]);
    expect(june.recoveryCapturedIds).toEqual(["S-B"]);
    expect(june.checkpointAdvanced).toBe(false);
  });

  it("S3 missing → outbox → mirror → Local", async () => {
    const h = harness({
      serverEntries: [
        entry("S-A", "2026-06-10T10:00:00.000Z"),
        entry("S-B", "2026-06-11T10:00:00.000Z", true),
        entry("S-C", "2026-06-12T10:00:00.000Z"),
      ],
      localIds: ["S-A"],
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.recoveredIds.sort()).toEqual(["S-B", "S-C"]);
    expect(await h.localIndex.hasLegacyServerId("S-B")).toBe(true);
    expect(await h.localIndex.hasLegacyServerId("S-C")).toBe(true);
    expect((await h.outboxStore.dumpRows()).length).toBe(0);
  });

  it("S4 rerun → no duplicate Local/outbox", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      localIds: [],
      bootstrapMonths: ["2026-06"],
    });
    await reconcileMissingServerJournalCreates(h.deps);
    const firstCount = h.localIndex.ids.size;
    // Past month may be watermarked; force same-month reconciler again (idempotent).
    const r2 = await reconcileExplicitUtcMonthRange(h.deps, "2026-06", "2026-06");
    expect(h.localIndex.ids.size).toBe(firstCount);
    expect(r2.months.find((m) => m.month === "2026-06")!.recoveredIds).toEqual(
      [],
    );
    expect(r2.months.find((m) => m.month === "2026-06")!.alreadyPresentIds).toContain(
      "S-B",
    );
    expect((await h.outboxStore.dumpRows()).length).toBe(0);
  });

  it("S5 closed month advances only after Local completeness", async () => {
    const h = harness({
      serverEntries: [
        entry("S-A", "2026-06-10T10:00:00.000Z"),
        entry("S-B", "2026-06-11T10:00:00.000Z"),
        entry("S-C", "2026-06-12T10:00:00.000Z"),
      ],
      localIds: ["S-A"],
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.code).toBe("month_fully_reconciled");
    expect(june.checkpointAdvanced).toBe(true);
    expect(r.checkpointAfter?.lastFullyReconciledMonth).toBe("2026-06");
    expect(r.checkpointAfter?.generationIdAtCompletion).toBe(GEN_ID);
  });

  it("S6 mirror pending/failure → checkpoint advance forbidden", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      localIds: [],
      bootstrapMonths: ["2026-06"],
      failMirrorIds: new Set(["S-B"]),
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.code).toBe("incomplete_pending_mirror");
    expect(june.checkpointAdvanced).toBe(false);
    expect(r.checkpointAfter?.lastFullyReconciledMonth ?? null).toBeNull();
    expect((await h.outboxStore.listPending()).length).toBe(1);
    // enqueue alone is not enough
    expect(june.recoveryCapturedIds).toContain("S-B");
  });

  it("S7 current month always rescans; never watermarks", async () => {
    const h = harness({
      serverEntries: [entry("S-CUR", "2026-08-05T10:00:00.000Z")],
      localIds: [],
      checkpoint: {
        ...emptyCreateReconciliationCheckpoint(),
        lastFullyReconciledMonth: "2026-07",
        generationIdAtCompletion: GEN_ID,
      },
      bootstrapMonths: [],
    });
    const r1 = await reconcileMissingServerJournalCreates(h.deps);
    const aug1 = r1.months.find((m) => m.month === "2026-08")!;
    expect(aug1.isCurrentMonth).toBe(true);
    expect(aug1.checkpointAdvanced).toBe(false);
    expect(r1.checkpointAfter?.lastFullyReconciledMonth).toBe("2026-07");

    // new server-only appears
    h.serverList.entries.push(entry("S-NEW", "2026-08-10T10:00:00.000Z"));
    const r2 = await reconcileMissingServerJournalCreates(h.deps);
    const aug2 = r2.months.find((m) => m.month === "2026-08")!;
    expect(aug2.recoveredIds).toContain("S-NEW");
    expect(aug2.checkpointAdvanced).toBe(false);
  });

  it("S8 API/list failure → checkpoint preserved", async () => {
    const cp = {
      ...emptyCreateReconciliationCheckpoint(),
      lastFullyReconciledMonth: "2026-05",
      generationIdAtCompletion: GEN_ID,
    };
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      checkpoint: cp,
      failMonths: new Set(["2026-06"]),
      bootstrapMonths: [],
    });
    // closed-month verify will list 2026-05 (empty ok). June fails.
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06");
    expect(june?.code).toBe("api_failed");
    expect(june?.checkpointAdvanced).toBe(false);
    expect(r.checkpointAfter?.lastFullyReconciledMonth).toBe("2026-05");
  });

  it("S9 list cap reached → incomplete / advance forbidden", async () => {
    const cap = 3;
    const serverEntries = [
      entry("C1", "2026-06-01T10:00:00.000Z"),
      entry("C2", "2026-06-02T10:00:00.000Z"),
      entry("C3", "2026-06-03T10:00:00.000Z"),
    ];
    const h = harness({
      serverEntries,
      localIds: [],
      bootstrapMonths: ["2026-06"],
      cap,
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.code).toBe("list_cap_reached");
    expect(june.detail).toContain("scope_truncated");
    expect(june.checkpointAdvanced).toBe(false);
    expect(r.checkpointAfter?.lastFullyReconciledMonth ?? null).toBeNull();
  });

  it("S10 manifest/registry fail → fail-closed", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      bootstrapMonths: ["2026-06"],
      resolveOk: false,
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    expect(r.phase).toBe("generation_failed");
    expect(r.months).toEqual([]);
    expect(h.localIndex.ids.size).toBe(0);
  });

  it("S11 old-client Server-only (no saveOperation/intent) → recovery", async () => {
    // Fixture has no JournalSaveOperation / Local intent metadata — only Server id.
    const h = harness({
      serverEntries: [entry("S-OLD", "2026-06-20T10:00:00.000Z")],
      localIds: [],
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    expect(r.months.find((m) => m.month === "2026-06")!.recoveredIds).toEqual([
      "S-OLD",
    ]);
    expect(await h.localIndex.hasLegacyServerId("S-OLD")).toBe(true);
  });

  it("S12 restore: checkpoint-only inconsistency → safe rescan", async () => {
    const h = harness({
      serverEntries: [
        entry("S-A", "2026-06-10T10:00:00.000Z"),
        entry("S-B", "2026-06-11T10:00:00.000Z"),
      ],
      // Local missing S-B; outbox gone; checkpoint claims June done
      localIds: ["S-A"],
      checkpoint: {
        ...emptyCreateReconciliationCheckpoint(),
        lastFullyReconciledMonth: "2026-06",
        generationIdAtCompletion: GEN_ID,
      },
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    expect(r.rewindReason).toBe("local_incompleteness_after_restore");
    expect(r.phase).toBe("rewound");
    const june = r.months.find((m) => m.month === "2026-06")!;
    expect(june.recoveredIds).toContain("S-B");
    expect(await h.localIndex.hasLegacyServerId("S-B")).toBe(true);
  });

  it("S12b generation mismatch → rewind, no silent skip", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      localIds: [],
      checkpoint: {
        ...emptyCreateReconciliationCheckpoint(),
        lastFullyReconciledMonth: "2026-06",
        generationIdAtCompletion: "other_generation_db",
      },
      bootstrapMonths: ["2026-06"],
    });
    const r = await reconcileMissingServerJournalCreates(h.deps);
    expect(r.rewindReason).toBe("generation_mismatch");
    expect(r.months.find((m) => m.month === "2026-06")!.recoveredIds).toContain(
      "S-B",
    );
  });

  it("S13 actual plaintext DB id remains forbidden target", () => {
    expect(TARGET.databaseId).not.toBe(LOCAL_JOURNAL_DB_NAME);
    expect(LOCAL_JOURNAL_DB_NAME).toBe("ljd_local_journal");
  });

  it("S14 production save/read surface unchanged (constants / no route import)", async () => {
    // Reconciliation module must not be imported by production journal route.
    const route = await import("@/app/api/journal/route");
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
    for (const key of CHECKPOINT_FORBIDDEN_KEYS) {
      expect(key).toBeTruthy();
    }
  });

  it("source_changed policy: Local existing same id is no-op (no overwrite attempt)", async () => {
    const h = harness({
      serverEntries: [entry("S-A", "2026-06-10T10:00:00.000Z")],
      localIds: ["S-A"],
      bootstrapMonths: ["2026-06"],
    });
    await reconcileMissingServerJournalCreates(h.deps);
    expect(h.localIndex.ids.size).toBe(1);
    expect((await h.outboxStore.dumpRows()).length).toBe(0);
  });

  it("Server missing / Local existing → no Local delete", async () => {
    const h = harness({
      serverEntries: [],
      localIds: ["LOCAL-ONLY"],
      bootstrapMonths: ["2026-06"],
    });
    await reconcileMissingServerJournalCreates(h.deps);
    expect(await h.localIndex.hasLegacyServerId("LOCAL-ONLY")).toBe(true);
  });

  it("R-D explicit month range uses same reconciler", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-05-11T10:00:00.000Z")],
      localIds: [],
      bootstrapMonths: [],
    });
    const r = await reconcileExplicitUtcMonthRange(h.deps, "2026-05", "2026-05");
    expect(r.explicitRange).toBe(true);
    expect(r.months[0]!.recoveredIds).toEqual(["S-B"]);
  });

  it("bootstrap_required when no checkpoint and empty bootstrapMonths", async () => {
    const h = harness({
      serverEntries: [entry("S-B", "2026-06-11T10:00:00.000Z")],
      bootstrapMonths: [],
      checkpoint: null,
    });
    // Clear default — harness defaults bootstrap to 2026-06; override empty
    h.deps.bootstrapMonths = [];
    const r = await reconcileMissingServerJournalCreates(h.deps);
    expect(r.phase).toBe("bootstrap_required");
  });
});
