"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { stashOAuthReturnTo, syncLjAuthClientCookies } from "@/lib/auth/clientCookies";
import { getFirebaseAuth } from "@/lib/firebase/client";

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
    raw.includes("auth/invalid-login-credentials") ||
    raw.includes("auth/invalid-credential") ||
    raw.includes("auth/wrong-password") ||
    raw.includes("auth/user-not-found")
  ) {
    return "メールアドレスかパスワードが違います。入力内容をもう一度確認してください。";
  }

  return raw;
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyReset, setBusyReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = resolveSafeReturnTo(searchParams.get("returnTo"));

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
    setError(null);
    setNotice(null);
    const a = auth();
    if (!a) return;
    setBusyGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        stashOAuthReturnTo(returnTo);
        await signInWithRedirect(a, provider);
        return;
      }
      const cred = await signInWithPopup(a, provider);
      syncLjAuthClientCookies({ email: cred.user.email ?? null });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cred.user.email ?? "" }),
        credentials: "same-origin",
      }).catch(() => {});
      navigateAfterLogin(returnTo);
    } catch (e) {
      console.error("[login:google]", e);
      setError(pickErrorMessage(e, "Google ログインに失敗しました。"));
    } finally {
      setBusyGoogle(false);
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
          スマホで安定して使うには、URLをSafariで直接開いてください（アプリ内ブラウザは不安定な場合があります）。
        </p>
      </div>

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
