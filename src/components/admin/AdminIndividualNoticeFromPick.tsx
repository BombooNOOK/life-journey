"use client";

import { useEffect, useState } from "react";

import { sendBulkIndividualSystemNoticeAction } from "@/app/admin/system-notices/actions";
import { ADMIN_FOREST_NOTICE_EMAILS_STORAGE_KEY } from "@/lib/admin/adminUserDirectory";

type Props = {
  initialError?: string | null;
  savedBulk?: { sent: number; skipped: number } | null;
};

/** 管理者一覧で選んだ宛先への一括個別送信フォーム */
export function AdminIndividualNoticeFromPick({ initialError, savedBulk }: Props) {
  const [emails, setEmails] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_FOREST_NOTICE_EMAILS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setEmails(
            parsed
              .filter((v): v is string => typeof v === "string")
              .map((v) => v.trim())
              .filter(Boolean),
          );
        }
      }
    } catch {
      setEmails([]);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return <p className="text-sm text-stone-500">宛先を読み込み中…</p>;
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        管理者一覧で宛先が選ばれていません。一覧に戻ってチェックしてから「個別お手紙」を押してください。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {initialError}
        </div>
      ) : null}
      {savedBulk ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          一括個別送信しました（成功 {savedBulk.sent} / スキップ {savedBulk.skipped}）。
          各アカウントの最初のプロフィールのポストに届きます。
        </div>
      ) : null}

      <form
        action={sendBulkIndividualSystemNoticeAction}
        className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"
      >
        {emails.map((email) => (
          <input key={email} type="hidden" name="emails" value={email} />
        ))}

        <div>
          <p className="text-sm font-medium text-stone-800">宛先 {emails.length} 件</p>
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-700">
            {emails.map((email) => (
              <li key={email} className="truncate py-0.5">
                {email}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">
            各メールの代表プロフィール（いちばん最初に作られたプロフィール）へ送ります。
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-800">タイトル</span>
          <input
            name="title"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            placeholder="例: 1年のお礼 / キャンペーン当選のお知らせ"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-800">本文</span>
          <textarea
            name="body"
            required
            rows={8}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm leading-relaxed"
            placeholder="選択した方だけに届く本文"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-800">アクション文言（任意）</span>
            <input
              name="actionLabel"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-800">アクション経路（任意）</span>
            <input
              name="actionRoute"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              placeholder="/help"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
          <input type="checkbox" name="confirmed" value="1" required />
          上記 {emails.length} 件だけに送ることを確認しました（全ユーザー共通公開ではありません）
        </label>

        <button
          type="submit"
          className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {emails.length} 件に個別送信する
        </button>
      </form>
    </div>
  );
}
