"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS,
  ADMIN_PROFILE_DELETE_CONFIRMATION_WORD,
  type AdminProfileDeleteConfirmationKey,
  type AdminProfileDeletePreview,
  type AdminProfileDeleteResult,
  type AdminProfileListItem,
} from "@/lib/profile/adminProfileDeleteTypes";

const CONFIRMATION_LABELS: Record<AdminProfileDeleteConfirmationKey, string> = {
  profileReviewed: "削除対象プロフィールを確認しました",
  backupReviewed: "必要なバックアップが取得済みであることを確認しました",
  journalDataReviewed: "日記本文・写真が削除されることを確認しました",
  noOrderBindingReviewed: "実注文・製本申込に関わるデータがないことを確認しました",
};

function emptyConfirmations(): Record<AdminProfileDeleteConfirmationKey, boolean> {
  return {
    profileReviewed: false,
    backupReviewed: false,
    journalDataReviewed: false,
    noOrderBindingReviewed: false,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP");
}

export function ProfileManagementClient() {
  const [targetEmail, setTargetEmail] = useState("");
  const [profiles, setProfiles] = useState<AdminProfileListItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminProfileDeletePreview | null>(null);
  const [confirmations, setConfirmations] = useState(emptyConfirmations);
  const [confirmationWord, setConfirmationWord] = useState("");
  const [deleteResult, setDeleteResult] = useState<AdminProfileDeleteResult | null>(null);

  const allConfirmed = useMemo(
    () => ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS.every((key) => confirmations[key]),
    [confirmations],
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
              <dt className="text-stone-500">日記件数</dt>
              <dd className="text-stone-900">{preview.journalEntryCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">写真件数</dt>
              <dd className="text-stone-900">{preview.photoCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">日記ブック件数</dt>
              <dd className="text-stone-900">{preview.diaryBookCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">本棚ブック件数</dt>
              <dd className="text-stone-900">{preview.bookshelfBookCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Order件数</dt>
              <dd className="text-stone-900">{preview.orderCount}</dd>
            </div>
            <div>
              <dt className="text-stone-500">日記製本申込件数</dt>
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
        </section>
      ) : null}

      {preview?.canDelete ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-red-950">4. 削除確認</h2>
          <div className="rounded-lg border border-red-300 bg-white p-4 text-sm leading-relaxed text-red-950">
            <p className="font-medium">このプロフィールを削除します。</p>
            <p className="mt-2">
              この操作により、このプロフィールに紐づく日記本文・写真・日記ブックが削除されます。
              この操作は元に戻せません。
            </p>
            <p className="mt-2">
              削除前に、必要なバックアップが取得済みであることを確認してください。
            </p>
          </div>

          <div className="space-y-2">
            {ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS.map((key) => (
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
              <dt className="text-emerald-700">削除した日記</dt>
              <dd>{deleteResult.deletedJournalEntryCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">削除した写真Blob</dt>
              <dd>{deleteResult.deletedPhotoBlobCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">日記ブック</dt>
              <dd>{deleteResult.deletedDiaryBookCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">本棚ブック</dt>
              <dd>{deleteResult.deletedBookshelfBookCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">日記製本申込</dt>
              <dd>{deleteResult.deletedDiaryBindingCount} 件</dd>
            </div>
            <div>
              <dt className="text-emerald-700">鑑定書製本申込</dt>
              <dd>{deleteResult.deletedKanteiBindingCount} 件</dd>
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
            日記バックアップ復元ページへ →
          </Link>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
      ) : null}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        <p className="font-medium">安全上の注意</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Order（鑑定書）が1件でもあるプロフィールは削除できません。</li>
          <li>有効な製本申込があるプロフィールも削除できません。</li>
          <li>レガシーの profileId=&quot;&quot; データはこの画面からは削除されません（明示的な profileId のみ）。</li>
          <li>鑑定書PDF Blob・AccountSettings・Stripe・BASE注文データは削除しません。</li>
        </ul>
      </div>
    </div>
  );
}
