"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { JournalSyncStatusResponse } from "@/lib/journal/syncStatusTypes";

type AuthSession = {
  ready: boolean;
  firebaseEmail: string | null;
  serverEmail: string | null;
  mismatch: boolean;
};

type Props = {
  monthKey: string;
  profileId: string;
  authSession: AuthSession;
  debugDay: string | null;
  debugEntryId: string | null;
};

/** localhost / 127.0.0.1 / LAN IP は Cookie が共有されない別サイト */
function hostKind(host: string): "loopback" | "lan" | "other" {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  if (h === "localhost" || h === "127.0.0.1") return "loopback";
  if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)) return "lan";
  return "other";
}

function CheckRow({ label, value }: { label: string; value: boolean | null }) {
  const mark =
    value === null ? "—" : value ? "✓" : "✗";
  const tone =
    value === null
      ? "text-stone-500"
      : value
        ? "text-emerald-800"
        : "text-red-700";
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-stone-700">{label}</span>
      <span className={`font-mono font-semibold ${tone}`}>{mark}</span>
    </div>
  );
}

export function DiarySyncDebugPanel({
  monthKey,
  profileId,
  authSession,
  debugDay,
  debugEntryId,
}: Props) {
  const [status, setStatus] = useState<JournalSyncStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const clientHost = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.host;
  }, []);

  const clientHostKind = useMemo(() => hostKind(clientHost), [clientHost]);

  const load = useCallback(async () => {
    if (!authSession.ready || !profileId) return;
    setError(null);
    const qs = new URLSearchParams({
      month: monthKey,
      profileId,
      _: String(Date.now()),
    });
    if (debugDay) qs.set("day", debugDay);
    if (debugEntryId) qs.set("entry", debugEntryId);
    if (authSession.firebaseEmail) qs.set("firebaseEmail", authSession.firebaseEmail);

    try {
      const res = await fetch(`/api/journal/sync-status?${qs.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json()) as JournalSyncStatusResponse & { error?: string };
      if (!res.ok) {
        setStatus(null);
        setError(data.error ?? "sync-status の取得に失敗しました");
        return;
      }
      setStatus(data);
    } catch {
      setStatus(null);
      setError("sync-status の取得に失敗しました");
    }
  }, [
    authSession.ready,
    authSession.firebaseEmail,
    profileId,
    monthKey,
    debugDay,
    debugEntryId,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const copySummary = async () => {
    if (!status) return;
    const lines = [
      `host(client)=${clientHost}`,
      `host(request)=${status.deployment.requestHost ?? "?"}`,
      `viewerEmail=${status.auth.viewerEmail}`,
      `queriedProfileId=${status.profile.queriedProfileId}`,
      `fingerprint=${status.compareFingerprint}`,
      `month=${status.month.key} count=${status.month.entryCountIncludingLegacyOrphan}`,
      debugDay ? `day=${debugDay} ids=${status.day.entryIds.join(",") || "(none)"}` : null,
      debugEntryId ? `entry=${debugEntryId} found=${status.entryProbe.found}` : null,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const previewHref =
    debugEntryId && debugEntryId.length > 0
      ? `/journal/preview?entry=${encodeURIComponent(debugEntryId)}&theme=simple&pv=3`
      : null;

  return (
    <section className="space-y-2 rounded-xl border-2 border-amber-400 bg-amber-50/90 p-3 text-stone-900">
      {clientHostKind === "loopback" ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-2 py-2 text-xs leading-snug text-red-900">
          現在 <span className="font-mono font-semibold">{clientHost}</span> です。
          <strong> localhost / 127.0.0.1 と 192.168.x.x は別サイト</strong>
          なので Cookie・ログイン・プロフィールは iPhone（LAN）と共有されません。
          Mac でも記事確認・syncDebug は{" "}
          <span className="font-mono">http://192.168.1.28:3000/...</span> に統一し、
          <span className="font-mono">npm run dev:lan</span> で起動してください。
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-amber-950">同期診断（syncDebug）</p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-950/80">
            Mac / iPhone で<strong>同じ host</strong>の URL を開き、fingerprint と checks を比較してください。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-amber-500 bg-white px-2 py-1 text-xs font-medium hover:bg-amber-100"
          >
            再取得
          </button>
          <button
            type="button"
            onClick={() => void copySummary()}
            disabled={!status}
            className="rounded-lg border border-amber-500 bg-white px-2 py-1 text-xs font-medium hover:bg-amber-100 disabled:opacity-50"
          >
            {copied ? "コピー済" : "比較用コピー"}
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-amber-200 bg-white/80 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Host / DB</p>
          <p className="font-mono text-[11px]">
            client: <span className="text-stone-900">{clientHost || "—"}</span>
          </p>
          <p className="font-mono text-[11px]">
            request: <span className="text-stone-900">{status?.deployment.requestHost ?? "…"}</span>
          </p>
          <p className="font-mono text-[11px]">
            vercel: <span className="text-stone-900">{status?.deployment.vercelUrl ?? "local"}</span>
          </p>
        </div>
        <div className="space-y-1 rounded-lg border border-amber-200 bg-white/80 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            比較キー（1–3）
          </p>
          <p className="break-all font-mono text-[11px]">
            email: {status?.auth.viewerEmail ?? "…"}
          </p>
          <p className="break-all font-mono text-[11px]">
            profile: {status?.profile.queriedProfileId ?? "…"}
          </p>
          <p className="break-all font-mono text-[11px]">
            fingerprint: {status?.compareFingerprint ?? "…"}
          </p>
        </div>
      </div>

      {debugDay ? (
        <p className="text-xs text-stone-700">
          対象日 <span className="font-mono font-medium">{debugDay}</span>
          {" → "}
          entryIds:{" "}
          <span className="font-mono">
            {status?.day.entryIds.length ? status.day.entryIds.join(", ") : "（なし）"}
          </span>
        </p>
      ) : (
        <p className="text-xs text-amber-900">
          5/25 など日付比較: URL に <span className="font-mono">debugDay=2026-05-25</span> を追加
        </p>
      )}

      {debugEntryId ? (
        <p className="text-xs text-stone-700">
          entry <span className="font-mono">{debugEntryId}</span>
          {previewHref ? (
            <>
              {" "}
              <Link href={previewHref} className="font-medium text-emerald-900 underline">
                プレビュー直接開く
              </Link>
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-xs text-amber-900">
          entry 照合: <span className="font-mono">debugEntry=（記事ID）</span> を追加
        </p>
      )}

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">{error}</p>
      ) : null}

      {status ? (
        <>
          <div className="rounded-lg border border-amber-200 bg-white/80 p-2 space-y-1">
            <p className="text-[10px] font-semibold text-stone-500">checks（この端末）</p>
            <CheckRow label="authOk (viewerEmail)" value={status.checks.authOk} />
            <CheckRow
              label="firebase ↔ server email"
              value={status.checks.firebaseMatchesServer}
            />
            <CheckRow label="profileOk" value={status.checks.profileOk} />
            <CheckRow label="monthHasAnyEntry" value={status.checks.monthHasAnyEntry} />
            <CheckRow label="dayHasEntry" value={status.checks.dayHasEntry} />
            <CheckRow label="entryFound" value={status.checks.entryFound} />
            <CheckRow label="entryBelongsToViewer" value={status.checks.entryBelongsToViewer} />
            <CheckRow label="entryVisibleUnderProfile" value={status.checks.entryVisibleUnderProfile} />
          </div>

          <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-950">
            {status.branchHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>

          <details className="text-xs">
            <summary className="cursor-pointer text-stone-600">生 JSON</summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-stone-100 p-2 font-mono text-[10px]">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        </>
      ) : (
        <p className="text-xs text-stone-600">読み込み中…</p>
      )}

      <div className="border-t border-amber-300/80 pt-2 text-[10px] leading-snug text-amber-950/90">
        <p className="font-semibold">2台比較の判断</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>host が localhost と 192.168.x.x で混在 → 同期問題ではなく別オリジン</li>
          <li>viewerEmail 違う → ログイン / Cookie</li>
          <li>queriedProfileId 違う → プロフィール ID</li>
          <li>fingerprint 違う → DB / host / 月データ不一致</li>
          <li>day.entryIds が Mac のみ → API 参照問題</li>
          <li>API にあるのに印なし → カレンダー UI（月・日タップ）</li>
          <li>preview 直接 URL 不可 → host / ユーザー不一致</li>
        </ul>
      </div>
    </section>
  );
}
