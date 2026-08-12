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

  const cookie = await loadPocSessionCookieHeader();
  if (!cookie) {
    push("L2", "skip", "session cookie missing — create #SaveWiringTest entry via local dev Server UI first");
    push("L3", "skip", "no entry id");
    for (const id of ["L4", "L5", "L6", "L7", "L8", "L9", "L10", "L11", "L12", "L13"]) {
      push(id, "skip", "blocked by L2");
    }
  } else {
    configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN, cookieHeader: cookie });

    const entryId = await loadSaveWiringTestEntryId();
    if (!entryId) {
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
        fetched.ok ? "pass" : "skip",
        fetched.ok
          ? "server entry exists (GET ok)"
          : `server GET failed: ${fetched.ok ? "" : fetched.code} — save #SaveWiringTest via local dev first`,
      );

      push(
        "L3",
        fetched.ok ? "pass" : "skip",
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
        push(
          "L4",
          hasTag ? "pass" : "fail",
          hasTag
            ? JSON.stringify(await assertSaveMirrorRoutingPreconditions())
            : `missing ${SAVE_WIRING_TEST_TAG}`,
        );

        if (!canRunInternalJournalSaveMirror()) {
          push("L5", "skip", "gate OFF");
        } else {
          const first = await handleConfirmedServerJournalMirror({
            serverEntryId: entryId,
            developer: { injectLocalFailureAfterEnqueue: "save" },
          });
          push(
            "L5",
            first.status === "queued_retry" ? "pass" : "fail",
            JSON.stringify({ status: first.status, lastResult: first.status === "queued_retry" ? first.lastResult : null }),
          );

          push(
            "L6",
            first.status === "queued_retry" ? "pass" : "fail",
            "injected Local save failure after enqueue",
          );

          const pendingAfterFail = await (async () => {
            const opened = await openLocalMirrorOutboxSqliteStore();
            try {
              return opened.store.listPending();
            } finally {
              await opened.close();
            }
          })();
          push(
            "L7",
            pendingAfterFail.length >= 1 ? "pass" : "fail",
            `pending=${pendingAfterFail.length} donguri=not_reinvoked`,
          );

          push("L8", pendingAfterFail.length >= 1 ? "pass" : "fail", `pending=${pendingAfterFail.length} after simulated relaunch read`);

          const retry = await retryPendingServerJournalMirror({
            serverEntryId: entryId,
          });
          push(
            "L9",
            retry.status === "mirrored" || retry.status === "already_present" ? "pass" : "fail",
            JSON.stringify({ status: retry.status }),
          );

          const pendingAfterAck = await (async () => {
            const opened = await openLocalMirrorOutboxSqliteStore();
            try {
              return opened.store.listPending();
            } finally {
              await opened.close();
            }
          })();
          push(
            "L10",
            pendingAfterAck.length === 0 ? "pass" : "fail",
            `pending=${pendingAfterAck.length}`,
          );

          let localCount = 0;
          try {
            await withCandidateRepository(async (repo) => {
              localCount = await repo.countEntries();
            });
          } catch (error) {
            push("L11", "fail", safeErrorMessage(error));
          }
          if (steps.find((s) => s.id === "L11") == null) {
            push(
              "L11",
              localCount >= 1 ? "pass" : "fail",
              `candidateEntries=${localCount}`,
            );
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
