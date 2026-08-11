"use client";

/**
 * Developer-only diagnostics for Local-first foundation.
 * Not a public migration / save product UI.
 */

import { Capacitor } from "@capacitor/core";
import { useCallback, useState } from "react";

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import {
  deleteJournalMediaRelative,
  resolveJournalMediaUri,
} from "@/lib/local-first/journal/mediaStore";
import { migrateServerJournalEntryToDevice } from "@/lib/local-first/journal/migrateFromServer";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import {
  checkSecureKeyStorePersistence,
  runLocalDataProtectionPoc,
  type SecurityPocReport,
} from "@/lib/local-first/security/runLocalDataProtectionPoc";

export function LocalStorageDiagnosticsClient() {
  const [entryId, setEntryId] = useState("");
  const [status, setStatus] = useState("準備中…");
  const [entries, setEntries] = useState<LocalJournalEntry[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityPocReport | null>(null);
  const [securityBusy, setSecurityBusy] = useState(false);
  const native = Capacitor.isNativePlatform();

  const refresh = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus("ブラウザ単体では native storage を呼びません。");
      return;
    }
    await openLocalJournalDatabase();
    const list = await JournalRepository.list();
    setEntries(list);
    const media = list[0]?.mediaRefs[0];
    setPreviewUri(media ? await resolveJournalMediaUri(media.relativePath) : null);
    setStatus(`Local読込: ${list.length} 件（SQLite＋Filesystem・サーバー再取得なし）`);
  }, []);

  const onCopyOne = useCallback(async () => {
    setStatus("認証済みAPIから1件コピー中…（本文はログしません）");
    const result = await migrateServerJournalEntryToDevice(entryId);
    if (!result.ok) {
      setStatus(`失敗 [${result.code}]: ${result.message}`);
      return;
    }
    setStatus(
      [
        result.status === "already_present" ? "dedupe: already_present" : "created",
        `stableId=${result.entry.stableId}`,
        `legacyServerId=${result.entry.legacyServerId}`,
        `contentChars=${result.sizes.contentChars}`,
        `photoBytes=${result.sizes.photoBytes}`,
        `checksum=${result.sizes.checksum ? `${result.sizes.checksum.slice(0, 12)}…` : "(none)"}`,
      ].join("\n"),
    );
    await refresh();
  }, [entryId, refresh]);

  const onClear = useCallback(async () => {
    const paths = await JournalRepository.deleteAll();
    for (const p of paths) await deleteJournalMediaRelative(p);
    setPreviewUri(null);
    setEntries([]);
    setStatus("端末Local診断データを削除しました（サーバー未変更）。");
  }, []);

  const onSecurityPoc = useCallback(async () => {
    setSecurityBusy(true);
    setStatus("Security PoC 実行中…（secretは表示しません）");
    try {
      const report = await runLocalDataProtectionPoc();
      setSecurityReport(report);
      const fails = report.steps.filter((s) => s.status === "fail").length;
      setStatus(
        `Security PoC 完了 fail=${fails} sqlcipherOk=${String(report.summary.sqlcipherOk)} keyStoreOk=${String(report.summary.secureKeyStoreOk)} builtIn=${report.summary.builtInStoreVerdict}`,
      );
    } finally {
      setSecurityBusy(false);
    }
  }, []);

  const onKeyPersistence = useCallback(async () => {
    const meta = await checkSecureKeyStorePersistence();
    setStatus(
      `SecureKeyStore after relaunch: exists=${String(meta.exists)} accessibility=${meta.accessibility ?? "null"}`,
    );
  }, []);

  if (!native) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        native（iOS Simulator / 端末）専用です。Web版の通常動線からは使いません。
      </div>
    );
  }

  return (
    <div className="space-y-4 text-stone-900">
      <label className="block text-sm">
        <span className="font-medium">server entry id（任意・診断用1件コピー）</span>
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
          className="rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => void onCopyOne().catch((e) => setStatus(String(e)))}
        >
          1件コピー（診断）
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm"
          onClick={() => void refresh().catch((e) => setStatus(String(e)))}
        >
          Localを読み直す
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm text-red-800"
          onClick={() => void onClear().catch((e) => setStatus(String(e)))}
        >
          端末Localをクリア
        </button>
      </div>

      <pre className="whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-3 text-xs leading-relaxed text-stone-700">
        {status}
      </pre>

      <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Security diagnostics（4B-3B · dummy only）</h2>
        <p className="text-xs text-stone-500">
          SQLCipher / SecureKeyStore / backup・file protection 実測。secret全文は表示しません。本番DBは暗号化しません。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={securityBusy}
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void onSecurityPoc().catch((e) => setStatus(String(e)))}
          >
            {securityBusy ? "実行中…" : "Run Local Data Protection PoC"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm"
            onClick={() => void onKeyPersistence().catch((e) => setStatus(String(e)))}
          >
            Keychain persistence check
          </button>
        </div>
        {securityReport ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-700">
            {JSON.stringify(
              {
                ranAt: securityReport.ranAt,
                summary: securityReport.summary,
                steps: securityReport.steps.map((s) => ({
                  id: s.id,
                  status: s.status,
                  title: s.title,
                  detail: s.detail,
                })),
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </section>

      <div className="space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.stableId}
            className="rounded-xl border border-stone-200 bg-white p-4 text-sm"
          >
            <h2 className="font-semibold">{entry.title}</h2>
            <p className="mt-2 text-xs text-stone-500">stableId: {entry.stableId}</p>
            <p className="text-xs text-stone-500">legacyServerId: {entry.legacyServerId}</p>
            <p className="text-xs text-stone-500">source: {entry.source}</p>
            <p className="text-xs text-stone-500">dateKey: {entry.dateKey}</p>
            <p className="text-xs text-stone-500">tags: {entry.tags.join(" ") || "(none)"}</p>
            <p className="text-xs text-stone-500">
              media: {entry.mediaRefs.map((m) => m.relativePath).join(", ") || "(none)"}
            </p>
            <p className="mt-2 max-h-24 overflow-hidden text-stone-700">{entry.content}</p>
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
