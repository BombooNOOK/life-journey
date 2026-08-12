/**
 * Offline Local Storage Diagnostics entry (local asset Cap mode).
 * Developer-only; not a product surface.
 */

import { Capacitor } from "@capacitor/core";

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { ServerToLocalCandidateCopyService } from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import { ServerAuthoritativeWriteThroughMirrorService } from "@/lib/local-first/journal/secureCopy/ServerAuthoritativeWriteThroughMirrorService";
import { runWriteThroughMirrorPoc, WRITE_THROUGH_POC_ENTRY_ID } from "@/lib/local-first/journal/secureCopy/runWriteThroughMirrorPoc";
import { FAILURE_INJECTION_MISSING_ENTRY_ID } from "@/lib/local-first/journal/secureCopy/types";
import {
  deleteJournalMediaRelative,
  resolveJournalMediaUri,
} from "@/lib/local-first/journal/mediaStore";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import {
  inspectPluginDbKeyAccessibility,
  listSqliteArtifactsReadOnly,
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

  $("btn-inspect-secure-candidate").addEventListener("click", () => {
    void (async () => {
      const capacity = await readAvailableBytesOrNull();
      const inspection = await LocalJournalSecureBootstrapper.inspect();
      const report = {
        readOnly: true,
        availableBytes: capacity.availableBytes,
        candidate: inspection,
      };
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `candidate exists=${String(inspection.exists)} encrypted=${String(inspection.encrypted)} health=${inspection.health.status}`,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-bootstrap-secure-candidate").addEventListener("click", () => {
    void (async () => {
      setStatus("encrypted candidate bootstrap…（ljd_local_journal は触らない）");
      const result = await LocalJournalSecureBootstrapper.bootstrap();
      $("security-report").textContent = JSON.stringify(result, null, 2);
      setStatus(`bootstrap ${result.status} ${result.detail}`, !result.ok);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-copy-to-secure-candidate").addEventListener("click", () => {
    void (async () => {
      const raw = ($("copy-entry-ids") as HTMLTextAreaElement).value;
      setStatus("explicit IDs → encrypted candidate（本番 journal / 自動検索なし）");
      const result = await ServerToLocalCandidateCopyService.copyExplicitIds(raw);
      const report = {
        targetDb: result.targetDb,
        copied: result.copied,
        alreadyPresent: result.alreadyPresent,
        sourceChanged: result.sourceChanged,
        failed: result.failed,
        blockedReason: result.blockedReason,
        candidateEncrypted: result.candidateEncrypted,
        completeProtection: result.completeProtection,
        backupExcluded: result.backupExcluded,
        rowCounts: result.rowCounts,
        results: result.results.map((item) => ({
          status: item.status,
          serverId: item.serverId,
          stableId: item.stableId,
          legacyServerId: item.legacyServerId,
          detail: item.detail,
          contentHash: item.fingerprint?.contentHash ?? null,
          photoHash: item.fingerprint?.photoHash ?? null,
        })),
        failureInjectionId: FAILURE_INJECTION_MISSING_ENTRY_ID,
      };
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `copy copied=${result.copied} present=${result.alreadyPresent} changed=${result.sourceChanged} failed=${result.failed} blocked=${String(result.blockedReason)}`,
        !result.ok || Boolean(result.blockedReason),
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-write-through-mirror").addEventListener("click", () => {
    void (async () => {
      const id = ($("write-through-entry-id") as HTMLInputElement).value.trim();
      if (!id) {
        setStatus("明示 Server entry ID が必要です（自動検索しません）。", true);
        return;
      }
      setStatus("write-through mirror…（Server GET → candidate / 本番 save 未接続）");
      const result = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(id);
      $("security-report").textContent = JSON.stringify(
        {
          result: result.result,
          serverEntryId: result.serverEntryId,
          needsRetry: result.needsRetry,
          stableId: result.stableId,
          legacyServerId: result.legacyServerId,
          detail: result.detail,
          contentHash: result.fingerprint?.contentHash ?? null,
          photoHash: result.fingerprint?.photoHash ?? null,
          rowCounts: result.rowCounts,
          injectedLocalFailure: result.injectedLocalFailure,
        },
        null,
        2,
      );
      setStatus(
        `mirror result=${result.result} needsRetry=${String(result.needsRetry)}`,
        !result.ok,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-write-through-poc").addEventListener("click", () => {
    void (async () => {
      const id = ($("write-through-entry-id") as HTMLInputElement).value.trim();
      if (!id) {
        setStatus("W1–W10 には明示テスト entry ID が必要です。", true);
        return;
      }
      setStatus("write-through PoC W1–W10…");
      const report = await runWriteThroughMirrorPoc({ entryId: id });
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(
        `write-through fail=${fails} idSet=${Boolean(report.entryId)} untouched=${String(report.actualJournalUntouched)}`,
        fails > 0,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
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
    setStatus("write-through PoC W1–W10 実行中…（明示1件のみ / candidate 固定）");
    await LocalJournalSecureBootstrapper.bootstrap();
    const report = await runWriteThroughMirrorPoc({
      entryId: WRITE_THROUGH_POC_ENTRY_ID,
    });
    $("security-report").textContent = JSON.stringify(report, null, 2);
    const fails = report.steps.filter((s) => s.status === "fail").length;
    setStatus(
      `write-through fail=${fails} id=${WRITE_THROUGH_POC_ENTRY_ID} untouched=${String(report.actualJournalUntouched)}`,
      fails > 0,
    );
  } catch (err) {
    setStatus(`初期化失敗: ${safeErrorMessage(err)}`, true);
  }
}

void boot();
