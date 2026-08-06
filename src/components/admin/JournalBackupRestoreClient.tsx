"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { upload } from "@vercel/blob/client";

import {
  ADMIN_RESTORE_CONFIRMATION_KEYS,
  buildAdminRestoreTempZipPathname,
  type AdminRestoreConfirmationKey,
  type AdminRestorePreview,
} from "@/lib/journal/journalBackupAdminRestoreTypes";

type RestoreSuccess = {
  profileId: string;
  profileNickname: string;
  entryCount: number;
  photoCount: number;
  sourceProfileNickname: string;
  targetEmail: string;
};

type RestoreFailure = {
  error: string;
  code?: string;
  stage?: string;
  rollbackOk?: boolean;
  retryable?: boolean;
};

const CONFIRMATION_LABELS: Record<AdminRestoreConfirmationKey, string> = {
  zipReviewed: "バックアップZIPの内容を確認しました",
  targetEmailReviewed: "復元先ユーザーのメールアドレスを確認しました",
  noOverwriteReviewed: "既存プロフィールを上書きしないことを確認しました",
  newProfileReviewed: "新規プロフィールとして復元されることを確認しました",
  skippedItemsReviewed: "鑑定書・あしあとブック・製本申込は復元されないことを確認しました",
};

function emptyConfirmations(): Record<AdminRestoreConfirmationKey, boolean> {
  return {
    zipReviewed: false,
    targetEmailReviewed: false,
    noOverwriteReviewed: false,
    newProfileReviewed: false,
    skippedItemsReviewed: false,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JournalBackupRestoreClient() {
  const [targetEmail, setTargetEmail] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminRestorePreview | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobPathname, setBlobPathname] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(emptyConfirmations);
  const [restoreSuccess, setRestoreSuccess] = useState<RestoreSuccess | null>(null);
  const [restoreFailure, setRestoreFailure] = useState<RestoreFailure | null>(null);

  const allConfirmed = useMemo(
    () => ADMIN_RESTORE_CONFIRMATION_KEYS.every((key) => confirmations[key]),
    [confirmations],
  );

  const canPreview = targetEmail.trim().length > 0 && zipFile != null && !uploading && !previewing;
  const canRestore =
    preview != null &&
    preview.validationOk &&
    preview.profileLimitOk &&
    allConfirmed &&
    blobUrl != null &&
    !restoring;

  function resetResultState() {
    setPreview(null);
    setBlobUrl(null);
    setBlobPathname(null);
    setConfirmations(emptyConfirmations());
    setRestoreSuccess(null);
    setRestoreFailure(null);
    setError(null);
  }

  async function handlePreview() {
    if (!zipFile) return;
    setPreviewing(true);
    setUploading(true);
    setError(null);
    setRestoreSuccess(null);
    setRestoreFailure(null);
    setConfirmations(emptyConfirmations());

    try {
      const pathname = buildAdminRestoreTempZipPathname();
      const uploaded = await upload(pathname, zipFile, {
        access: "private",
        handleUploadUrl: "/api/admin/journal-backup/restore/upload-token",
        multipart: true,
        contentType: zipFile.type || "application/zip",
      });

      setBlobUrl(uploaded.url);
      setBlobPathname(uploaded.pathname);
      setUploading(false);

      const res = await fetch("/api/admin/journal-backup/restore/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          blobUrl: uploaded.url,
          blobPathname: uploaded.pathname,
        }),
      });
      const data = (await res.json()) as { error?: string; preview?: AdminRestorePreview };
      if (!res.ok || !data.preview) {
        throw new Error(data.error ?? "内容確認に失敗しました。");
      }
      setPreview(data.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "内容確認に失敗しました。");
      setPreview(null);
      setBlobUrl(null);
      setBlobPathname(null);
    } finally {
      setUploading(false);
      setPreviewing(false);
    }
  }

  async function handleRestore() {
    if (!preview || !blobUrl) return;
    setRestoring(true);
    setError(null);
    setRestoreFailure(null);

    try {
      const res = await fetch("/api/admin/journal-backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: preview.targetEmail,
          blobUrl,
          blobPathname,
          confirmations,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        stage?: string;
        rollbackOk?: boolean;
        retryable?: boolean;
        restore?: RestoreSuccess;
      };

      if (!res.ok || !data.restore) {
        setRestoreFailure({
          error: data.error ?? "復元に失敗しました。",
          code: data.code,
          stage: data.stage,
          rollbackOk: data.rollbackOk,
          retryable: data.retryable,
        });
        return;
      }

      setRestoreSuccess(data.restore);
      setPreview(null);
      setZipFile(null);
      setBlobUrl(null);
      setBlobPathname(null);
      setConfirmations(emptyConfirmations());
    } catch (e) {
      setRestoreFailure({
        error: e instanceof Error ? e.message : "復元に失敗しました。",
        retryable: true,
        rollbackOk: true,
      });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">1. 復元対象の指定</h2>
          <p className="mt-1 text-sm text-stone-600">
            復元先ユーザーのメールアドレスと、バックアップZIPを指定してください。
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-stone-800">復元先メールアドレス</span>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => {
              setTargetEmail(e.target.value);
              resetResultState();
            }}
            className="w-full max-w-md rounded-md border border-stone-300 px-3 py-2"
            placeholder="user@example.com"
            autoComplete="off"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-stone-800">バックアップZIP</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => {
              setZipFile(e.target.files?.[0] ?? null);
              resetResultState();
            }}
            className="block w-full max-w-md text-sm text-stone-700"
          />
          {zipFile ? (
            <p className="text-xs text-stone-500">
              選択中: {zipFile.name}（{formatBytes(zipFile.size)}）
            </p>
          ) : null}
        </label>

        <button
          type="button"
          disabled={!canPreview}
          onClick={() => void handlePreview()}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {uploading || previewing ? "ZIPを確認しています…" : "内容を確認する"}
        </button>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
      ) : null}

      {preview ? (
        <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-amber-950">2. 復元内容の確認</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
              この復元は、新規プロフィールとして作成されます。
              既存プロフィールや既存あしあとは上書きされません。
              鑑定書・あしあとブック・製本申込は復元されません。
              鑑定書が必要な場合は、復元後に鑑定を作成してください。
            </p>
          </div>

          <dl className="grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">復元先ユーザー</dt>
              <dd className="font-medium">{preview.targetEmail}</dd>
            </div>
            <div>
              <dt className="text-stone-500">元プロフィール名</dt>
              <dd className="font-medium">{preview.sourceProfileNickname}</dd>
            </div>
            <div>
              <dt className="text-stone-500">元 profileId</dt>
              <dd className="break-all font-mono text-xs">{preview.sourceProfileId}</dd>
            </div>
            <div>
              <dt className="text-stone-500">復元予定プロフィール名</dt>
              <dd className="font-medium">{preview.restoreProfileNickname}</dd>
            </div>
            <div>
              <dt className="text-stone-500">あしあと件数</dt>
              <dd>{preview.entryCount}件</dd>
            </div>
            <div>
              <dt className="text-stone-500">写真件数</dt>
              <dd>{preview.photoCount}件</dd>
            </div>
            <div>
              <dt className="text-stone-500">あしあとブック（復元しない）</dt>
              <dd>{preview.skippedDiaryBooks}件</dd>
            </div>
            <div>
              <dt className="text-stone-500">本棚ブック（復元しない）</dt>
              <dd>{preview.skippedBookshelfBooks}件</dd>
            </div>
            <div>
              <dt className="text-stone-500">format</dt>
              <dd className="font-mono text-xs">{preview.format}</dd>
            </div>
            <div>
              <dt className="text-stone-500">formatVersion</dt>
              <dd>{preview.formatVersion}</dd>
            </div>
            <div>
              <dt className="text-stone-500">ZIPサイズ</dt>
              <dd>{formatBytes(preview.zipSizeBytes)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">検証結果</dt>
              <dd className={preview.validationOk ? "text-emerald-800" : "text-red-800"}>
                {preview.validationOk ? "OK" : "エラーあり"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">プロフィール上限</dt>
              <dd className={preview.profileLimitOk ? "text-emerald-800" : "text-red-800"}>
                {preview.profileCount} / {preview.profileLimit}
                {preview.isMonitor ? "（モニター・実効上限）" : ""}
                {preview.profileLimitOk ? "（復元可能）" : "（上限到達）"}
              </dd>
              {preview.isMonitor ? (
                <dd className="mt-0.5 text-xs text-stone-500">
                  保存値: {preview.storedProfileLimit}（モニター解除後に適用）
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-stone-500">バックアップ内の鑑定ヒント</dt>
              <dd>{preview.hasKanteiHints ? "あり（復元はされません）" : "なし"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">復元先ユーザーの存在</dt>
              <dd>{preview.targetUserExists ? "確認済み" : "未登録の可能性あり"}</dd>
            </div>
          </dl>

          {!preview.profileLimitOk ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              このユーザーはプロフィール上限に達しているため、復元できません。
              不要なプロフィールを整理してから再度実行してください。
            </p>
          ) : null}

          {preview.warnings.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-900">
              <p className="font-medium">警告・検証エラー</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {preview.warnings.map((issue) => (
                  <li key={`${issue.code}-${issue.message}`}>
                    [{issue.code}] {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-900">3. 実行前チェック</p>
            {ADMIN_RESTORE_CONFIRMATION_KEYS.map((key) => (
              <label key={key} className="flex items-start gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={confirmations[key]}
                  onChange={(e) =>
                    setConfirmations((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />
                <span>{CONFIRMATION_LABELS[key]}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            disabled={!canRestore}
            onClick={() => void handleRestore()}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {restoring ? "復元を実行しています…" : "新規プロフィールとして復元"}
          </button>
        </section>
      ) : null}

      {restoreSuccess ? (
        <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
          <h2 className="text-lg font-semibold">復元が完了しました</h2>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-emerald-800/80">復元プロフィール名</dt>
              <dd className="font-medium">{restoreSuccess.profileNickname}</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">復元プロフィールID</dt>
              <dd className="break-all font-mono text-xs">{restoreSuccess.profileId}</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">復元あしあと件数</dt>
              <dd>{restoreSuccess.entryCount}件</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">復元写真件数</dt>
              <dd>{restoreSuccess.photoCount}件</dd>
            </div>
            <div>
              <dt className="text-emerald-800/80">復元先ユーザー</dt>
              <dd>{restoreSuccess.targetEmail}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/orders/profile/${encodeURIComponent(restoreSuccess.profileId)}`}
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              復元したプロフィールを確認する
            </Link>
            <Link
              href="/admin"
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              管理者でユーザー状態を確認する
            </Link>
          </div>
        </section>
      ) : null}

      {restoreFailure ? (
        <section className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <h2 className="text-lg font-semibold">復元に失敗しました</h2>
          <p>{restoreFailure.error}</p>
          {restoreFailure.stage ? <p>失敗段階: {restoreFailure.stage}</p> : null}
          {restoreFailure.rollbackOk != null ? (
            <p>ロールバック: {restoreFailure.rollbackOk ? "成功" : "一部失敗の可能性あり"}</p>
          ) : null}
          {restoreFailure.retryable ? (
            <p className="text-red-800">内容を確認して、再度実行できます。</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
