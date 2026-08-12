/**
 * Offline Local Storage Diagnostics entry (local asset Cap mode).
 * Developer-only; not a product surface.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import {
  deleteJournalMediaRelative,
  resolveJournalMediaUri,
} from "@/lib/local-first/journal/mediaStore";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import {
  checkSecureKeyStorePersistence,
  runLocalDataProtectionPoc,
} from "@/lib/local-first/security/runLocalDataProtectionPoc";
import {
  persistKeyIntegrationReport,
  runKeyIntegrationPoc,
} from "@/lib/local-first/security/runKeyIntegrationPoc";
import {
  persistStorageLocationReport,
  runStorageLocationPoc,
} from "@/lib/local-first/security/runStorageLocationPoc";
import {
  persistGroupAReport,
  runRealDeviceGroupAPoc,
} from "@/lib/local-first/security/runRealDeviceGroupAPoc";
import {
  persistGroupAPersistenceReport,
  runGroupAPersistenceCheck,
} from "@/lib/local-first/security/runGroupAPersistenceCheck";
import {
  finishGroupALockTest,
  persistGroupALockReport,
  prepareGroupALockTest,
} from "@/lib/local-first/security/runGroupALockTest";

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

  $("btn-security").addEventListener("click", () => {
    void (async () => {
      setStatus("Security PoC 実行中…（secret非表示）");
      const report = await runLocalDataProtectionPoc();
      await persistSecurityReport(report);
      const reportEl = $("security-report");
      reportEl.textContent = JSON.stringify(
        {
          ranAt: report.ranAt,
          summary: report.summary,
          steps: report.steps.map((s) => ({
            id: s.id,
            status: s.status,
            title: s.title,
            detail: s.detail,
          })),
        },
        null,
        2,
      );
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(
        `Security PoC 完了 fail=${fails} sqlcipherOk=${String(report.summary.sqlcipherOk)} keyStoreOk=${String(report.summary.secureKeyStoreOk)}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-key-persist").addEventListener("click", () => {
    void (async () => {
      const meta = await checkSecureKeyStorePersistence();
      setStatus(
        `SecureKeyStore: exists=${String(meta.exists)} accessibility=${meta.accessibility ?? "null"}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-key-integration").addEventListener("click", () => {
    void (async () => {
      setStatus("Key integration PoC…（secret非表示・非取得）");
      const report = await runKeyIntegrationPoc();
      await persistKeyIntegrationReport(report);
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `Key integration 完了 accessibility=${report.accessibilityVerdict} builtInAdopt=${report.summary.builtInAdoptForDbKey} fork=${String(report.summary.forkNeeded)}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-storage-location").addEventListener("click", () => {
    void (async () => {
      setStatus("Storage location PoC…");
      const report = await runStorageLocationPoc();
      await persistStorageLocationReport(report);
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `Storage location 完了 recommend=${report.recommendation} bridgeNeeded=${String(report.additionalNativeBridgeNeededInProduction)}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-group-a").addEventListener("click", () => {
    void (async () => {
      setStatus("Group A（非破壊・dummy only）… secret非表示");
      const report = await runRealDeviceGroupAPoc();
      await persistGroupAReport(report);
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `Group A 完了 db=${String(report.summary.dbLocationOk)} reopen=${String(report.summary.encryptedReopenOk)} kc=${String(report.summary.keychainWhenUnlocked)}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-lock-prepare").addEventListener("click", () => {
    void (async () => {
      setStatus("Lock prepare… unlock読込→close→Complete→arm（wipeなし）");
      const report = await prepareGroupALockTest();
      await persistGroupALockReport(report);
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `PREPARED — ${report.nextUserAction}`,
      );
    })().catch((e) => setStatus(String(e), true));
  });

  $("btn-lock-finish").addEventListener("click", () => {
    void (async () => {
      setStatus("Lock finish… native probe読取＋unlock後 reopen");
      const report = await finishGroupALockTest();
      await persistGroupALockReport(report);
      $("security-report").textContent = JSON.stringify(report, null, 2);
      setStatus(
        `Lock verdict=${report.verdict} — ${report.verdictNote}`,
        report.verdict === "fail",
      );
    })().catch((e) => setStatus(String(e), true));
  });

  try {
    // Prefer non-destructive persistence check when dummy already exists.
    // Full Group A suite is button-only (avoids wiping secret/DB on every launch).
    $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(
      Capacitor.isNativePlatform(),
    )} phase=4B-3D GroupA persistence-first`;
    if (Capacitor.isNativePlatform()) {
      setStatus("Group A persistence check（wipeなし）…");
      try {
        const persist = await runGroupAPersistenceCheck();
        await persistGroupAPersistenceReport(persist);
        $("security-report").textContent = JSON.stringify(persist, null, 2);
        setStatus(
          `Persistence: kc=${String(persist.summary.keychainExists)} reopen=${String(persist.summary.encryptedReopenOk)} media=${String(persist.summary.mediaReadOk)} — 初回作成は「Run Group A」ボタン`,
        );
      } catch (e) {
        setStatus(
          `Persistence未準備（先に Run Group A）: ${String(e)}`,
          true,
        );
      }
    } else {
      setStatus(
        "準備完了。会社用実機では Group A。個人端末・erase/restore/uninstall/端末クリアは禁止。",
      );
    }
  } catch (err) {
    setStatus(`初期化失敗: ${String(err)}`, true);
  }
}

async function persistSecurityReport(report: Awaited<ReturnType<typeof runLocalDataProtectionPoc>>): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true,
    });
  } catch {
    /* exists */
  }
  await Filesystem.writeFile({
    path: "ljd/security-poc/last-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(
      {
        ranAt: report.ranAt,
        platform: report.platform,
        summary: report.summary,
        steps: report.steps,
      },
      null,
      2,
    ),
  });
}

void boot();
