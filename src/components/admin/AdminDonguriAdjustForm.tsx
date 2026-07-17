"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  adminAdjustDonguriAction,
  type AdminDonguriAdjustState,
} from "@/app/admin/donguri/actions";

const INITIAL: AdminDonguriAdjustState = { ok: false, message: "" };

type ProfileBalance = {
  id: string;
  nickname: string;
  balance: number;
};

type Props = {
  email: string;
  profiles: ProfileBalance[];
};

type ConfirmState = {
  mode: "delta" | "set_to_2";
  profileId: string;
  amount: number;
  description: string;
  currentBalance: number;
  nextBalance: number;
};

function parseAdjustmentAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/^\+/, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n === 0) return null;
  return n;
}

/**
 * 管理者限定：どんぐり残高を ledger の adjustment で調整する。
 * 残高の直接書き換えはしない。確認ダイアログ必須。
 */
export function AdminDonguriAdjustForm({ email, profiles }: Props) {
  const [state, action, pending] = useActionState(adminAdjustDonguriAction, INITIAL);
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [amountText, setAmountText] = useState("-48");
  const [description, setDescription] = useState("不足時導線確認のため");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const currentBalance = useMemo(() => {
    return profiles.find((p) => p.id === profileId)?.balance ?? 0;
  }, [profiles, profileId]);

  useEffect(() => {
    if (state.ok) setConfirm(null);
  }, [state]);

  if (profiles.length === 0) {
    return <p className="text-sm text-stone-600">プロフィールがありません。</p>;
  }

  function openDeltaConfirm() {
    const amount = parseAdjustmentAmount(amountText);
    if (amount == null) {
      window.alert("調整数は 0 以外の整数で入力してください（例: +10 / -48）。");
      return;
    }
    setConfirm({
      mode: "delta",
      profileId,
      amount,
      description: description.trim(),
      currentBalance,
      nextBalance: currentBalance + amount,
    });
  }

  function openSetTo2Confirm() {
    const amount = 2 - currentBalance;
    if (amount === 0) {
      window.alert("すでに 2こです。");
      return;
    }
    setConfirm({
      mode: "set_to_2",
      profileId,
      amount,
      description: description.trim() || "不足時導線確認のため",
      currentBalance,
      nextBalance: 2,
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">どんぐりを調整する</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          残高を直接書き換えず、台帳に <code className="text-[11px]">adjustment</code>{" "}
          を追加します。不足時導線の確認用です。
        </p>
      </div>

      <label className="block text-sm text-stone-700">
        プロフィール
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname || p.id}（現在 {p.balance}こ）
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-stone-800">
        現在のどんぐり：
        <span className="ml-1 font-semibold tabular-nums">{currentBalance}こ</span>
      </p>

      <label className="block text-sm text-stone-700">
        調整数（プラス・マイナス可）
        <input
          type="text"
          inputMode="numeric"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          placeholder="-48 または +10"
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm text-stone-700">
        理由メモ（管理者台帳に表示）
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="不足時導線確認のため"
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={openDeltaConfirm}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          調整内容を確認
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={openSetTo2Confirm}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-700 bg-white px-4 text-sm font-medium text-amber-950 disabled:opacity-60"
        >
          残高を2こにする
        </button>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-800" : "text-red-700"}`}>{state.message}</p>
      ) : null}

      {confirm ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donguri-adjust-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h4 id="donguri-adjust-confirm-title" className="text-base font-semibold text-stone-900">
              どんぐりを調整しますか？
            </h4>
            <div className="mt-3 space-y-1 text-sm text-stone-700">
              <p>
                現在のどんぐり：
                <span className="font-semibold tabular-nums">{confirm.currentBalance}こ</span>
              </p>
              <p>
                調整後のどんぐり：
                <span className="font-semibold tabular-nums">{confirm.nextBalance}こ</span>
              </p>
              <p className="text-xs text-stone-500">
                調整数：{confirm.amount > 0 ? "+" : ""}
                {confirm.amount}
                {confirm.description ? ` ／ ${confirm.description}` : null}
              </p>
              <p className="pt-2 text-xs leading-relaxed text-stone-600">
                この操作はどんぐり台帳に記録されます。
              </p>
            </div>

            <form action={action} className="mt-5 flex flex-wrap gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="profileId" value={confirm.profileId} />
              <input type="hidden" name="mode" value={confirm.mode} />
              <input type="hidden" name="amount" value={String(confirm.amount)} />
              <input type="hidden" name="description" value={confirm.description} />
              <input type="hidden" name="confirmed" value="1" />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "処理中…" : "調整する"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirm(null)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 disabled:opacity-60"
              >
                キャンセル
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
