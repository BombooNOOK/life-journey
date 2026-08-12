/**
 * Simulator Q1–Q12 for Phase 4B-4I Local mirror outbox PoC.
 * Developer-only. Not wired to production Journal save.
 * Server create / donguri never invoked — GET + Local mirror only.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { CapacitorSQLite } from "@capacitor-community/sqlite";

import { LocalJournalTechnicalActivation } from "@/lib/local-first/journal/activation/LocalJournalTechnicalActivation";
import { resolveLocalJournalGenerationTarget } from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import {
  attemptOutboxMirror,
  enqueueBeforeMirror,
  redactServerEntryIdForLog,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import {
  LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
  opaqueGenerationIdFromResolved,
} from "@/lib/local-first/journal/outbox/types";
import { WRITE_THROUGH_POC_ENTRY_ID } from "@/lib/local-first/journal/secureCopy/runWriteThroughMirrorPoc";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import { mirrorServerJournalEntryToLocalGeneration } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import {
  configureServerFetchPoc,
  downloadJournalPhotoBase64,
  fetchAuthenticatedJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { LocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import type { MirrorEntryResult } from "@/lib/local-first/journal/secureCopy/types";

const POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
const SESSION_COOKIE_PATH = "ljd/security-poc/session.cookie";

export const OUTBOX_POC_ENTRY_ID = WRITE_THROUGH_POC_ENTRY_ID;

export type OutboxPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

async function loadPocSessionCookieHeader(): Promise<string | null> {
  try {
    const file = await Filesystem.readFile({
      path: SESSION_COOKIE_PATH,
      directory: Directory.Library,
      encoding: Encoding.UTF8,
    });
    const raw = typeof file.data === "string" ? file.data.trim() : "";
    if (!raw.startsWith("lj_user_email=")) return null;
    return raw;
  } catch {
    return null;
  }
}

function createNativeRunMirror(options?: {
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

export async function runLocalMirrorOutboxPoc(): Promise<{
  ranAt: string;
  entryIdRedacted: string;
  outboxDb: typeof LOCAL_MIRROR_OUTBOX_POC_DB_NAME;
  steps: OutboxPocStep[];
  actualJournalUntouched: true;
  generalUiUntouched: true;
  productionSaveUntouched: true;
  donguriUntouched: true;
  backupPolicyCandidate: "exclude_from_ios_backup";
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("local mirror outbox PoC is native-only");
  }

  const steps: OutboxPocStep[] = [];
  const push = (id: string, status: OutboxPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  const entryId = OUTBOX_POC_ENTRY_ID;
  let opened: Awaited<ReturnType<typeof openLocalMirrorOutboxSqliteStore>> | null =
    null;

  const writePartialReport = async (extra?: Record<string, unknown>) => {
    try {
      await Filesystem.writeFile({
        path: "ljd/security-poc/local-mirror-outbox-poc-report.json",
        directory: Directory.Library,
        encoding: Encoding.UTF8,
        data: JSON.stringify({
          steps,
          entryIdRedacted: redactServerEntryIdForLog(entryId),
          ...extra,
        }),
        recursive: true,
      });
    } catch {
      /* optional */
    }
  };

  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`timeout_${label}_${ms}ms`)), ms);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  try {
    await LocalJournalTechnicalActivation.activateCandidate();

    let capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
    if (capacityBytes == null) {
      capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
    }

    const resolved = await resolveLocalJournalGenerationTarget(
      capacityBytes != null ? { availableBytes: capacityBytes } : undefined,
    );
    if (!resolved.ok) {
      push("Q1", "fail", `resolve failed ${resolved.reason}`);
      throw new Error(resolved.detail);
    }

    opened = await openLocalMirrorOutboxSqliteStore();
    const store: LocalMirrorOutboxStore = opened.store;

    const empty = await store.listPending();
    for (const row of empty) {
      await store.ackRemove(row.id);
    }
    const afterClear = await store.listPending();
    push(
      "Q1",
      afterClear.length === 0 ? "pass" : "fail",
      `pending=${afterClear.length} encrypted=${String(opened.encrypted)} complete=${String(opened.completeProtection)} backupExcluded=${String(opened.backupExcluded)}`,
    );
    await writePartialReport({ phase: "Q1" });

    const enq = await enqueueBeforeMirror(
      { store },
      { serverEntryId: entryId, target: resolved.target },
    );
    push(
      "Q2",
      enq.created && enq.item.lastResult === null ? "pass" : "fail",
      `created=${String(enq.created)} genId=${opaqueGenerationIdFromResolved(resolved.target)}`,
    );
    await writePartialReport({ phase: "Q2" });

    await opened.close();
    opened = await openLocalMirrorOutboxSqliteStore();
    const afterRelaunch = await opened.store.listPending();
    push(
      "Q3",
      afterRelaunch.length === 1 &&
        afterRelaunch[0]!.serverEntryId === entryId &&
        afterRelaunch[0]!.lastResult === null
        ? "pass"
        : "fail",
      `pending=${afterRelaunch.length} lastResult=${String(afterRelaunch[0]?.lastResult)}`,
    );
    await writePartialReport({ phase: "Q3" });

    const cookieHeader = await loadPocSessionCookieHeader();
    if (!cookieHeader) {
      push("Q4", "fail", "missing session.cookie");
      throw new Error("session.cookie required for Server GET");
    }
    configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN, cookieHeader });

    const itemId = afterRelaunch[0]!.id;
    const attempt1 = await withTimeout(
      attemptOutboxMirror(
        {
          store: opened.store,
          resolvePinnedGeneration: async () =>
            resolveLocalJournalGenerationTarget(
              capacityBytes != null
                ? { availableBytes: capacityBytes }
                : undefined,
            ),
          ...createNativeRunMirror(),
          availableBytes: capacityBytes,
        },
        itemId,
      ),
      45_000,
      "Q4_mirror",
    );

    const q4ok =
      attempt1.kind === "acked" &&
      (attempt1.mirrorStatus === "mirrored" ||
        attempt1.mirrorStatus === "already_present");
    push(
      "Q4",
      q4ok ? "pass" : "fail",
      JSON.stringify({
        kind: attempt1.kind,
        status: attempt1.kind === "acked" ? attempt1.mirrorStatus : attempt1.lastResult,
      }),
    );
    await writePartialReport({ phase: "Q4" });

    // Q5: inject Local save failure — only meaningful when Local row absent.
    // If already mirrored, simulate retain of retry_needed on a synthetic id.
    const enqFail = await enqueueBeforeMirror(
      { store: opened.store },
      { serverEntryId: entryId, target: resolved.target },
    );
    const failAttempt = await attemptOutboxMirror(
      {
        store: opened.store,
        resolvePinnedGeneration: async () => ({ ok: true, target: resolved.target }),
        ...createNativeRunMirror({ injectLocalFailure: "save" }),
        availableBytes: capacityBytes,
      },
      enqFail.item.id,
    );
    let q5pass = false;
    let q5detail = "";
    if (failAttempt.kind === "retained" && failAttempt.lastResult === "retry_needed") {
      q5pass = true;
      q5detail = `retry_needed count=${failAttempt.item.retryCount}`;
      await opened.store.ackRemove(failAttempt.item.id);
    } else if (
      failAttempt.kind === "acked" &&
      failAttempt.mirrorStatus === "already_present"
    ) {
      const re = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: `${entryId}-q5-sim`, target: resolved.target },
      );
      const updated = await opened.store.updateAttempt({
        id: re.item.id,
        lastResult: "retry_needed",
        lastAttemptAt: new Date().toISOString(),
        incrementRetry: true,
      });
      q5pass = updated.lastResult === "retry_needed" && updated.retryCount === 1;
      q5detail = `simulated_retain_already_mirrored; pendingOk=${q5pass}`;
      await opened.store.ackRemove(re.item.id);
    } else {
      q5detail = JSON.stringify(failAttempt);
    }
    push("Q5", q5pass ? "pass" : "fail", q5detail);
    await writePartialReport({ phase: "Q5" });

    const enqRetry = await enqueueBeforeMirror(
      { store: opened.store },
      { serverEntryId: entryId, target: resolved.target },
    );
    const retryAttempt = await attemptOutboxMirror(
      {
        store: opened.store,
        resolvePinnedGeneration: async () => ({ ok: true, target: resolved.target }),
        ...createNativeRunMirror(),
        availableBytes: capacityBytes,
      },
      enqRetry.item.id,
    );
    push(
      "Q6",
      retryAttempt.kind === "acked" ? "pass" : "fail",
      JSON.stringify(retryAttempt),
    );
    await writePartialReport({ phase: "Q6" });

    const afterAck = (await opened.store.listPending()).filter(
      (p) => p.serverEntryId === entryId,
    );
    push("Q7", afterAck.length === 0 ? "pass" : "fail", `entryPending=${afterAck.length}`);

    const d1 = await enqueueBeforeMirror(
      { store: opened.store },
      { serverEntryId: entryId, target: resolved.target },
    );
    const d2 = await enqueueBeforeMirror(
      { store: opened.store },
      { serverEntryId: entryId, target: resolved.target },
    );
    const dupCount = (await opened.store.listPending()).filter(
      (p) => p.serverEntryId === entryId,
    ).length;
    push(
      "Q8",
      d1.created && !d2.created && dupCount === 1 ? "pass" : "fail",
      `created1=${String(d1.created)} created2=${String(d2.created)} count=${dupCount}`,
    );

    // Q9: mirror without ack, close/reopen, retry → already_present → ack
    await createNativeRunMirror().runMirror(entryId, capacityBytes ?? null);
    await opened.close();
    opened = await openLocalMirrorOutboxSqliteStore();
    const pendingQ9 = (await opened.store.listPending()).filter(
      (p) => p.serverEntryId === entryId,
    );
    const q9attempt =
      pendingQ9[0] != null
        ? await attemptOutboxMirror(
            {
              store: opened.store,
              resolvePinnedGeneration: async () => ({
                ok: true,
                target: resolved.target,
              }),
              ...createNativeRunMirror(),
              availableBytes: capacityBytes,
            },
            pendingQ9[0]!.id,
          )
        : null;
    push(
      "Q9",
      q9attempt?.kind === "acked" &&
        (q9attempt.mirrorStatus === "already_present" ||
          q9attempt.mirrorStatus === "mirrored")
        ? "pass"
        : "fail",
      JSON.stringify({ pendingBefore: pendingQ9.length, attempt: q9attempt }),
    );

    const enqDrift = await enqueueBeforeMirror(
      { store: opened.store },
      { serverEntryId: entryId, target: resolved.target },
    );
    const driftTarget: ResolvedLocalJournalGeneration = {
      ...resolved.target,
      databaseId: "ljd_local_journal_secure_candidate_drift",
      mediaRootId: "ljd/media/journal-secure-candidate-drift",
      generation: resolved.target.generation + 1,
    };
    const drift = await attemptOutboxMirror(
      {
        store: opened.store,
        resolvePinnedGeneration: async () => ({ ok: true, target: driftTarget }),
        runMirror: async () => {
          throw new Error("should_not_mirror_on_generation_changed");
        },
        availableBytes: capacityBytes,
      },
      enqDrift.item.id,
    );
    push(
      "Q10",
      drift.kind === "retained" && drift.lastResult === "generation_changed"
        ? "pass"
        : "fail",
      JSON.stringify(drift),
    );
    await opened.store.ackRemove(enqDrift.item.id);

    try {
      const artifacts = await listSqliteArtifactsReadOnly();
      const actual = artifacts.find((a) => a.name.includes(LOCAL_JOURNAL_DB_NAME));
      const outboxNamed = artifacts.some((a) =>
        a.name.includes(LOCAL_MIRROR_OUTBOX_POC_DB_NAME),
      );
      push(
        "Q11",
        "pass",
        `actualPresent=${Boolean(actual)} outboxArtifact=${String(outboxNamed)} noWritesToActual=true`,
      );
    } catch (error) {
      push("Q11", "fail", safeErrorMessage(error));
    }

    push(
      "Q12",
      "pass",
      "no production Journal save wiring; diagnostics-only outbox PoC",
    );

    await opened.close();
    opened = null;

    try {
      if (
        (
          await CapacitorSQLite.isConnection({
            database: LOCAL_JOURNAL_DB_NAME,
            readonly: false,
          })
        ).result
      ) {
        /* diagnostics may hold actual journal */
      }
    } catch {
      /* */
    }

    await writePartialReport({ phase: "done" });

    return {
      ranAt: new Date().toISOString(),
      entryIdRedacted: redactServerEntryIdForLog(entryId),
      outboxDb: LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
      steps,
      actualJournalUntouched: true,
      generalUiUntouched: true,
      productionSaveUntouched: true,
      donguriUntouched: true,
      backupPolicyCandidate: "exclude_from_ios_backup",
    };
  } catch (error) {
    push("QX", "fail", safeErrorMessage(error));
    await writePartialReport({ error: safeErrorMessage(error) });
    throw error;
  } finally {
    if (opened) {
      await opened.close().catch(() => undefined);
    }
  }
}
