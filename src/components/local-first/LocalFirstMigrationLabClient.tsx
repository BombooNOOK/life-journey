"use client";

/**
 * Dev / native PoC only. Not a public LJD surface.
 * Copy one authenticated server journal onto device SQLite + Library.
 */

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { JournalRepository } from "@/lib/local-first/journal/repository";
import { migrateServerJournalEntryToDevice } from "@/lib/local-first/journal/migrateFromServer";
import { resolveJournalMediaUri } from "@/lib/local-first/journal/mediaStore";
import { deleteJournalMediaRelative } from "@/lib/local-first/journal/mediaStore";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

function formatMigrationStatus(
  result: Awaited<ReturnType<typeof migrateServerJournalEntryToDevice>>,
): string {
  if (!result.ok) {
    return `失敗 [${result.code}]: ${result.message}`;
  }
  const s = result.sizes;
  return [
    result.status === "already_present"
      ? "既に端末にあります（stableIdは増殖しません）"
      : "端末へコピー完了（サーバーは変更していません）",
    `stableId=${result.entry.stableId}`,
    `legacyServerId=${result.entry.legacyServerId}`,
    `serverUpdatedAt=${result.entry.serverUpdatedAt ?? "(none)"}`,
    `importedAt=${result.entry.importedAt ?? "(none)"}`,
    `source=${result.entry.source}`,
    `contentChars=${s.contentChars}`,
    `metaApproxBytes=${s.metaJsonBytesApprox}`,
    `photoBytes=${s.photoBytes}`,
    `relativePath=${s.relativePath ?? "(none)"}`,
    `checksum=${s.checksum ? `${s.checksum.slice(0, 12)}…` : "(none)"}`,
    `checksumFull=${s.checksum ?? "(none)"}`,
    `localCountHint=see list below`,
  ].join("\n");
}

export function LocalFirstMigrationLabClient() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("entryId")?.trim() ?? "";
  const [entryId, setEntryId] = useState(initialId);
  const [status, setStatus] = useState("準備中…");
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const native = Capacitor.isNativePlatform();
  const autorunDone = useRef(false);

  const refresh = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus("ブラウザでは端末保存を呼び出しません。Simulator（ネイティブ）で開いてください。");
      return;
    }
    const list = await JournalRepository.list();
    setEntries(list);
    const migrated = list.find((e) => e.source === "migrated_server") ?? list[0];
    const firstMedia = migrated?.mediaRefs[0] ?? list[0]?.mediaRefs[0];
    if (firstMedia) {
      setPreviewUri(await resolveJournalMediaUri(firstMedia.relativePath));
    } else {
      setPreviewUri(null);
    }
    setStatus(`Local読込: ${list.length} 件（SQLite＋Filesystem）`);
  }, []);

  const onMigrate = useCallback(async () => {
    setStatus("サーバーから1件受け取り中…（本文はログしません）");
    const result = await migrateServerJournalEntryToDevice(entryId);
    setStatus(formatMigrationStatus(result));
    await refresh();
    return result;
  }, [entryId, refresh]);

  // PoC helper: ?entryId=...&autorun=1 (and optional autorunTwice=1) for Simulator automation
  useEffect(() => {
    if (!native || autorunDone.current) return;
    const autorun = searchParams.get("autorun") === "1";
    const twice = searchParams.get("autorunTwice") === "1";
    const clearFirst = searchParams.get("clearFirst") === "1";
    const id = (searchParams.get("entryId") ?? entryId).trim();
    if (!autorun || !id) return;
    autorunDone.current = true;
    void (async () => {
      try {
        if (clearFirst) {
          const paths = await JournalRepository.deletePocData();
          for (const p of paths) await deleteJournalMediaRelative(p);
        }
        setEntryId(id);
        setStatus("autorun: 1回目受け取り中…");
        const first = await migrateServerJournalEntryToDevice(id);
        let text = `--- run1 ---\n${formatMigrationStatus(first)}`;
        if (twice) {
          setStatus("autorun: 2回目受け取り中（dedupe確認）…");
          const second = await migrateServerJournalEntryToDevice(id);
          text += `\n--- run2 ---\n${formatMigrationStatus(second)}`;
        }
        setStatus(text);
        await refresh();
      } catch (err) {
        setStatus(`autorun失敗: ${String(err)}`);
      }
    })();
  }, [native, searchParams, entryId, refresh]);

  const onClear = useCallback(async () => {
    const paths = await JournalRepository.deletePocData();
    for (const p of paths) await deleteJournalMediaRelative(p);
    setPreviewUri(null);
    setEntries([]);
    setStatus("端末側のPoCデータを削除しました（サーバーは触っていません）。");
  }, []);

  if (!native) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        この確認画面は iOS Simulator / 端末のネイティブシェル向けです。ブラウザ単体では動作しません。
      </div>
    );
  }

  return (
    <div className="space-y-4 text-stone-900">
      <p className="text-sm text-stone-600">
        サーバーあしあと1件を端末へ<strong>コピー</strong>します。削除・更新・原本切り替えはしません。
      </p>

      <label className="block text-sm">
        <span className="font-medium">あしあと ID（1件）</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          value={entryId}
          onChange={(e) => setEntryId(e.target.value)}
          placeholder="cuid..."
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => void onMigrate().catch((e) => setStatus(String(e)))}
        >
          サーバーからテストあしあとを1件受け取る
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm"
          onClick={() => void refresh().catch((e) => setStatus(String(e)))}
        >
          端末から読み直す
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm text-red-800"
          onClick={() => void onClear().catch((e) => setStatus(String(e)))}
        >
          端末PoCデータを削除
        </button>
      </div>

      <pre className="whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-3 text-xs leading-relaxed text-stone-700">
        {status}
      </pre>

      <div className="space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.stableId}
            className="rounded-xl border border-stone-200 bg-[#fffdf9] p-4 text-sm"
          >
            <h2 className="font-semibold">{entry.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-stone-800">{entry.content}</p>
            <p className="mt-2 text-xs text-stone-500">stableId: {entry.stableId}</p>
            <p className="text-xs text-stone-500">legacyServerId: {entry.legacyServerId}</p>
            <p className="text-xs text-stone-500">dateKey: {entry.dateKey}</p>
            <p className="text-xs text-stone-500">tags: {entry.tags.join(" ") || "(none)"}</p>
            <p className="text-xs text-stone-500">
              media: {entry.mediaRefs.map((m) => m.relativePath).join(", ") || "(none)"}
            </p>
          </article>
        ))}
      </div>

      {previewUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUri} alt="" className="mt-2 max-w-[10rem] rounded-lg border border-stone-200" />
      ) : null}
    </div>
  );
}
