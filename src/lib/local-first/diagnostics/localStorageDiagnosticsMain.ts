/**
 * Offline Local Storage Diagnostics entry (local asset Cap mode).
 * Developer-only; not a product surface.
 */

import { Capacitor } from "@capacitor/core";

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import {
  deleteJournalMediaRelative,
  resolveJournalMediaUri,
} from "@/lib/local-first/journal/mediaStore";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import {
  getSaveIntentStoreBootstrapDiagnosticStage,
  initializeNativeClientSaveOperationIntentStore,
  initializeSaveIntentStore,
  prepareClientSaveOperationIntent,
} from "@/lib/journal/clientSaveIntent";
import type { ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent";
import { CLIENT_SAVE_OPERATION_INTENT_DB_NAME } from "@/lib/journal/clientSaveIntent/types";
import {
  inspectPluginDbKeyAccessibility,
  isPluginEncryptionSecretStored,
  listSqliteArtifactsReadOnly,
  pluginRejectsDifferentEncryptionSecret,
  readAvailableBytesOrNull,
  resolveLjdApplicationSupportDir,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { inspectFileProtection } from "@/lib/local-first/security/fileProtection";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function setStatus(message: string, isError = false): void {
  const el = $("status");
  el.textContent = message;
  el.className = isError ? "status err" : "status ok";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inMemoryDifferentSecretCandidate(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const AI2_RESTART_ACTOR = "ai2-restart@ljd.invalid";
const AI2_LIFECYCLE_ACTOR = "ai2-lifecycle@ljd.invalid";
const AI2_DELETE_ACTOR = "ai2-delete@ljd.invalid";
const AI2_OTHER_ACTOR = "ai2-other@ljd.invalid";

async function prepareProbeIntent(
  store: Awaited<ReturnType<typeof initializeSaveIntentStore>> & { status: "ready" },
  viewerEmail: string,
  saveOperationId: string,
): Promise<ClientSaveOperationIntent> {
  const prepared = await prepareClientSaveOperationIntent(store.store, {
    viewerEmail,
    saveOperationId,
    requestFingerprint: "0".repeat(64),
    draftRef: "diagnostic_metadata_only",
  });
  return prepared.intent;
}

async function runSecureSaveIntentProbe(
  bootstrap: Awaited<ReturnType<typeof initializeSaveIntentStore>> & { status: "ready" },
): Promise<Record<string, boolean>> {
  const store = bootstrap.store;
  const restartIntent = await prepareProbeIntent(
    bootstrap,
    AI2_RESTART_ACTOR,
    "ai2_restart_intent_0000000001",
  );
  const lifecycle = await prepareProbeIntent(
    bootstrap,
    AI2_LIFECYCLE_ACTOR,
    "ai2_lifecycle_intent_00000001",
  );
  let completed = lifecycle;
  if (completed.status === "prepared") {
    completed = await store.update({ ...completed, status: "awaiting_result" });
    completed = await store.update({
      ...completed,
      status: "server_completed",
      serverEntryId: "diagnostic_entry",
    });
    completed = await store.update({ ...completed, status: "completed" });
  }
  let terminalRewindRejected = false;
  try {
    await store.update({ ...completed, status: "awaiting_result" });
  } catch {
    terminalRewindRejected = true;
  }
  let recoveryFailed = await prepareProbeIntent(
    bootstrap,
    AI2_LIFECYCLE_ACTOR,
    "ai2_failed_intent_000000000001",
  );
  if (recoveryFailed.status === "prepared") {
    recoveryFailed = await store.update({ ...recoveryFailed, status: "recovery_required" });
    recoveryFailed = await store.update({ ...recoveryFailed, status: "failed_final" });
  }

  await prepareProbeIntent(bootstrap, AI2_DELETE_ACTOR, "ai2_delete_intent_00000000001");
  await prepareProbeIntent(bootstrap, AI2_OTHER_ACTOR, "ai2_other_intent_000000000001");
  const deleted = await store.deleteByActor(AI2_DELETE_ACTOR);
  const otherRetained =
    (await store.findByActorAndSaveOperationId(
      AI2_OTHER_ACTOR,
      "ai2_other_intent_000000000001",
    )) != null;
  await store.deleteByActor(AI2_OTHER_ACTOR);

  return {
    restartIntentPrepared:
      restartIntent.status === "prepared" &&
      (await store.findByActorAndSaveOperationId(
        AI2_RESTART_ACTOR,
        "ai2_restart_intent_0000000001",
      )) != null,
    lifecycleCompleted: completed.status === "completed",
    recoveryAndFailedFinal: recoveryFailed.status === "failed_final",
    terminalRewindRejected,
    pendingByActor:
      (await store.listRecoverableByActor(AI2_RESTART_ACTOR)).some(
        (intent) => intent.saveOperationId === "ai2_restart_intent_0000000001",
      ),
    actorIsolation:
      (await store.findByActorAndSaveOperationId(
        AI2_OTHER_ACTOR,
        "ai2_restart_intent_0000000001",
      )) == null,
    deleteByActor: deleted === 1 && otherRetained,
  };
}

async function inspectSecureIntentFileAttributes(): Promise<{
  exists: boolean;
  backupExcluded: boolean | string;
  fileProtection: string;
}> {
  const location = await resolveLjdApplicationSupportDir();
  const attrs = await inspectFileProtection(
    `${location.ljdApplicationSupportDir}/${CLIENT_SAVE_OPERATION_INTENT_DB_NAME}SQLite.db`,
  );
  return {
    exists: attrs.exists,
    backupExcluded: attrs.isExcludedFromBackup,
    fileProtection: attrs.fileProtection,
  };
}

async function renderEntries(): Promise<void> {
  const listEl = $("list");
  const previewEl = $("preview") as HTMLImageElement;
  listEl.innerHTML = "";
  previewEl.removeAttribute("src");
  previewEl.hidden = true;

  const entries = await JournalRepository.list();
  if (entries.length === 0) {
    listEl.innerHTML =
      "<p class='muted'>Local Journal は空です。remote shell の /preview/local-storage-diagnostics で初期化・診断してください。</p>";
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(entry.title)}</h3>
      <p class="meta">stableId: ${escapeHtml(entry.stableId)}</p>
      <p class="meta">legacyServerId: ${escapeHtml(entry.legacyServerId ?? "(none)")}</p>
      <p class="meta">source: ${escapeHtml(entry.source)}</p>
      <p class="meta">dateKey: ${escapeHtml(entry.dateKey)}</p>
      <p class="meta">tags: ${escapeHtml(entry.tags.join(" "))}</p>
      <p class="meta">media: ${escapeHtml(
        entry.mediaRefs.map((m) => m.relativePath).join(", ") || "(none)",
      )}</p>
    `;
    listEl.appendChild(card);
    const first = entry.mediaRefs[0];
    if (first) {
      try {
        previewEl.src = await resolveJournalMediaUri(first.relativePath);
        previewEl.hidden = false;
      } catch (err) {
        setStatus(`画像URI失敗: ${String(err)}`, true);
      }
    }
  }
}

async function boot(): Promise<void> {
  $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(
    Capacitor.isNativePlatform(),
  )} diagnostics=local-storage remoteShell=false`;

  if (!Capacitor.isNativePlatform()) {
    setStatus("ネイティブ専用です。", true);
    return;
  }

  const secretWasStored = await isPluginEncryptionSecretStored();
  let keylessOpenRejected: boolean | null = null;
  if (!secretWasStored) {
    try {
      await initializeNativeClientSaveOperationIntentStore();
      keylessOpenRejected = false;
    } catch {
      keylessOpenRejected = true;
    }
  }
  const intentBootstrap = await initializeSaveIntentStore();
  const intentProbe =
    intentBootstrap.status === "ready" ? await runSecureSaveIntentProbe(intentBootstrap) : null;
  const wrongSecretRejected =
    intentBootstrap.status === "ready"
      ? await pluginRejectsDifferentEncryptionSecret(inMemoryDifferentSecretCandidate())
      : null;
  const intentFileAttributes =
    intentBootstrap.status === "ready" ? await inspectSecureIntentFileAttributes() : null;
  $("security-report").textContent = JSON.stringify(
    {
      developerOnly: true,
      secureSaveIntentBootstrap: {
        status: intentBootstrap.status,
        diagnosticStage: getSaveIntentStoreBootstrapDiagnosticStage(),
        secretWasStored,
        keylessOpenRejected,
        wrongSecretRejected,
      },
      nativeSaveIntentProbe: intentProbe,
      secureIntentFileAttributes: intentFileAttributes,
    },
    null,
    2,
  );
  if (intentBootstrap.status !== "ready") {
    setStatus(`Secure Save Intent bootstrap unavailable: ${intentBootstrap.status}`, true);
    return;
  }

  $("btn-load").addEventListener("click", () => {
    void (async () => {
      await openLocalJournalDatabase();
      await renderEntries();
      setStatus(`読込完了 count=${await JournalRepository.count()}（サーバー再取得なし）`);
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-clear").addEventListener("click", () => {
    void (async () => {
      const paths = await JournalRepository.deleteAll();
      for (const p of paths) await deleteJournalMediaRelative(p);
      await renderEntries();
      setStatus("端末Local診断データを削除（サーバー未変更）。");
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-inspect-capacity").addEventListener("click", () => {
    void (async () => {
      const capacity = await readAvailableBytesOrNull();
      let artifacts: Awaited<ReturnType<typeof listSqliteArtifactsReadOnly>> = [];
      try {
        artifacts = await listSqliteArtifactsReadOnly();
      } catch {
        artifacts = [];
      }
      const report = {
        readOnly: true,
        platform: capacity.platform,
        availableBytes: capacity.availableBytes,
        capacitySource: capacity.source,
        api: capacity.decision.known ? "available" : "unavailable",
        decision: capacity.decision.reason,
        artifacts,
      };
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `capacity api=${report.api} available=${String(capacity.availableBytes)} (no secrets/paths)`,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-inspect-attrs").addEventListener("click", () => {
    void (async () => {
      const asDir = await resolveLjdApplicationSupportDir();
      const dirAttrs = await inspectFileProtection(asDir.ljdApplicationSupportDir);
      let kc: Awaited<ReturnType<typeof inspectPluginDbKeyAccessibility>> | null =
        null;
      try {
        kc = await inspectPluginDbKeyAccessibility();
      } catch {
        kc = null;
      }
      const report = {
        readOnly: true,
        dummyCreated: false,
        applicationSupport: asDir,
        dirAttrs: {
          exists: dirAttrs.exists,
          isExcludedFromBackup: dirAttrs.isExcludedFromBackup,
          fileProtection: dirAttrs.fileProtection,
        },
        pluginKeychain: kc,
      };
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus("read-only storage attrs（secret非取得・dummy非生成）");
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  try {
    await openLocalJournalDatabase();
    await renderEntries();
    setStatus("Diagnostics準備完了（SQLite foundation + secure Save Intent store）。");
  } catch (err) {
    setStatus(`初期化失敗: ${String(err)}`, true);
  }
}

void boot();
