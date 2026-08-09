"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  ACCOUNT_DELETE_CONFIRMATION_WORD,
  ACCOUNT_DELETE_DATA_ITEMS,
} from "@/lib/account/accountDeleteTypes";
import { LEAVE_RESIDENT_REGISTRATION_LABEL } from "@/lib/account/residentRegistrationUiCopy";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { clearAllFirstVisitClientState } from "@/lib/onboarding/firstVisitWizard/session";

type Props = {
  blockMessage?: string | null;
};

export function AccountDeleteForm({ blockMessage = null }: Props) {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();
  const [confirmationWord, setConfirmationWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !blockMessage && confirmationWord.trim() === ACCOUNT_DELETE_CONFIRMATION_WORD;

  async function submitDelete() {
    if (!canSubmit) return;

    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationWord: confirmationWord.trim() }),
      });
      const json = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        setError(json.error ?? "アカウントの削除に失敗しました。");
        return;
      }

      clearAllFirstVisitClientState();
      await signOutUser();
      router.push("/");
      router.refresh();
    } catch {
      setError("アカウントの削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-3 ${mobileReadable.body}`}>
        <p>
          「住民登録をやめる」と進めると、実際にはログイン用のアカウントと、
          LJDに保存されたあしあと・写真・鑑定結果・住民票などの関連データが削除されます。
        </p>
        <p>
          あわせて、メール／パスワードや Google ログインの紐づけも削除されます。
          削除後は復元できず、同じメールで再ログインすることもできません。
        </p>
        <p>
          製本注文済みの商品や決済・注文履歴については、法令上または運営上必要な範囲で一定期間保管される場合があります。
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50/70 px-4 py-4">
        <p className="text-base font-medium text-stone-900">削除される主なデータ</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-[1.6] text-stone-700">
          {ACCOUNT_DELETE_DATA_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {blockMessage ? (
        <div className={mobileReadable.error} role="alert">
          {blockMessage}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="account-delete-confirmation" className={mobileReadable.label}>
          最終確認（「{ACCOUNT_DELETE_CONFIRMATION_WORD}」と入力）
        </label>
        <p className="text-sm text-stone-600">
          アカウント削除を実行するには、下の欄に「{ACCOUNT_DELETE_CONFIRMATION_WORD}」と入力してください。
        </p>
        <input
          id="account-delete-confirmation"
          type="text"
          value={confirmationWord}
          onChange={(event) => setConfirmationWord(event.target.value)}
          autoComplete="off"
          disabled={Boolean(blockMessage) || busy}
          className={mobileReadable.input}
          placeholder={ACCOUNT_DELETE_CONFIRMATION_WORD}
        />
      </div>

      {error ? (
        <div className={mobileReadable.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={() => void submitDelete()}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-base font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
        >
          {busy ? (
            <OwlLoadingInline label="削除中…" size="sm" />
          ) : (
            LEAVE_RESIDENT_REGISTRATION_LABEL
          )}
        </button>
        <Link href="/orders/account" className={mobileReadable.buttonSecondary}>
          やめずに戻る
        </Link>
      </div>
    </div>
  );
}
