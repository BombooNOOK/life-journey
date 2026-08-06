"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminAccountProfileSummary } from "@/lib/profile/adminAccountProfileSummary";
import {
  ADMIN_PROFILE_DELETE_CONFIRMATION_WORD,
  requiredAdminProfileDeleteConfirmationKeys,
  type AdminProfileDeleteBindingBlockDetail,
  type AdminProfileDeleteConfirmationKey,
  type AdminProfileDeletePreview,
  type AdminProfileDeleteResult,
  type AdminProfileListItem,
} from "@/lib/profile/adminProfileDeleteTypes";
import { formatAdminEffectiveProfileLimitLabel } from "@/lib/profile/effectiveProfileLimit";

const CONFIRMATION_LABELS: Record<AdminProfileDeleteConfirmationKey, string> = {
  profileReviewed: "削除対象プロフィールを確認しました",
  backupReviewed: "必要なバックアップが取得済みであることを確認しました",
  journalDataReviewed: "あしあと本文・写真が削除されることを確認しました",
  noOrderBindingReviewed: "実注文・製本申込に関わるデータがないことを確認しました",
  kanteiDataReviewed: "鑑定書データと鑑定書PDFも削除されることを確認しました",
};

function emptyConfirmations(): Record<AdminProfileDeleteConfirmationKey, boolean> {
  return {
    profileReviewed: false,
    backupReviewed: false,
    journalDataReviewed: false,
    noOrderBindingReviewed: false,
    kanteiDataReviewed: false,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP");
}

function BlockDetailCard({ detail }: { detail: AdminProfileDeleteBindingBlockDetail }) {
  const kindLabel = detail.kind === "diary" ? "あしあとブック製本申込" : "鑑定書製本申込";
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
      <p className="font-medium">削除できません。</p>
      <p className="mt-2">
        <span className="font-medium">理由：</span>
        {detail.blockMessage}
      </p>
      <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-red-700">種別</dt>
          <dd>{kindLabel}</dd>
        </div>
        <div>
          <dt className="text-red-700">申込ID</dt>
          <dd className="font-mono">{detail.requestId}</dd>
        </div>
        <div>
          <dt className="text-red-700">コード</dt>
          <dd className="font-mono">{detail.code}</dd>
        </div>
        <div>
          <dt className="text-red-700">ステータス</dt>
          <dd>
            {detail.status}（{detail.statusLabel}）
          </dd>
        </div>
        <div>
          <dt className="text-red-700">BASE注文番号</dt>
          <dd>{detail.hasBaseOrderNumber ? detail.baseOrderNumber : "なし"}</dd>
        </div>
        {detail.diaryBookId ? (
          <div>
            <dt className="text-red-700">あしあとブックID</dt>
            <dd className="font-mono">{detail.diaryBookId}</dd>
          </div>
        ) : null}
        {detail.kanteiCreationDataId ? (
          <div>
            <dt className="text-red-700">鑑定作成データID</dt>
            <dd className="font-mono">{detail.kanteiCreationDataId}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-red-700">申込の profileId</dt>
          <dd className="font-mono">{detail.bindingProfileId || "（空）"}</dd>
        </div>
        {detail.cancelledAt ? (
          <div>
            <dt className="text-red-700">取り下げ日時</dt>
            <dd>{formatDate(detail.cancelledAt)}</dd>
          </div>
        ) : null}
        {detail.expiredAt ? (
          <div>
            <dt className="text-red-700">期限切れ日時</dt>
            <dd>{formatDate(detail.expiredAt)}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs">
        <span className="font-medium">対応：</span>
        {detail.actionHint}
      </p>
    </div>
  );
}

export function ProfileManagementClient() {
  const [targetEmail, setTargetEmail] = useState("");
  const [profiles, setProfiles] = useState<AdminProfileListItem[]>([]);
  const [accountSummary, setAccountSummary] = useState<AdminAccountProfileSummary | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminProfileDeletePreview | null>(null);
  const [confirmations, setConfirmations] = useState(emptyConfirmations);
  const [confirmationWord, setConfirmationWord] = useState("");
  const [deleteResult, setDeleteResult] = useState<AdminProfileDeleteResult | null>(null);

  const requiredConfirmationKeys = useMemo(
    () =>
      preview
        ? requiredAdminProfileDeleteConfirmationKeys(preview.requiresKanteiDataConfirmation)
        : requiredAdminProfileDeleteConfirmationKeys(false),
    [preview],
  );

  const allConfirmed = useMemo(
    () => requiredConfirmationKeys.every((key) => confirmations[key]),
    [confirmations, requiredConfirmationKeys],
  );

  const canLoadProfiles = targetEmail.trim().length > 0 && !loadingProfiles;
  const canPreview =
    targetEmail.trim().length > 0 && selectedProfileId != null && !previewing && !deleting;
  const canDelete =
    preview != null &&
    preview.canDelete &&
    allConfirmed &&
    confirmationWord.trim() === ADMIN_PROFILE_DELETE_CONFIRMATION_WORD &&
    !deleting;

  function resetDeleteState() {
    setPreview(null);
    setConfirmations(emptyConfirmations());
    setConfirmationWord("");
    setDeleteResult(null);
    setError(null);
  }

  async function handleLoadProfiles() {
    setLoadingProfiles(true);
    setError(null);
    setProfiles([]);
    setSelectedProfileId(null);
    resetDeleteState();

    try {
      const res = await fetch("/api/admin/profiles/delete/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: targetEmail.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        profiles?: AdminProfileListItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "プロフィール一覧の取得に失敗しました。");
      }
      setProfiles(data.profiles ?? []);
      if ((data.profiles ?? []).length === 0) {
        setError("このメールアドレスに紐づくプロフィールが見つかりません。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "プロフィール一覧の取得に失敗しました。");
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function handlePreview() {
    if (!selectedProfileId) return;
    setPreviewing(true);
    setError(null);
    setDeleteResult(null);
    setConfirmations(emptyConfirmations());
    setConfirmationWord("");

    try {
      const res = await fetch("/api/admin/profiles/delete/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          profileId: selectedProfileId,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        preview?: AdminProfileDeletePreview;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "プレビューに失敗しました。");
      }
      setPreview(data.preview ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "プレビューに失敗しました。");
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    if (!selectedProfileId || !preview?.canDelete) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/profiles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          profileId: selectedProfileId,
          confirmations,
          confirmationWord: confirmationWord.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        result?: AdminProfileDeleteResult;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました。");
      }
      setDeleteResult(data.result ?? null);
      setProfiles((prev) => prev.filter((p) => p.id !== selectedProfileId));
      setSelectedProfileId(null);
      setPreview(null);
      setConfirmations(emptyConfirmations());
      setConfirmationWord("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">1. 対象ユーザー</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[240px]">
            <span className="text-sm text-stone-700">メールアドレス</span>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => {
                setTargetEmail(e.target.value);
                setProfiles([]);
                setAccountSummary(null);
                setSelectedProfileId(null);
                resetDeleteState();
              }}
              placeholder="user@example.com"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleLoadProfiles}
            disabled={!canLoadProfiles}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {loadingProfiles ? "読み込み中…" : "プロフィール一覧を表示"}
          </button>
        </div>
      </section>

      {profiles.length > 0 ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">2. 削除対象プロフィール</h2>
          {accountSummary ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <p>
                プロフィール数: {accountSummary.profileCount} /{" "}
                {formatAdminEffectiveProfileLimitLabel({
                  isMonitor: accountSummary.isMonitor,
                  profileLimit: accountSummary.storedProfileLimit,
                })}
              </p>
              {accountSummary.isMonitor ? (
                <p className="mt-1 text-xs text-amber-900">モニター利用中（実効上限は最上位プラン相当）</p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            {profiles.map((profile) => (
              <label
                key={profile.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  selectedProfileId === profile.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <input
                  type="radio"
                  name="profileId"
                  value={profile.id}
                  checked={selectedProfileId === profile.id}
                  onChange={() => {
                    setSelectedProfileId(profile.id);
                    resetDeleteState();
                  }}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-stone-900">{profile.nickname}</p>
                  <p className="font-mono text-xs text-stone-600">{profile.id}</p>
                  <p className="text-xs text-stone-500">作成: {formatDate(profile.createdAt)}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {previewing ? "プレビュー中…" : "影響範囲をプレビュー"}
          </button>
        </section>
      ) : null}

      {preview ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">3. プレビュー結果</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">対象メール</dt>
              <dd className="text-stone-900">{preview.targetEmail}</dd>
            </div>
            <div>
              <dt className="text-stone-500">profileId</dt>
              <dd className="font-mono text-xs text-stone-900">{preview.profileId}</dd>
            </div>
            <div>
              <dt className="text-stone-500">プロフィール名</dt>
              <dd className="text-stone-900">{preview.profileNickname}</dd>
            </div>
            <div>
              <dt className="text-stone-500">プロフィール作成日時</dt>
              <dd className="text-stone-900">{formatDate(preview.profileCreatedAt)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">プロフィール更新日時</dt>
              <dd className="text-stone-900">{formatDate(preview.profileUpdatedAt)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">あしあと件数</dt>
              <dd className="text-stone-900">{preview.journalEntryCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">写真件数</dt>
              <dd className="text-stone-900">{preview.photoCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">あしあとブック件数</dt>
              <dd className="text-stone-900">{preview.diaryBookCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">本棚ブック件数</dt>
              <dd className="text-stone-900">{preview.bookshelfBookCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">鑑定作成データ件数</dt>
              <dd className="text-stone-900">{preview.kanteiCreationDataCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">あしあと製本申込件数</dt>
              <dd className="text-stone-900">{preview.diaryBindingCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">鑑定書製本申込件数</dt>
              <dd className="text-stone-900">{preview.kanteiBindingCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">BASE注文番号</dt>
              <dd className="text-stone-900">{preview.hasBaseOrderNumber ? "あり" : "なし"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">削除可否</dt>
              <dd className={preview.canDelete ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
                {preview.canDelete ? "削除可能" : "削除不可"}
              </dd>
            </div>
            {preview.blockMessage ? (
              <div className="sm:col-span-2">
                <dt className="text-stone-500">削除不可理由</dt>
                <dd className="text-red-800">{preview.blockMessage}</dd>
              </div>
            ) : null}
          </dl>

          {preview.canDelete && preview.willDeleteKanteiData ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">
                このプロフィールには鑑定作成データが {preview.kanteiCreationDataCount} 件あります。
              </p>
              <p className="mt-2">
                プロフィール削除時に、鑑定書データと鑑定書PDFも削除されます。
              </p>
            </div>
          ) : null}

          {preview.kanteiCreationDataList.length > 0 ? (
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <h3 className="text-sm font-semibold text-stone-900">鑑定作成データ一覧</h3>
              {preview.kanteiCreationDataList.map((row) => (
                <div key={row.id} className="rounded border border-stone-200 bg-stone-50 p-3 text-xs">
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div>
                      <span className="text-stone-500">鑑定コード: </span>
                      <span className="font-mono">{row.kanteiCode ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">氏名: </span>
                      {row.fullNameDisplay}
                    </div>
                    <div>
                      <span className="text-stone-500">作成日時: </span>
                      {formatDate(row.createdAt)}
                    </div>
                    <div>
                      <span className="text-stone-500">鑑定書PDF: </span>
                      preview {row.hasPdfPreviewBlob ? "あり" : "なし"} / print{" "}
                      {row.hasPdfPrintBlob ? "あり" : "なし"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!preview.canDelete ? (
            <div className="space-y-3">
              {preview.blockCode === "BASE_ORDER_NUMBER_EXISTS" ? (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
                  <p className="font-medium">削除できません。</p>
                  <p className="mt-2">BASE注文番号があるため、このプロフィールは削除できません。</p>
                </div>
              ) : preview.blockCode === "DIARY_BINDING_BLOCKED" || preview.blockCode === "KANTEI_BINDING_BLOCKED" ? (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
                  <p className="font-medium">削除できません。</p>
                  <p className="mt-2">
                    このプロフィールには製本申込またはBASE注文に関わるデータがあります。
                    実注文・製本処理に関わる可能性があるため、削除できません。
                  </p>
                </div>
              ) : null}
              {preview.blockingDiaryBinding ? (
                <BlockDetailCard detail={preview.blockingDiaryBinding} />
              ) : null}
              {preview.blockingKanteiBinding ? (
                <BlockDetailCard detail={preview.blockingKanteiBinding} />
              ) : null}
            </div>
          ) : null}

          {(preview.diaryBindings.length > 0 || preview.kanteiBindings.length > 0) ? (
            <div className="space-y-3 border-t border-stone-100 pt-4">
              <h3 className="text-sm font-semibold text-stone-900">紐づく製本申込一覧</h3>
              {preview.diaryBindings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="text-left text-stone-500">
                      <tr>
                        <th className="px-2 py-1">あしあと製本</th>
                        <th className="px-2 py-1">status</th>
                        <th className="px-2 py-1">BASE</th>
                        <th className="px-2 py-1">diaryBookId</th>
                        <th className="px-2 py-1">profileId</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.diaryBindings.map((row) => (
                        <tr key={row.id} className="border-t border-stone-100">
                          <td className="px-2 py-1 font-mono">{row.diaryBindingCode}</td>
                          <td className="px-2 py-1">{row.status}</td>
                          <td className="px-2 py-1">{row.baseOrderNumber ?? "なし"}</td>
                          <td className="px-2 py-1 font-mono">{row.diaryBookId ?? "—"}</td>
                          <td className="px-2 py-1 font-mono">{row.bindingProfileId || "（空）"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {preview.kanteiBindings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="text-left text-stone-500">
                      <tr>
                        <th className="px-2 py-1">鑑定製本</th>
                        <th className="px-2 py-1">status</th>
                        <th className="px-2 py-1">BASE</th>
                        <th className="px-2 py-1">orderId</th>
                        <th className="px-2 py-1">profileId</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.kanteiBindings.map((row) => (
                        <tr key={row.id} className="border-t border-stone-100">
                          <td className="px-2 py-1 font-mono">{row.kanteiCode}</td>
                          <td className="px-2 py-1">{row.status}</td>
                          <td className="px-2 py-1">{row.baseOrderNumber ?? "なし"}</td>
                          <td className="px-2 py-1 font-mono">{row.orderId}</td>
                          <td className="px-2 py-1 font-mono">{row.bindingProfileId || "（空）"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {preview?.canDelete ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-red-950">4. 削除確認</h2>
          <div className="rounded-lg border border-red-300 bg-white p-4 text-sm leading-relaxed text-red-950">
            <p className="font-medium">このプロフィールを削除します。</p>
            <p className="mt-2">
              この操作により、このプロフィールに紐づくあしあと本文・写真・あしあとブック
              {preview.willDeleteKanteiData ? "・鑑定書データ・鑑定書PDF" : ""}
              が削除されます。この操作は元に戻せません。
            </p>
            <p className="mt-2">
              削除前に、必要なバックアップが取得済みであることを確認してください。
            </p>
          </div>

          <div className="space-y-2">
            {requiredConfirmationKeys.map((key) => (
              <label key={key} className="flex items-start gap-2 text-sm text-red-950">
                <input
                  type="checkbox"
                  checked={confirmations[key]}
                  onChange={(e) =>
                    setConfirmations((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="mt-0.5"
                />
                <span>{CONFIRMATION_LABELS[key]}</span>
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-sm text-red-950">
              確認ワード（「{ADMIN_PROFILE_DELETE_CONFIRMATION_WORD}」と入力）
            </span>
            <input
              type="text"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-md border border-red-300 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {deleting ? "削除中…" : "プロフィールを削除する"}
          </button>
        </section>
      ) : null}

      {deleteResult ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-emerald-950">削除完了</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-emerald-700">対象メール</dt>
              <dd>{deleteResult.targetEmail}</dd>
            </div>
            <div>
              <dt className="text-emerald-700">profileId</dt>
              <dd className="font-mono text-xs">{deleteResult.profileId}</dd>
            </div>
            <div>
              <dt className="text-emerald-700">プロフィール名</dt>
              <dd>{deleteResult.profileNickname}</dd>
            </div>
            <div>
              <dt className="text-emerald-700">削除したあしあと</dt>
              <dd>{deleteResult.deletedJournalEntryCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">削除した写真Blob</dt>
              <dd>{deleteResult.deletedPhotoBlobCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">あしあとブック</dt>
              <dd>{deleteResult.deletedDiaryBookCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">本棚ブック</dt>
              <dd>{deleteResult.deletedBookshelfBookCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">あしあと製本申込</dt>
              <dd>{deleteResult.deletedDiaryBindingCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">鑑定書製本申込</dt>
              <dd>{deleteResult.deletedKanteiBindingCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">鑑定作成データ</dt>
              <dd>{deleteResult.deletedKanteiCreationDataCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">鑑定書PDF Blob</dt>
              <dd>{deleteResult.deletedKanteiPdfBlobCount} 件</dd>
            </div>
          </dl>
          {deleteResult.failedPhotoBlobCount > 0 ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-medium">
                写真Blobの削除に {deleteResult.failedPhotoBlobCount} 件失敗しました（DB上のデータは削除済み）。
              </p>
              <ul className="mt-2 list-disc pl-5">
                {deleteResult.photoBlobWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-sm text-emerald-800">
            対象ユーザーがこのプロフィールを選択中だった場合、次回アクセス時に別プロフィールへ切り替わります。
          </p>
          <Link
            href="/admin/journal-backup-restore"
            className="inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            あしあとバックアップ復元ページへ →
          </Link>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
      ) : null}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        <p className="font-medium">安全上の注意</p>
        <ul className="mt-2 list-disc pl-5">
          <li>BASE注文番号がある製本申込があるプロフィールは削除できません。</li>
          <li>有効な製本申込（ordered / in_production / shipped 等）があるプロフィールも削除できません。</li>
          <li>鑑定作成データがある場合は、確認チェックのうえ削除対象に含まれます（鑑定書PDF Blob含む）。</li>
          <li>レガシーの profileId=&quot;&quot; データはこの画面からは削除されません（明示的な profileId のみ）。</li>
          <li>AccountSettings・Stripe・BASE API連携データは削除しません。</li>
        </ul>
      </div>
    </div>
  );
}
