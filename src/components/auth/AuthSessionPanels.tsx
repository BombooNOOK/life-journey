"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";

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
        <p className={mobileReadable.body}>マイページへ進むか、ログアウトできます。</p>
      </div>

      <div className="space-y-3">
        <Link href="/orders" className={mobileReadable.buttonPrimary}>
          マイページへ進む
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
  onGoMyPage: () => void;
};

/** 新規アカウント作成直後の案内 */
export function RegistrationCompletePanel({
  welcomeEmailSent,
  onGoMyPage,
}: RegistrationCompletePanelProps) {
  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-emerald-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <h1 className={mobileReadable.pageTitle}>アカウントを作成しました</h1>
        <p className={mobileReadable.body}>このままマイページへ進めます。</p>
        {welcomeEmailSent ? (
          <p className={mobileReadable.helper}>
            ご登録のメールアドレスに確認メールをお送りしました。届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        ) : null}
      </div>

      <button type="button" className={mobileReadable.buttonPrimary} onClick={onGoMyPage}>
        マイページへ進む
      </button>
    </div>
  );
}
