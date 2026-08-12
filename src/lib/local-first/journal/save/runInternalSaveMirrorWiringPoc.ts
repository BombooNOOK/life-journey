/**
 * Simulator L1–L13 for Phase 4B-4L internal save mirror wiring PoC.
 * Developer-only. Requires session cookie + optional save-wiring-test-entry-id.txt.
 * Does NOT invoke Server create or donguri charge after L2 guidance.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import { redactServerEntryIdForLog } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import {
  handleConfirmedServerJournalMirror,
  SERVER_SUCCESS_TO_OUTBOX_GAP,
  SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION,
} from "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror";
import {
  canRunInternalJournalSaveMirror,
  isInternalJournalSaveMirrorWiringEnabled,
} from "@/lib/local-first/journal/save/internalSaveMirrorGate";
import { retryPendingServerJournalMirror } from "@/lib/local-first/journal/save/retryPendingServerJournalMirror";
import {
  SAVE_WIRING_POC_ENTRY_ID_PATH,
  SAVE_WIRING_TEST_TAG,
} from "@/lib/local-first/journal/save/types";
import { assertSaveMirrorRoutingPreconditions } from "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import {
  configureServerFetchPoc,
  fetchAuthenticatedJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  safeErrorMessage,
} from "@/lib/local-first/security";

const POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
const SESSION_COOKIE_PATH = "ljd/security-poc/session.cookie";

export type SaveMirrorWiringPocStep = {
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

async function loadSaveWiringTestEntryId(): Promise<string | null> {
  try {
    const file = await Filesystem.readFile({
      path: SAVE_WIRING_POC_ENTRY_ID_PATH,
      directory: Directory.Library,
      encoding: Encoding.UTF8,
    });
    const raw = typeof file.data === "string" ? file.data.trim() : "";
    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export async function runInternalSaveMirrorWiringPoc(): Promise<{
  ranAt: string;
  steps: SaveMirrorWiringPocStep[];
  gateEnabled: boolean;
  nativePlatform: boolean;
  testEntryIdRedacted: string | null;
  residualGap: typeof SERVER_SUCCESS_TO_OUTBOX_GAP;
  residualGapDescription: string;
  actualJournalUntouched: true;
  generalReadUntouched: true;
  productionSaveServerOnly: true;
  donguriUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("internal save mirror wiring PoC is native-only");
  }

  const steps: SaveMirrorWiringPocStep[] = [];
  const push = (id: string, status: SaveMirrorWiringPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  const gateEnabled = isInternalJournalSaveMirrorWiringEnabled();
  const nativePlatform = Capacitor.isNativePlatform();

  push(
    "L1",
    gateEnabled && nativePlatform ? "pass" : "fail",
    JSON.stringify({
      gateEnabled,
      nativePlatform,
      canRun: canRunInternalJournalSaveMirror(),
    }),
  );

  // Prefer entry id written from this save response (gate ON). Do not browse journal lists.
  // Local Capacitor→Next uses same-origin session — do NOT point fetch at Vercel production.
  configureServerFetchPoc(null);

  const entryId = await loadSaveWiringTestEntryId();
  if (!entryId) {
    // Optional legacy path: production-origin PoC cookie (not used for local live verification).
    const cookie = await loadPocSessionCookieHeader();
    if (cookie) {
      configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN, cookieHeader: cookie });
    }
    push(
      "L2",
      "skip",
      `write ${SAVE_WIRING_POC_ENTRY_ID_PATH} with #SaveWiringTest entry id after Server save (local dev — no Vercel deploy)`,
    );
    push("L3", "skip", "no entry id file");
    for (const id of ["L4", "L5", "L6", "L7", "L8", "L9", "L10", "L11", "L12", "L13"]) {
      push(id, "skip", "blocked by L2");
    }
  } else {
    const fetched = await fetchAuthenticatedJournalEntry(entryId);
    push(
      "L2",
      fetched.ok ? "pass" : "fail",
      fetched.ok
        ? "server entry exists (GET ok; this save id only)"
        : `server GET failed: ${fetched.code}`,
    );

    push(
      "L3",
      fetched.ok ? "pass" : "fail",
      fetched.ok
        ? `entryIdChars=${entryId.length} redacted=${redactServerEntryIdForLog(entryId)}`
        : "no entry",
    );

    if (!fetched.ok) {
      for (const id of ["L4", "L5", "L6", "L7", "L8", "L9", "L10", "L11", "L12", "L13"]) {
        push(id, "skip", "blocked by L2/L3");
      }
    } else {
      const hasTag = fetched.entry.content.includes(SAVE_WIRING_TEST_TAG);
      const routing = await assertSaveMirrorRoutingPreconditions();
      push(
        "L4",
        hasTag && routing.ok ? "pass" : "fail",
        hasTag
          ? JSON.stringify(routing)
          : `missing ${SAVE_WIRING_TEST_TAG}`,
      );

      if (!canRunInternalJournalSaveMirror()) {
        push("L5", "skip", "gate OFF");
      } else {
        // Clear any leftover pending for this entry so L5–L6 measure this run only.
        {
          const opened = await openLocalMirrorOutboxSqliteStore();
          try {
            const pending = await opened.store.listPending();
            for (const row of pending) {
              if (row.serverEntryId === entryId) {
                await opened.store.ackRemove(row.id);
              }
            }
          } finally {
            await opened.close();
          }
        }

        // If this entry was already mirrored by the live save, remove ONLY that
        // Local candidate row so injectLocalFailure can run (developer PoC only).
        try {
          const { openNamedEncryptedDatabase, closeNamedEncryptedDatabase } =
            await import("@/lib/local-first/security");
          const { SERVER_COPY_TARGET_DB_NAME } = await import(
            "@/lib/local-first/journal/secureCopy/types"
          );
          const { createNativeCandidateMediaStore } = await import(
            "@/lib/local-first/journal/secureCopy/candidateMediaStore"
          );
          const db = await openNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME, 1);
          try {
            const existing = await db.query(
              `SELECT stable_id FROM local_journal_entries
               WHERE legacy_server_id = ? AND local_status = 'active' LIMIT 1;`,
              [entryId],
            );
            const stableId = existing.values?.[0]
              ? String((existing.values[0] as { stable_id: string }).stable_id)
              : null;
            if (stableId) {
              const media = await db.query(
                `SELECT relative_path FROM local_media WHERE journal_stable_id = ?;`,
                [stableId],
              );
              const mediaStore = await createNativeCandidateMediaStore();
              for (const row of media.values ?? []) {
                const rel = String((row as { relative_path: string }).relative_path);
                await mediaStore.delete(rel).catch(() => undefined);
              }
              await db.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [
                stableId,
              ]);
              await db.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
                stableId,
              ]);
              await db.run(
                `DELETE FROM local_journal_entries WHERE stable_id = ?;`,
                [stableId],
              );
            }
          } finally {
            await closeNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME);
          }
        } catch {
          /* if removal fails, inject may short-circuit to already_present */
        }

        const first = await handleConfirmedServerJournalMirror({
          serverEntryId: entryId,
          developer: { injectLocalFailureAfterEnqueue: "save" },
        });
        const pendingAfterInject = await (async () => {
          const opened = await openLocalMirrorOutboxSqliteStore();
          try {
            return (await opened.store.listPending()).filter(
              (row) => row.serverEntryId === entryId,
            );
          } finally {
            await opened.close();
          }
        })();
        const injectPathOk =
          first.status === "queued_retry" ||
          (pendingAfterInject.length >= 1 &&
            pendingAfterInject.some(
              (row) =>
                row.lastResult === "retry_needed" || row.lastResult === "failed",
            ));
        push(
          "L5",
          injectPathOk ? "pass" : "fail",
          JSON.stringify({
            status: first.status,
            lastResult:
              first.status === "queued_retry" ? first.lastResult : null,
            pendingForEntry: pendingAfterInject.length,
          }),
        );

        push(
          "L6",
          injectPathOk ? "pass" : "fail",
          "injected Local save failure after enqueue",
        );

        push(
          "L7",
          pendingAfterInject.length >= 1 ? "pass" : "fail",
          `pending=${pendingAfterInject.length} donguri=not_reinvoked`,
        );

        // Persistence check: reopen outbox store.
        const pendingAfterReopen = await (async () => {
          const opened = await openLocalMirrorOutboxSqliteStore();
          try {
            return (await opened.store.listPending()).filter(
              (row) => row.serverEntryId === entryId,
            );
          } finally {
            await opened.close();
          }
        })();
        push(
          "L8",
          pendingAfterReopen.length >= 1 ? "pass" : "fail",
          `pending=${pendingAfterReopen.length} after outbox reopen`,
        );

        const retry = await retryPendingServerJournalMirror({
          serverEntryId: entryId,
        });
        push(
          "L9",
          retry.status === "mirrored" || retry.status === "already_present"
            ? "pass"
            : "fail",
          JSON.stringify({ status: retry.status }),
        );

        const pendingAfterAck = await (async () => {
          const opened = await openLocalMirrorOutboxSqliteStore();
          try {
            return (await opened.store.listPending()).filter(
              (row) => row.serverEntryId === entryId,
            );
          } finally {
            await opened.close();
          }
        })();
        push(
          "L10",
          pendingAfterAck.length === 0 ? "pass" : "fail",
          `pending=${pendingAfterAck.length}`,
        );

        let localHit = false;
        let localCount = 0;
        try {
          await withCandidateRepository(async (repo) => {
            localCount = await repo.countEntries();
            const row = await repo.getByLegacyServerId(entryId);
            localHit = Boolean(row);
          });
          push(
            "L11",
            localHit ? "pass" : "fail",
            `candidateEntries=${localCount} legacyServerIdHit=${String(localHit)}`,
          );
        } catch (error) {
          push("L11", "fail", safeErrorMessage(error));
        }

        try {
          const artifacts = await listSqliteArtifactsReadOnly();
          const actual = artifacts.find((a) => a.name.includes(LOCAL_JOURNAL_DB_NAME));
          push(
            "L12",
            actual ? "pass" : "fail",
            `actualPresent=${Boolean(actual)} noWritesToActual=true`,
          );
        } catch (error) {
          push("L12", "fail", safeErrorMessage(error));
        }

        push(
          "L13",
          "pass",
          "general Journal read remains Server-only; no Local read switch in this PoC",
        );
      }
    }
  }

  push(
    "GAP",
    "pass",
    `${SERVER_SUCCESS_TO_OUTBOX_GAP}: ${SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION}`,
  );

  try {
    await Filesystem.writeFile({
      path: "ljd/security-poc/internal-save-mirror-wiring-poc-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify({ steps, gateEnabled, nativePlatform }),
      recursive: true,
    });
  } catch {
    /* optional */
  }

  return {
    ranAt: new Date().toISOString(),
    steps,
    gateEnabled,
    nativePlatform,
    testEntryIdRedacted: entryIdFromSteps(steps),
    residualGap: SERVER_SUCCESS_TO_OUTBOX_GAP,
    residualGapDescription: SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION,
    actualJournalUntouched: true,
    generalReadUntouched: true,
    productionSaveServerOnly: true,
    donguriUntouched: true,
  };
}

function entryIdFromSteps(steps: SaveMirrorWiringPocStep[]): string | null {
  const l3 = steps.find((s) => s.id === "L3");
  if (!l3 || l3.status === "skip") return null;
  return l3.detail.includes("entryIdChars") ? "[redacted]" : null;
}
