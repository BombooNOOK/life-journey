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

  try {
    await openLocalJournalDatabase();
    await renderEntries();
    setStatus("Diagnostics準備完了（SQLite foundation）。");

    if (Capacitor.isNativePlatform()) {
      // K4 probe: measure persistence from prior session BEFORE this run deletes/reseeds.
      let k4Detail = "no prior item (first launch after install)";
      try {
        const prior = await checkSecureKeyStorePersistence();
        k4Detail = `priorExists=${String(prior.exists)} accessibility=${prior.accessibility ?? "null"}`;
        await Filesystem.mkdir({
          path: "ljd/security-poc",
          directory: Directory.Library,
          recursive: true,
        }).catch(() => undefined);
        await Filesystem.writeFile({
          path: "ljd/security-poc/k4-persistence.json",
          directory: Directory.Library,
          encoding: Encoding.UTF8,
          data: JSON.stringify(
            {
              at: new Date().toISOString(),
              exists: prior.exists,
              accessibility: prior.accessibility,
            },
            null,
            2,
          ),
        });
      } catch (e) {
        k4Detail = `probe error: ${String(e)}`;
      }

      setStatus("Security PoC autorun…");
      const report = await runLocalDataProtectionPoc();
      report.steps = report.steps.map((s) =>
        s.id === "K4"
          ? {
              ...s,
              status: k4Detail.includes("priorExists=true") ? "pass" : "info",
              detail: `${s.detail} | measuredOnBoot: ${k4Detail}`,
            }
          : s,
      );
      await persistSecurityReport(report);
      $("security-report").textContent = JSON.stringify(
        {
          ranAt: report.ranAt,
          summary: report.summary,
          steps: report.steps,
        },
        null,
        2,
      );
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(
        `Security PoC autorun 完了 fail=${fails} sqlcipherOk=${String(report.summary.sqlcipherOk)} keyStoreOk=${String(report.summary.secureKeyStoreOk)} k4=${k4Detail}`,
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
