/**
 * Local-first Storage Lab — Phase 4B-2B Journal Repository PoC controls.
 * Still not production Journal UI. Native-only.
 */

import { Capacitor } from "@capacitor/core";

import {
  RAIN_FOREST_SEED_ASSET_URL,
  RAIN_FOREST_SERVER_FIXTURE,
} from "@/lib/local-first/journal/fixture";
import { mapServerJournalEntryLikeToLocal } from "@/lib/local-first/journal/mapper";
import {
  deleteJournalMediaRelative,
  resolveJournalMediaUri,
  sha256HexOfBase64,
  writeJournalMediaRelative,
} from "@/lib/local-first/journal/mediaStore";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import { searchLocalJournals } from "@/lib/local-first/journal/search";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";

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

async function fetchSeedImageBase64(): Promise<string> {
  const res = await fetch(RAIN_FOREST_SEED_ASSET_URL);
  if (!res.ok) throw new Error(`Seed image fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function renderEntries(
  entries: Awaited<ReturnType<typeof JournalRepository.list>>,
): Promise<void> {
  const listEl = $("list");
  const previewEl = $("preview") as HTMLImageElement;
  listEl.innerHTML = "";
  previewEl.removeAttribute("src");
  previewEl.hidden = true;

  if (entries.length === 0) {
    listEl.innerHTML = "<p class='muted'>Local Journal にまだエントリがありません。</p>";
    return;
  }

  for (const entry of entries) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.content)}</p>
      <p class="meta">stableId: ${escapeHtml(entry.stableId)}</p>
      <p class="meta">legacyServerId: ${escapeHtml(entry.legacyServerId ?? "(none)")}</p>
      <p class="meta">dateKey: ${escapeHtml(entry.dateKey)}</p>
      <p class="meta">tags: ${escapeHtml(entry.tags.join(" "))}</p>
      <p class="meta">media: ${escapeHtml(
        entry.mediaRefs.map((m) => m.relativePath).join(", ") || "(none)",
      )}</p>
    `;
    listEl.appendChild(card);

    const firstMedia = entry.mediaRefs[0];
    if (firstMedia) {
      try {
        previewEl.src = await resolveJournalMediaUri(firstMedia.relativePath);
        previewEl.hidden = false;
      } catch (err) {
        setStatus(`画像URI取得失敗: ${String(err)}`, true);
      }
    }
  }
}

async function onSaveMappedFixture(): Promise<void> {
  setStatus("fixture → mapper → SQLite + Library 保存中…");
  await openLocalJournalDatabase();
  const base64 = await fetchSeedImageBase64();
  const checksum = await sha256HexOfBase64(base64);
  const journalStableId = createLocalStableId();
  const mediaStableId = createLocalStableId();
  const relativePath = await writeJournalMediaRelative(
    `${journalStableId}-${mediaStableId}.png`,
    base64,
  );

  const local = mapServerJournalEntryLikeToLocal(RAIN_FOREST_SERVER_FIXTURE, {
    journalStableId,
    mediaStableId,
    mediaRelativePath: relativePath,
    mediaChecksum: checksum,
  });

  await JournalRepository.save(local);
  await renderEntries(await JournalRepository.list());
  setStatus(
    `保存完了\nstableId=${local.stableId}\nlegacyServerId=${local.legacyServerId}\nrelativePath=${relativePath}\nchecksum=${checksum.slice(0, 12)}…`,
  );
}

async function onLoad(): Promise<void> {
  setStatus("読込中…");
  await openLocalJournalDatabase();
  const entries = await JournalRepository.list();
  await renderEntries(entries);
  setStatus(`読込完了: ${entries.length} 件 (count=${await JournalRepository.count()})`);
}

async function onSearch(): Promise<void> {
  setStatus("検索中…");
  await openLocalJournalDatabase();
  const byTag = await searchLocalJournals({ tag: "#森" });
  const byDate = await searchLocalJournals({ dateKey: "2026-08-10" });
  const byText = await searchLocalJournals({ text: "雨" });
  await renderEntries(byTag);
  setStatus(
    `検索PoC\n#森 → ${byTag.length}件\ndateKey=2026-08-10 → ${byDate.length}件\ntext=雨 → ${byText.length}件`,
  );
}

async function onClear(): Promise<void> {
  setStatus("PoCデータ削除中…");
  const paths = await JournalRepository.deletePocData();
  for (const p of paths) await deleteJournalMediaRelative(p);
  await renderEntries([]);
  setStatus("Local Journal PoCデータを削除しました。");
}

async function boot(): Promise<void> {
  $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(
    Capacitor.isNativePlatform(),
  )} phase=4B-2B remoteShell=false`;

  if (!Capacitor.isNativePlatform()) {
    setStatus("ネイティブ専用です。WebではRepositoryを呼びません。", true);
    for (const id of ["btn-save", "btn-load", "btn-search", "btn-clear"]) {
      ($(id) as HTMLButtonElement).disabled = true;
    }
    return;
  }

  $("btn-save").addEventListener("click", () => {
    void onSaveMappedFixture().catch((e) => setStatus(String(e), true));
  });
  $("btn-load").addEventListener("click", () => {
    void onLoad().catch((e) => setStatus(String(e), true));
  });
  $("btn-search").addEventListener("click", () => {
    void onSearch().catch((e) => setStatus(String(e), true));
  });
  $("btn-clear").addEventListener("click", () => {
    void onClear().catch((e) => setStatus(String(e), true));
  });

  try {
    await openLocalJournalDatabase();
    await renderEntries(await JournalRepository.list());
    setStatus("4B-2B Local Journal Lab 準備完了（サーバーなし可）。");

    const auto = (globalThis as { __LJD_POC_AUTOVERIFY__?: boolean }).__LJD_POC_AUTOVERIFY__;
    if (auto === true) {
      await onSaveMappedFixture();
      await onSearch();
    }
  } catch (err) {
    setStatus(`初期化失敗: ${String(err)}`, true);
  }
}

void boot();
