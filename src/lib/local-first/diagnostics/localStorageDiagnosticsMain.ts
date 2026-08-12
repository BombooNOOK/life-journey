/**
 * Offline Local Storage Diagnostics entry (local asset Cap mode).
 * Developer-only; not a product surface.
 */

import { Capacitor } from "@capacitor/core";

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { ServerToLocalCandidateCopyService } from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import { ServerAuthoritativeWriteThroughMirrorService } from "@/lib/local-first/journal/secureCopy/ServerAuthoritativeWriteThroughMirrorService";
import { runWriteThroughMirrorPoc } from "@/lib/local-first/journal/secureCopy/runWriteThroughMirrorPoc";
import { runActivationPointerPoc } from "@/lib/local-first/journal/activation/runActivationPointerPoc";
import { LocalJournalTechnicalActivation } from "@/lib/local-first/journal/activation/LocalJournalTechnicalActivation";
import { LocalJournalActivationManifestStore } from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import { runTechnicalActivationPreflight } from "@/lib/local-first/journal/activation/activationPreflight";
import { runGenerationResolverIntegrationPoc } from "@/lib/local-first/journal/generation/runGenerationResolverIntegrationPoc";
import { DeveloperResolvedGenerationMirror } from "@/lib/local-first/journal/generation/DeveloperResolvedGenerationMirror";
import { resolveLocalJournalGenerationTarget } from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import { runLocalMirrorOutboxPoc } from "@/lib/local-first/journal/outbox/runLocalMirrorOutboxPoc";
import {
  enqueueBeforeMirror,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import { initializeCurrentCandidateRegistry } from "@/lib/local-first/journal/registry/initializeCurrentCandidateRegistry";
import { openLocalGenerationRegistrySqliteStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistrySqliteStore";
import { resolveLocalJournalGenerationTargetWithRegistryValidation } from "@/lib/local-first/journal/registry/resolveWithRegistryValidation";
import { runGenerationRegistryPoc } from "@/lib/local-first/journal/registry/runGenerationRegistryPoc";
import { runInternalSaveMirrorWiringPoc } from "@/lib/local-first/journal/save/runInternalSaveMirrorWiringPoc";
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

  $("btn-read-activation-manifest").addEventListener("click", () => {
    void (async () => {
      const read = await LocalJournalActivationManifestStore.readNative();
      const resolve = await LocalJournalTechnicalActivation.resolve().catch((e) => ({
        status: "error",
        detail: safeErrorMessage(e),
      }));
      const preflight = await runTechnicalActivationPreflight();
      $("security-report").textContent = JSON.stringify(
        {
          readOnly: true,
          manifest: read,
          resolve,
          preflight: {
            ok: preflight.ok,
            failed: preflight.checks.filter((c) => !c.ok).map((c) => c.id),
            activeMediaRootId: preflight.targetMediaRootId,
          },
        },
        null,
        2,
      );
      setStatus(`manifest ${read.status} resolve=${"status" in resolve ? resolve.status : "?"}`);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-technical-activation").addEventListener("click", () => {
    void (async () => {
      setStatus("technical activation…（Repository 切替なし / candidate 固定）");
      const result = await LocalJournalTechnicalActivation.activateCandidate();
      $("security-report").textContent = JSON.stringify(result, null, 2);
      setStatus(`activation code=${result.code}`, !result.ok);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-activation-pointer-poc").addEventListener("click", () => {
    void (async () => {
      setStatus("activation pointer PoC P1–P12…");
      const report = await runActivationPointerPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(
        `activation-pointer fail=${fails} repoSwitched=${String(!report.repositoryNotSwitched)}`,
        fails > 0,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-resolve-generation").addEventListener("click", () => {
    void (async () => {
      const resolved = await resolveLocalJournalGenerationTarget();
      $("security-report").textContent = JSON.stringify(resolved, null, 2);
      setStatus(
        resolved.ok
          ? `resolved generation=${resolved.target.generation} db=${resolved.target.databaseId}`
          : `resolve denied ${resolved.reason}`,
        !resolved.ok,
      );
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-mirror-via-resolved").addEventListener("click", () => {
    void (async () => {
      const id = ($("write-through-entry-id") as HTMLInputElement).value.trim();
      if (!id) {
        setStatus("明示 Server entry ID が必要です。", true);
        return;
      }
      setStatus("resolve → mirror（developer-only / production save 未接続）");
      const result = await DeveloperResolvedGenerationMirror.mirrorExplicitId(id);
      $("security-report").textContent = JSON.stringify(
        {
          result: result.result,
          resolveDeniedReason: result.resolveDeniedReason,
          resolvedTarget: result.resolvedTarget,
          manifestChangedDuringOperation: result.manifestChangedDuringOperation,
          stableId: result.stableId,
          needsRetry: result.needsRetry,
        },
        null,
        2,
      );
      setStatus(`mirrorViaResolved result=${result.result}`, !result.ok);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-generation-resolver-poc").addEventListener("click", () => {
    void (async () => {
      setStatus("generation resolver integration PoC R1–R10…");
      const report = await runGenerationResolverIntegrationPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(`generation-resolver fail=${fails}`, fails > 0);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-outbox-list").addEventListener("click", () => {
    void (async () => {
      const opened = await openLocalMirrorOutboxSqliteStore();
      try {
        const pending = await opened.store.listPending();
        $("security-report").textContent = JSON.stringify(
          {
            readOnly: true,
            pendingCount: pending.length,
            pending: pending.map((p) => ({
              id: p.id.slice(0, 8),
              serverEntryIdRedacted: `${p.serverEntryId.slice(0, 4)}…`,
              targetGenerationId: p.targetGenerationId,
              retryCount: p.retryCount,
              lastResult: p.lastResult,
            })),
            encrypted: opened.encrypted,
            completeProtection: opened.completeProtection,
            backupExcluded: opened.backupExcluded,
          },
          null,
          2,
        );
        setStatus(`outbox pending=${pending.length}`);
      } finally {
        await opened.close();
      }
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-outbox-enqueue-fixture").addEventListener("click", () => {
    void (async () => {
      const id = ($("write-through-entry-id") as HTMLInputElement).value.trim();
      if (!id) {
        setStatus("明示 Server entry ID が必要です。", true);
        return;
      }
      const resolved = await resolveLocalJournalGenerationTarget();
      if (!resolved.ok) {
        setStatus(`resolve denied ${resolved.reason}`, true);
        return;
      }
      const opened = await openLocalMirrorOutboxSqliteStore();
      try {
        const enq = await enqueueBeforeMirror(
          { store: opened.store },
          { serverEntryId: id, target: resolved.target },
        );
        $("security-report").textContent = JSON.stringify(
          {
            created: enq.created,
            targetGenerationId: enq.item.targetGenerationId,
            lastResult: enq.item.lastResult,
            note: "enqueue-before-mirror; production save 未接続",
          },
          null,
          2,
        );
        setStatus(`outbox enqueue created=${String(enq.created)}`);
      } finally {
        await opened.close();
      }
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-outbox-poc").addEventListener("click", () => {
    void (async () => {
      setStatus("local mirror outbox PoC Q1–Q12…");
      const report = await runLocalMirrorOutboxPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(`outbox-poc fail=${fails}`, fails > 0);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-registry-list").addEventListener("click", () => {
    void (async () => {
      const opened = await openLocalGenerationRegistrySqliteStore();
      try {
        const rows = await opened.store.listAll();
        $("security-report").textContent = JSON.stringify(
          {
            readOnly: true,
            rowCount: rows.length,
            rows: rows.map((r) => ({
              generationId: r.generationId.slice(0, 8),
              databaseId: r.databaseId,
              lifecycleState: r.lifecycleState,
              legacyGenerationAlias: r.legacyGenerationAlias,
            })),
            encrypted: opened.encrypted,
            completeProtection: opened.completeProtection,
            backupIncluded: opened.backupIncluded,
          },
          null,
          2,
        );
        setStatus(`registry rows=${rows.length}`);
      } finally {
        await opened.close();
      }
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-registry-init").addEventListener("click", () => {
    void (async () => {
      const opened = await openLocalGenerationRegistrySqliteStore();
      try {
        const result = await initializeCurrentCandidateRegistry(opened.store);
        $("security-report").textContent = JSON.stringify(result, null, 2);
        setStatus(`registry init created=${String(result.created)}`);
      } finally {
        await opened.close();
      }
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-resolve-with-registry").addEventListener("click", () => {
    void (async () => {
      const resolved = await resolveLocalJournalGenerationTargetWithRegistryValidation({
        allowUnknownCapacity: true,
      });
      $("security-report").textContent = JSON.stringify(resolved, null, 2);
      setStatus(resolved.ok ? "resolve+registry PASS" : `denied ${resolved.reason}`, !resolved.ok);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-registry-poc").addEventListener("click", () => {
    void (async () => {
      setStatus("generation registry PoC K1–K11…");
      const report = await runGenerationRegistryPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(`registry-poc fail=${fails}`, fails > 0);
    })().catch((e) => setStatus(safeErrorMessage(e), true));
  });

  $("btn-save-wiring-poc").addEventListener("click", () => {
    void (async () => {
      setStatus("internal save mirror wiring PoC L1–L13…");
      const report = await runInternalSaveMirrorWiringPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(`save-wiring-poc fail=${fails} gap=${report.residualGap}`, fails > 0);
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
    setStatus("local mirror outbox PoC Q1–Q12 実行中…");
    await LocalJournalSecureBootstrapper.bootstrap();
    const report = await runLocalMirrorOutboxPoc();
    $("security-report").textContent = JSON.stringify(report, null, 2);
    const fails = report.steps.filter((s) => s.status === "fail").length;
    setStatus(
      `outbox-poc fail=${fails} entry=${report.entryIdRedacted}`,
      fails > 0,
    );
  } catch (err) {
    setStatus(`初期化失敗: ${safeErrorMessage(err)}`, true);
  }
}

void boot();
