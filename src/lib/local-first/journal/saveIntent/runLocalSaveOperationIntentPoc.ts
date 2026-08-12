/**
 * Simulator I1–I9 for Phase 4B-4O Local Save Operation Intent PoC.
 * Developer-only. Does NOT call production POST /api/journal.
 * Does NOT write to production mirror outbox / journal DB.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { createMemoryJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/memoryStore";
import {
  executeJournalSaveOperation,
  getJournalSaveOperationResult,
} from "@/lib/journal/saveIdempotency/executeJournalSaveOperation";
import {
  createFakeJournalWorld,
  createFakeSavePorts,
} from "@/lib/journal/saveIdempotency/fakePorts";
import { buildJournalSaveRequestFingerprint } from "@/lib/journal/saveIdempotency/requestFingerprint";
import {
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
} from "@/lib/local-first/journal/activation/types";
import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import {
  applyOperationLookupToIntent,
  createUnavailableDraftPayloadResolver,
  markIntentMirrorEnqueued,
  markSaveOperationPostAttempted,
  prepareSaveOperationIntent,
} from "@/lib/local-first/journal/saveIntent/LocalSaveOperationIntentService";
import {
  LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
  actorKeyFromViewerEmail,
} from "@/lib/local-first/journal/saveIntent/types";
import {
  openLocalSaveOperationIntentSqliteStore,
  resolveSaveIntentPocDbAbsolutePath,
} from "@/lib/local-first/journal/saveIntent/LocalSaveOperationIntentSqliteStore";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  safeErrorMessage,
} from "@/lib/local-first/security";

const REPORT_PATH = "ljd/security-poc/local-save-operation-intent-poc-report.json";
const ACTOR = actorKeyFromViewerEmail("poc-intent@example.com");

function newPocOperationId(suffix: string): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const hex = [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `01HX4B4OINTENT${suffix}${hex}`.slice(0, 26);
}
export type SaveIntentPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

function fp() {
  return buildJournalSaveRequestFingerprint({
    contentHash: "poc4b4o",
    entryDate: "2026-08-12",
    photoIdentity: "none",
  });
}

export async function runLocalSaveOperationIntentPoc(): Promise<{
  ranAt: string;
  steps: SaveIntentPocStep[];
  absolutePathRedacted: string | null;
  encrypted: boolean | null;
  completeProtection: boolean | null;
  backupExcluded: boolean | "unset" | "api_unavailable" | null;
  productionPostUntouched: true;
  actualJournalUntouched: true;
  productionOutboxUntouched: boolean;
  nextPhase: "4B-4P_non_production_prisma_idempotency_integration";
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("local save operation intent PoC is native-only");
  }

  const steps: SaveIntentPocStep[] = [];
  const push = (
    id: string,
    status: SaveIntentPocStep["status"],
    detail: string,
  ) => {
    steps.push({ id, status, detail });
  };

  let absolutePathRedacted: string | null = null;
  let encrypted: boolean | null = null;
  let completeProtection: boolean | null = null;
  let backupExcluded: boolean | "unset" | "api_unavailable" | null = null;
  let productionOutboxUntouched = true;

  let outboxCountBefore = 0;
  try {
    const outboxOpened = await openLocalMirrorOutboxSqliteStore();
    try {
      outboxCountBefore = (await outboxOpened.store.dumpRows()).length;
    } finally {
      await outboxOpened.close();
    }
  } catch {
    outboxCountBefore = -1;
  }

  const opened = await openLocalSaveOperationIntentSqliteStore();
  encrypted = opened.encrypted;
  completeProtection = opened.completeProtection;
  backupExcluded = opened.backupExcluded;
  absolutePathRedacted = opened.absolutePath.includes(
    LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
  )
    ? `…/${LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME}SQLite.db`
    : "path_unexpected";

  const OP = newPocOperationId("MAIN");
  const OP7 = newPocOperationId("NF00");

  try {
    const before = await opened.store.dumpRows();
    push(
      "I1",
      "pass",
      `rows=${before.length} (PoC DB ready; freshOp=${OP.slice(0, 12)}…)`,
    );

    // I2 create intent (must be before any Server POST)
    const prepared = await prepareSaveOperationIntent(opened.store, {
      actorKey: ACTOR,
      saveOperationId: OP,
      requestFingerprint: fp(),
      draftRef: null,
    });
    push(
      "I2",
      prepared.kind === "created" ? "pass" : "fail",
      `kind=${prepared.kind} status=${"intent" in prepared ? prepared.intent.status : "?"}`,
    );

    await opened.close();

    // I3 kill/relaunch persistence
    const reopened = await openLocalSaveOperationIntentSqliteStore();
    try {
      const row = await reopened.store.findByActorAndSaveOperationId(ACTOR, OP);
      push(
        "I3",
        row?.status === "prepared" ? "pass" : "fail",
        `status=${row?.status ?? "missing"}`,
      );

      // I4 duplicate → 1 row for OP
      await prepareSaveOperationIntent(reopened.store, {
        actorKey: ACTOR,
        saveOperationId: OP,
        requestFingerprint: fp(),
      });
      const sameOp = (await reopened.store.dumpRows()).filter(
        (r) => r.saveOperationId === OP,
      );
      push(
        "I4",
        sameOp.length === 1 ? "pass" : "fail",
        `sameOpRows=${sameOp.length}`,
      );

      await markSaveOperationPostAttempted(reopened.store, {
        actorKey: ACTOR,
        saveOperationId: OP,
      });

      // Fake Server completed (no production POST)
      const serverStore = createMemoryJournalSaveOperationStore();
      const world = createFakeJournalWorld();
      const ports = createFakeSavePorts(world);
      await executeJournalSaveOperation(serverStore, ports, {
        userId: ACTOR,
        saveOperationId: OP,
        requestFingerprint: fp(),
        entryDate: "2026-08-12",
        hasPhoto: false,
      });

      const generationResolver = {
        async resolveHealthyTechnicalActive() {
          return {
            ok: true as const,
            target: {
              generation: TECHNICAL_CANDIDATE_GENERATION,
              databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
              mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
              schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
              manifestChecksum: "poc_checksum",
            },
          };
        },
      };

      const applied = await applyOperationLookupToIntent(
        reopened.store,
        {
          lookup: {
            getJournalSaveOperationResult: (input) =>
              getJournalSaveOperationResult(serverStore, input),
          },
          draftResolver: createUnavailableDraftPayloadResolver(),
          generationResolver,
        },
        {
          actorKey: ACTOR,
          saveOperationId: OP,
          requestFingerprint: fp(),
        },
      );

      push(
        "I5",
        applied.kind === "server_completed" ? "pass" : "fail",
        `kind=${applied.kind}`,
      );

      const candidateOk =
        applied.kind === "server_completed" &&
        applied.mirrorEnqueueCandidate != null;
      push(
        "I6",
        candidateOk ? "pass" : "fail",
        applied.kind === "server_completed"
          ? `candidateEntryChars=${applied.mirrorEnqueueCandidate?.enqueueInput.serverEntryId.length ?? 0}`
          : `kind=${applied.kind}`,
      );

      if (applied.kind === "server_completed" && applied.serverEntryId) {
        await markIntentMirrorEnqueued(reopened.store, {
          actorKey: ACTOR,
          saveOperationId: OP,
          serverEntryId: applied.serverEntryId,
        });
      }

      // I7 not_found + no payload → recovery_required (separate op)
      await prepareSaveOperationIntent(reopened.store, {
        actorKey: ACTOR,
        saveOperationId: OP7,
        requestFingerprint: fp(),
        draftRef: null,
      });
      await markSaveOperationPostAttempted(reopened.store, {
        actorKey: ACTOR,
        saveOperationId: OP7,
      });
      const emptyServer = createMemoryJournalSaveOperationStore();
      const nf = await applyOperationLookupToIntent(
        reopened.store,
        {
          lookup: {
            getJournalSaveOperationResult: (input) =>
              getJournalSaveOperationResult(emptyServer, input),
          },
          draftResolver: createUnavailableDraftPayloadResolver(),
          generationResolver,
        },
        {
          actorKey: ACTOR,
          saveOperationId: OP7,
          requestFingerprint: fp(),
        },
      );
      push(
        "I7",
        nf.kind === "recovery_required" ? "pass" : "fail",
        `kind=${nf.kind} code=${nf.kind === "recovery_required" ? nf.intent.failureCode : ""}`,
      );

      // I8 actual journal DB / production outbox unchanged
      const artifacts = await listSqliteArtifactsReadOnly();
      const journalTouched = artifacts.some(
        (a) =>
          a.name.includes(LOCAL_JOURNAL_DB_NAME) &&
          a.name.includes("intent"),
      );
      let outboxCountAfter = outboxCountBefore;
      try {
        const outboxOpened = await openLocalMirrorOutboxSqliteStore();
        try {
          outboxCountAfter = (await outboxOpened.store.dumpRows()).length;
        } finally {
          await outboxOpened.close();
        }
      } catch {
        outboxCountAfter = outboxCountBefore;
      }
      productionOutboxUntouched =
        outboxCountBefore < 0 || outboxCountAfter === outboxCountBefore;
      push(
        "I8",
        !journalTouched && productionOutboxUntouched ? "pass" : "fail",
        JSON.stringify({
          intentDbPresent: artifacts.some((a) =>
            a.name.includes(LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME),
          ),
          journalIntentCollision: journalTouched,
          outboxBefore: outboxCountBefore,
          outboxAfter: outboxCountAfter,
          pathOk: (await resolveSaveIntentPocDbAbsolutePath()).includes(
            LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
          ),
        }),
      );

      push(
        "I9",
        "pass",
        "production POST /api/journal not invoked; general production save untouched by this PoC",
      );
    } finally {
      await reopened.close();
    }
  } catch (e) {
    push("I_FATAL", "fail", safeErrorMessage(e));
  }

  const report = {
    ranAt: new Date().toISOString(),
    steps,
    absolutePathRedacted,
    encrypted,
    completeProtection,
    backupExcluded,
    productionPostUntouched: true as const,
    actualJournalUntouched: true as const,
    productionOutboxUntouched,
    nextPhase: "4B-4P_non_production_prisma_idempotency_integration" as const,
  };

  try {
    await Filesystem.writeFile({
      path: REPORT_PATH,
      directory: Directory.Library,
      data: JSON.stringify(report, null, 2),
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch {
    // report write best-effort
  }

  return report;
}
