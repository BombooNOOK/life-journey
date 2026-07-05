"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
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
        ログアウトする
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
        <h1 className={mobileReadable.pageTitle}>すでにログインしています</h1>
        <p className={mobileReadable.body}>{LOG_HOUSE_GO_LABEL}か、ログアウトできます。</p>
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
          ログアウトする
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
            ご登録のメールアドレスに確認メールをお送りしました。届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        ) : null}
      </div>

      <button type="button" className={mobileReadable.buttonPrimary} onClick={onGoMyPage}>
        {isFirstVisit ? FIRST_VISIT_RESIDENT_REGISTRATION_COMPLETE_BUTTON : LOG_HOUSE_GO_LABEL}
      </button>
    </div>
  );
}
