/**
 * Phase 4B-2A Local-first Storage Lab entry (bundled into capacitor-www).
 * Not a production LJD route. Native-only.
 */

import { Capacitor } from "@capacitor/core";

import {
  clearAllPocMedia,
  deletePocMediaFile,
  readPocMediaAsUri,
  writePocMediaFile,
} from "@/lib/local-first/poc/filesystemPocMedia";
import {
  clearPocJournals,
  insertPocJournal,
  listPocJournals,
  openPocDatabase,
} from "@/lib/local-first/poc/sqlitePocDatabase";
import type { LocalJournalPocRow } from "@/lib/local-first/poc/types";

const SEED_ASSET_URL = "./assets/poc-seed-acorn.png";
const FIXED_POC_ID = "poc-ashiato-001";

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

async function fetchSeedImageBase64(): Promise<string> {
  const res = await fetch(SEED_ASSET_URL);
  if (!res.ok) throw new Error(`Seed image fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function renderList(): Promise<void> {
  const listEl = $("list");
  const previewEl = $("preview") as HTMLImageElement;
  listEl.innerHTML = "";
  previewEl.removeAttribute("src");
  previewEl.hidden = true;

  const rows = await listPocJournals();
  if (rows.length === 0) {
    listEl.innerHTML = "<p class='muted'>まだ端末にあしあとがありません。</p>";
    return;
  }

  for (const row of rows) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(row.title)}</h3>
      <p>${escapeHtml(row.content)}</p>
      <p class="meta">id: ${escapeHtml(row.id)}</p>
      <p class="meta">createdAt: ${escapeHtml(row.createdAt)}</p>
      <p class="meta">mediaPath: ${escapeHtml(row.mediaPath ?? "(none)")}</p>
    `;
    listEl.appendChild(card);

    if (row.mediaPath) {
      try {
        const uri = await readPocMediaAsUri(row.mediaPath);
        previewEl.src = uri;
        previewEl.hidden = false;
      } catch (err) {
        setStatus(`画像URI取得失敗: ${String(err)}`, true);
      }
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function onSave(): Promise<void> {
  setStatus("保存中…");
  await openPocDatabase();
  const base64 = await fetchSeedImageBase64();
  const mediaPath = await writePocMediaFile("poc-seed-acorn.png", base64);
  const row: LocalJournalPocRow = {
    id: FIXED_POC_ID,
    title: "森のテストあしあと",
    content:
      "これは端末の中だけに残るLocal-firstテストです。本番あしあと／Neon／Blobは触っていません。",
    createdAt: new Date().toISOString(),
    mediaPath,
  };
  await insertPocJournal(row);
  await renderList();
  setStatus(`保存完了（SQLite + Library media）。mediaPath=${mediaPath}`);
}

async function onLoad(): Promise<void> {
  setStatus("読込中…");
  await openPocDatabase();
  await renderList();
  const rows = await listPocJournals();
  setStatus(`読込完了: ${rows.length} 件`);
}

async function onClear(): Promise<void> {
  setStatus("削除中…");
  const rows = await listPocJournals();
  for (const row of rows) {
    if (row.mediaPath) await deletePocMediaFile(row.mediaPath);
  }
  await clearPocJournals();
  await clearAllPocMedia();
  await renderList();
  setStatus("テストデータを削除しました。");
}

async function boot(): Promise<void> {
  const platformEl = $("platform");
  platformEl.textContent = `platform=${Capacitor.getPlatform()} native=${String(
    Capacitor.isNativePlatform(),
  )} remoteShell=false (local assets)`;

  if (!Capacitor.isNativePlatform()) {
    setStatus(
      "このLabはネイティブ（Capacitor iOS）専用です。ブラウザではSQLite/Filesystemを呼び出しません。",
      true,
    );
    ($("btn-save") as HTMLButtonElement).disabled = true;
    ($("btn-load") as HTMLButtonElement).disabled = true;
    ($("btn-clear") as HTMLButtonElement).disabled = true;
    return;
  }

  $("btn-save").addEventListener("click", () => {
    void onSave().catch((err) => setStatus(String(err), true));
  });
  $("btn-load").addEventListener("click", () => {
    void onLoad().catch((err) => setStatus(String(err), true));
  });
  $("btn-clear").addEventListener("click", () => {
    void onClear().catch((err) => setStatus(String(err), true));
  });

  try {
    await openPocDatabase();
    await renderList();
    setStatus("Local-first Storage Lab 準備完了。サーバーなしで動けます。");

    // Optional one-shot verification (Simulator agent). Leave unset / false in shipped Lab.
    const auto = (globalThis as { __LJD_POC_AUTOVERIFY__?: boolean }).__LJD_POC_AUTOVERIFY__;
    if (auto === true) {
      await onSave();
      await onLoad();
      const prev = $("status").textContent ?? "";
      setStatus(`${prev}\n[autoverify] save+load done`);
    }
  } catch (err) {
    setStatus(`初期化失敗: ${String(err)}`, true);
  }
}

void boot();
