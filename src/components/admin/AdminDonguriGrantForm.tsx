"use client";

import { useActionState } from "react";

import {
  adminGrantDonguriAction,
  type AdminDonguriGrantState,
} from "@/app/admin/donguri/actions";

const INITIAL: AdminDonguriGrantState = { ok: false, message: "" };

type Props = {
  email: string;
  profiles: { id: string; nickname: string }[];
};

/** 管理者：どんぐり手動付与（確認チェック必須） */
export function AdminDonguriGrantForm({ email, profiles }: Props) {
  const [state, action, pending] = useActionState(adminGrantDonguriAction, INITIAL);
  const defaultProfileId = profiles[0]?.id ?? "";

  if (profiles.length === 0) {
    return <p className="text-sm text-stone-600">プロフィールがありません。</p>;
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-900">手動付与</h3>
      <input type="hidden" name="email" value={email} />

      <label className="block text-sm text-stone-700">
        プロフィール
        <select
          name="profileId"
          defaultValue={defaultProfileId}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname || p.id}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-stone-700">
        付与数（負の数で減算も可）
        <input
          name="amount"
          type="number"
          required
          defaultValue={10}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm text-stone-700">
        管理メモ / 説明
        <input
          name="description"
          type="text"
          placeholder="テスト協力のお礼"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="notifyMailbox" value="1" defaultChecked />
        ポストにも通知する
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <input type="checkbox" name="confirmed" value="1" required />
        付与内容を確認しました
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "処理中…" : "付与する"}
      </button>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-800" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
