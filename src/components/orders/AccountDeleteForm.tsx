"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { ACCOUNT_DELETE_CONFIRMATION_WORD } from "@/lib/account/accountDeleteTypes";
import {
  ASHIATO_BACKUP_LABEL,
  LEAVE_RESIDENT_REGISTRATION_CONFIRM_BODY,
  LEAVE_RESIDENT_REGISTRATION_CONFIRM_SUBMIT,
  LEAVE_RESIDENT_REGISTRATION_CONFIRM_TITLE,
  LEAVE_RESIDENT_REGISTRATION_LABEL,
} from "@/lib/account/residentRegistrationUiCopy";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { clearAllFirstVisitClientState } from "@/lib/onboarding/firstVisitWizard/session";

type Props = {
  blockMessage?: string | null;
};

export function AccountDeleteForm({ blockMessage = null }: Props) {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();
  const [confirmationWord, setConfirmationWord] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const canSubmit = !blockMessage && confirmationWord.trim() === ACCOUNT_DELETE_CONFIRMATION_WORD;

  useEffect(() => {
    if (!confirmOpen) return;
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setConfirmOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, busy]);

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
        setConfirmOpen(false);
        setError(json.error ?? "アカウントの削除に失敗しました。");
        return;
      }

      clearAllFirstVisitClientState();
      await signOutUser();
      router.push("/");
      router.refresh();
    } catch {
      setConfirmOpen(false);
      setError("アカウントの削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-3 ${mobileReadable.body}`}>
        <p>
          この手続きをすると、ログイン情報と、森に残したあしあと・写真・鑑定結果などの保存データが削除されます。あとから元に戻すことはできません。大切な記録がある場合は、先に
          <Link
            href="/orders/settings/backup"
            className="mx-0.5 font-medium text-emerald-900 underline underline-offset-2 hover:text-emerald-800"
          >
            『{ASHIATO_BACKUP_LABEL}』
          </Link>
          をご確認ください。
        </p>
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
          間違えのないよう、下の欄に「{ACCOUNT_DELETE_CONFIRMATION_WORD}」と入力してから進んでください。
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
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-base font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
        >
          {LEAVE_RESIDENT_REGISTRATION_LABEL}
        </button>
        <Link href="/orders/account" className={mobileReadable.buttonSecondary}>
          やめずに戻る
        </Link>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setConfirmOpen(false);
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            tabIndex={-1}
            className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl outline-none"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={dialogTitleId} className="text-base font-semibold text-stone-900">
              {LEAVE_RESIDENT_REGISTRATION_CONFIRM_TITLE}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              {LEAVE_RESIDENT_REGISTRATION_CONFIRM_BODY}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                やめておく
              </button>
              <button
                type="button"
                disabled={busy || !canSubmit}
                onClick={() => void submitDelete()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-base font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
              >
                {busy ? (
                  <OwlLoadingInline label="削除中…" size="sm" />
                ) : (
                  LEAVE_RESIDENT_REGISTRATION_CONFIRM_SUBMIT
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
