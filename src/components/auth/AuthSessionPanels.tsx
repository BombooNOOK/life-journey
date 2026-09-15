"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { FOREST_LEAVE_LABEL } from "@/lib/auth/forestSessionCopy";
import { LOG_HOUSE_GO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_BODY,
  FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_BUTTON,
  FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_TITLE,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";

/** マイページ下部：控えめなログアウト導線 */
export function MyPageLogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();

  return (
    <div className={`border-t border-stone-200 pt-4 ${className}`.trim()}>
      <button
        type="button"
        className={`${mobileReadable.buttonSecondary} w-full sm:w-auto`}
        onClick={() => {
          void (async () => {
            await signOutUser();
            router.push("/");
            router.refresh();
          })();
        }}
      >
        {FOREST_LEAVE_LABEL}
      </button>
    </div>
  );
}

/** ログイン済みで /login に来たときの案内 */
export function AlreadyLoggedInPanel() {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-2 text-center">
        <h1 className={mobileReadable.pageTitle}>すでに森のなかにいます</h1>
        <p className={mobileReadable.body}>{LOG_HOUSE_GO_LABEL}か、森から出られます。</p>
      </div>

      <div className="space-y-3">
        <Link href="/orders" className={mobileReadable.buttonPrimary}>
          {LOG_HOUSE_GO_LABEL}
        </Link>
        <button
          type="button"
          className={mobileReadable.buttonSecondary}
          onClick={() => {
            void (async () => {
              await signOutUser();
              router.refresh();
            })();
          }}
        >
          {FOREST_LEAVE_LABEL}
        </button>
      </div>
    </div>
  );
}

type RegistrationCompletePanelProps = {
  welcomeEmailSent: boolean;
  variant?: "default" | "firstVisitResident";
  onGoMyPage: () => void;
};

/** 新規アカウント作成直後の案内 */
export function RegistrationCompletePanel({
  welcomeEmailSent,
  variant = "default",
  onGoMyPage,
}: RegistrationCompletePanelProps) {
  const isFirstVisit = variant === "firstVisitResident";

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-emerald-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <h1 className={mobileReadable.pageTitle}>
          {isFirstVisit ? FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_TITLE : "アカウントを作成しました"}
        </h1>
        <p className={mobileReadable.body}>
          {isFirstVisit
            ? FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_BODY
            : `このまま${LOG_HOUSE_GO_LABEL}。`}
        </p>
        {isFirstVisit ? (
          <p className={mobileReadable.helper}>
            メールアドレスとパスワードでアカウントを作成しました。
          </p>
        ) : null}
        {welcomeEmailSent ? (
          <p className={mobileReadable.helper}>
            ご登録のメールアドレスに案内メールをお送りしました。届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        ) : null}
      </div>

      <button type="button" className={mobileReadable.buttonPrimary} onClick={onGoMyPage}>
        {isFirstVisit ? FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_BUTTON : LOG_HOUSE_GO_LABEL}
      </button>
    </div>
  );
}

type EmailVerificationPendingPanelProps = {
  phase: "sending" | "sent" | "checking" | "error";
  errorMessage?: string | null;
  resendDisabled: boolean;
  onCheck: () => void;
  onResend: () => void;
};

/** メール/パスワード新規登録後：Firebase emailVerified 待ち */
export function EmailVerificationPendingPanel({
  phase,
  errorMessage,
  resendDisabled,
  onCheck,
  onResend,
}: EmailVerificationPendingPanelProps) {
  const busy = phase === "sending" || phase === "checking";

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-amber-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <h1 className={mobileReadable.pageTitle}>メール確認が必要です</h1>
        <p className={mobileReadable.body}>
          確認メールを送信しました。メール内のリンクを開いたあと、この画面で「確認済みかチェック」を押してください。
        </p>
        <p className={mobileReadable.helper}>
          届かない場合は迷惑メールフォルダもご確認ください。案内メール（welcome）とは別の確認メールです。
        </p>
        {phase === "sending" ? (
          <p className={mobileReadable.helper}>確認メールを送信しています…</p>
        ) : null}
        {phase === "checking" ? (
          <p className={mobileReadable.helper}>確認状態を調べています…</p>
        ) : null}
        {phase === "error" && errorMessage ? (
          <p className={`${mobileReadable.helper} text-red-700`} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className={mobileReadable.buttonPrimary}
          disabled={busy}
          onClick={onCheck}
        >
          確認済みかチェック
        </button>
        <button
          type="button"
          className={mobileReadable.buttonSecondary}
          disabled={busy || resendDisabled}
          onClick={onResend}
        >
          確認メールを再送
        </button>
      </div>
    </div>
  );
}
