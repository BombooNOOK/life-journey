"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  type UserCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import {
  clearGoogleOAuthRedirectFlow,
  isGoogleOAuthFlowCookieActive,
  markGoogleOAuthRedirectFlow,
  readOAuthReturnPendingAgeMs,
  stashOAuthReturnTo,
  syncLjAuthClientCookies,
} from "@/lib/auth/clientCookies";
import { getFirebaseAuth, waitForFirebaseAuthPersistence } from "@/lib/firebase/client";

function resolveSafeReturnTo(raw: string | null): string {
  if (!raw) return "/orders";
  if (!raw.startsWith("/")) return "/orders";
  if (raw.startsWith("//")) return "/orders";
  return raw;
}

function pickErrorMessage(e: unknown, fallback: string): string {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : fallback;

  if (raw.includes("auth/email-already-in-use")) {
    return "このメールアドレスはすでに登録されています。上の「既存アカウント」を選び、「メールでログイン」から入ってください。";
  }
  if (raw.includes("auth/account-exists-with-different-credential")) {
    return "このメールアドレスは別のログイン方法で登録済みです。Googleで続けるか、別のメールアドレスを使ってください。";
  }
  if (raw.includes("auth/unauthorized-domain")) {
    return "このアクセス先はログイン許可設定に含まれていません。Firebase の承認済みドメイン設定をご確認ください。";
  }
  if (raw.includes("requested action is invalid")) {
    return "Googleログインの設定に問題があります。時間をおいて再試行してください。";
  }
  if (raw.includes("auth/popup-closed-by-user")) {
    return "Googleの選択画面を閉じたため、ログインは完了していません。もう一度お試しください。";
  }
  if (
    raw.includes("auth/popup-blocked") ||
    raw.includes("popup-blocked") ||
    raw.includes("auth/cancelled-popup-request")
  ) {
    return "ポップアップがブロックされています。Safari のアドレスバー左の「aA」→「ポップアップを許可」、または画面下の「ブロックされたポップアップ」から許可して、もう一度「Google で続ける」を押してください。";
  }
  if (
    raw.includes("auth/invalid-login-credentials") ||
    raw.includes("auth/invalid-credential") ||
    raw.includes("auth/wrong-password") ||
    raw.includes("auth/user-not-found")
  ) {
    return "メールアドレスかパスワードが違います。入力内容をもう一度確認してください。";
  }

  return raw.trim() || fallback;
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyReset, setBusyReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  /** Google から戻った直後に再描画してバナーを出す（Safari は pageshow が必要なことがある） */
  const [oauthReturnSurface, setOauthReturnSurface] = useState(0);
  /** 連打で途中状態が重なり「3回押すと入る」になるのを防ぐ */
  const googleSignInLock = useRef(false);

  const returnTo = resolveSafeReturnTo(searchParams.get("returnTo"));

  const showGoogleReturnBanner =
    !authLoading &&
    !user &&
    (isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null);

  useLayoutEffect(() => {
    const bump = () => setOauthReturnSurface((n) => n + 1);
    bump();
    window.addEventListener("pageshow", bump);
    return () => window.removeEventListener("pageshow", bump);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      clearGoogleOAuthRedirectFlow();
      return;
    }
    const pendingAge = readOAuthReturnPendingAgeMs();
    if (pendingAge == null && !isGoogleOAuthFlowCookieActive()) return;

    const id = window.setTimeout(() => {
      try {
        const auth = getFirebaseAuth();
        if (auth.currentUser) {
          clearGoogleOAuthRedirectFlow();
          return;
        }
        if (readOAuthReturnPendingAgeMs() == null && !isGoogleOAuthFlowCookieActive()) return;
        clearGoogleOAuthRedirectFlow();
        setError(
          [
            "Googleから戻りましたが、この端末ではログイン状態を取り込めませんでした（エラーは出ないことがあります）。",
            "",
            "試すこと：",
            "1）設定 → Safari → 詳細 → 「サイト越えトラッキング防止」をオフにして、もう一度「Googleで続ける」",
            "2）プライベートブラウズをやめて通常のタブで開く",
            "3）メールアドレスとパスワードでログイン（登録済みの場合）",
          ].join("\n"),
        );
      } catch {
        /* noop */
      }
    }, 1600);
    return () => window.clearTimeout(id);
  }, [authLoading, user, oauthReturnSurface]);

  const auth = () => {
    try {
      return getFirebaseAuth();
    } catch (e) {
      setError(pickErrorMessage(e, "初期化に失敗しました。"));
      return null;
    }
  };

  const navigateAfterLogin = (target: string) => {
    router.push(target);
    router.refresh();
  };

  const handleGoogle = async () => {
    if (googleSignInLock.current) return;
    googleSignInLock.current = true;
    setBusyGoogle(true);
    try {
      setError(null);
      setNotice(null);
      const a = auth();
      if (!a) return;
      await waitForFirebaseAuthPersistence(a);
      if (typeof a.authStateReady === "function") {
        await a.authStateReady();
      }
      const isIOS =
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(navigator.userAgent);

      const completeGoogleSignIn = async (cred: UserCredential) => {
        clearGoogleOAuthRedirectFlow();
        syncLjAuthClientCookies({ email: cred.user.email ?? null });
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cred.user.email ?? "" }),
          credentials: "same-origin",
        }).catch(() => {});
        /** スマホの Safari 等では client 遷移だとクッキーが次リクエストに乗る前に /orders へ行き、一度 /login に弾かれることがある */
        if (isIOS || isAndroid) {
          window.location.assign(new URL(returnTo, window.location.origin).toString());
          return;
        }
        navigateAfterLogin(returnTo);
      };
      try {
      const provider = new GoogleAuthProvider();
      /** Mac と同様に「どのアカウントか」を選ばせる（iPhone だけ省略されやすい） */
      provider.setCustomParameters({ prompt: "select_account" });
      /** iPhone/iPad はリダイレクト方式だと戻り後に認証状態が復元できないことが多いので、まずポップアップを試す */

      if (isIOS) {
        try {
          const cred = await signInWithPopup(a, provider);
          await completeGoogleSignIn(cred);
          return;
        } catch (e) {
          const raw = e instanceof Error ? e.message : String(e);
          const useRedirect =
            raw.trim().length === 0 ||
            /popup|blocked|cancelled-popup|Popup|COOP|web-storage|storage/i.test(raw) ||
            raw.includes("auth/cancelled-popup-request") ||
            raw.includes("auth/popup-blocked");
          if (useRedirect) {
            stashOAuthReturnTo(returnTo);
            markGoogleOAuthRedirectFlow();
            await signInWithRedirect(a, provider);
            return;
          }
          throw e;
        }
      }

      if (isAndroid) {
        stashOAuthReturnTo(returnTo);
        markGoogleOAuthRedirectFlow();
        await signInWithRedirect(a, provider);
        return;
      }

      const cred = await signInWithPopup(a, provider);
      await completeGoogleSignIn(cred);
      } catch (e) {
        console.error("[login:google]", e);
        clearGoogleOAuthRedirectFlow();
        setError(pickErrorMessage(e, "Google ログインに失敗しました。"));
      }
    } finally {
      setBusyGoogle(false);
      googleSignInLock.current = false;
    }
  };

  const handleEmailSubmit = async (
    formData: FormData,
    mode: "login" | "register",
  ) => {
    setError(null);
    setNotice(null);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("メールアドレスとパスワードの両方を入力してください。");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setError("新規登録のときは、パスワードを6文字以上にしてください。");
      return;
    }

    const a = auth();
    if (!a) return;
    setBusyEmail(true);
    try {
      let cred;
      if (mode === "register") {
        cred = await createUserWithEmailAndPassword(a, email, password);
      } else {
        cred = await signInWithEmailAndPassword(a, email, password);
      }
      syncLjAuthClientCookies({ email: cred.user.email ?? null });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cred.user.email ?? "" }),
        credentials: "same-origin",
      }).catch(() => {});
      navigateAfterLogin(returnTo);
    } catch (e) {
      console.error("[login:email]", e);
      setError(pickErrorMessage(e, "メールでの認証に失敗しました。"));
    } finally {
      setBusyEmail(false);
    }
  };

  const handlePasswordReset = async (formData: FormData) => {
    setError(null);
    setNotice(null);
    const email = String(formData.get("email") ?? "").trim();
    if (!email) {
      setError("先にメールアドレスを入力してください。");
      return;
    }
    const a = auth();
    if (!a) return;
    setBusyReset(true);
    try {
      await sendPasswordResetEmail(a, email);
      setNotice("パスワード再設定メールを送信しました。受信ボックスをご確認ください。");
    } catch (e) {
      console.error("[login:password-reset]", e);
      const raw =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : "";
      if (
        raw.includes("auth/user-not-found") ||
        raw.includes("auth/invalid-email") ||
        raw.includes("auth/invalid-login-credentials")
      ) {
        setNotice(
          "再設定メールを送信しました。登録済みのメールアドレスであれば、数分以内に届きます。",
        );
      } else {
        setError(pickErrorMessage(e, "パスワード再設定メールの送信に失敗しました。"));
      }
    } finally {
      setBusyReset(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">ログイン</h1>
        <p className="mt-1 text-sm text-stone-600">
          Firebase Authentication でサインインします。コンソールで有効にした方式だけ使えます。
        </p>
        <p className="mt-1 text-xs text-stone-500">
          ログイン後は、アクセスしようとしていたページ（またはマイページ）へ移動します。
        </p>
        <p className="mt-1 text-xs text-stone-500">
          スマホで安定して使うには、URLをSafariで直接開いてください（アプリ内ブラウザは不安定な場合があります）。iPhone
          で Google を選ぶとポップアップが開くことがあります。ブロックと出たら許可してからもう一度押してください。
        </p>
      </div>

      {showGoogleReturnBanner ? (
        <div
          key={oauthReturnSurface}
          className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-3 text-sm leading-relaxed text-violet-950"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">Google の認証から戻ってきました</p>
          <p className="mt-2">
            このあと自動で進まないときは、約2秒待つと赤い案内が出ることがあります。出ない場合は、設定 → Safari
            → 詳細 → 「サイト越えトラッキング防止」をオフにしてから、もう一度「Google で続ける」を試してください。
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}

      <button
        type="button"
        disabled={busyGoogle}
        onClick={() => void handleGoogle()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50"
      >
        {busyGoogle ? "処理中…" : "Google で続ける"}
      </button>

      {busyGoogle ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-950"
          role="status"
          aria-live="polite"
        >
          Google に接続しています。この表示がすぐ消える場合は、画面下の「ポップアップを許可」や、メール欄へフォーカスが移っただけのことがあります。いったん上のボタンをもう一度押してください。
        </div>
      ) : null}

      <div className="relative text-center text-xs text-stone-400">
        <span className="relative z-10 bg-white px-2">または</span>
        <span className="absolute inset-x-0 top-1/2 z-0 h-px bg-stone-200" aria-hidden />
      </div>

      <form
        className="space-y-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void handleEmailSubmit(new FormData(e.currentTarget), "login");
        }}
      >
        <label className="block text-sm font-medium text-stone-700">
          メールアドレス
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-stone-400 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          パスワード
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              defaultValue=""
              className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-16 text-stone-900 outline-none ring-stone-400 focus:ring-2"
            />
            <button
              type="button"
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "隠す" : "表示"}
            </button>
          </div>
        </label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <button
            type="submit"
            disabled={busyEmail}
            className="rounded-lg bg-stone-800 px-3 py-2.5 font-medium text-white hover:bg-stone-900 disabled:opacity-50"
          >
            ログイン
          </button>
          <button
            type="button"
            disabled={busyEmail}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            onClick={(e) => {
              const form = e.currentTarget.form;
              if (!form) return;
              void handleEmailSubmit(new FormData(form), "register");
            }}
          >
            新規登録（次に生年月日入力）
          </button>
        </div>
        {busyEmail ? (
          <p className="text-center text-sm font-medium text-stone-600">処理中…</p>
        ) : null}
        <p className="text-xs text-stone-500">
          Enterキーで送信した場合は「ログイン」として処理されます。
        </p>
        <button
          type="button"
          disabled={busyReset}
          className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900 disabled:opacity-50"
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (!form) return;
            void handlePasswordReset(new FormData(form));
          }}
        >
          {busyReset ? "再設定メールを送信中…" : "パスワードを忘れた場合（再設定メールを送る）"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600">
        <Link href="/" className="text-stone-800 underline-offset-2 hover:underline">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}
