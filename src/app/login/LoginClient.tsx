"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  type UserCredential,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import {
  AlreadyLoggedInPanel,
  RegistrationCompletePanel,
} from "@/components/auth/AuthSessionPanels";
import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { getPasswordResetSentNotice } from "@/lib/auth/passwordResetCopy";
import { sendLjPasswordResetEmail } from "@/lib/auth/sendPasswordResetEmailSafe";
import {
  clearGoogleOAuthRedirectFlow,
  isGoogleOAuthFlowCookieActive,
  markGoogleOAuthRedirectFlow,
  readOAuthReturnPendingAgeMs,
  stashOAuthReturnTo,
  syncLjAuthClientCookies,
  isLjLoggedInOnClient,
} from "@/lib/auth/clientCookies";
import {
  detectInAppBrowserLabel,
  inAppBrowserGoogleLoginWarning,
} from "@/lib/auth/inAppBrowser";
import { getFirebaseAuth, waitForFirebaseAuthPersistence } from "@/lib/firebase/client";
import {
  LOG_HOUSE_GO_LABEL,
  LOG_HOUSE_MOVING_LABEL,
  LOG_HOUSE_SHORT_LABEL,
} from "@/lib/journal/logHouseLabels";

import { buildLoginHref, isFirstVisitLoghouseReturnTo, resolveLoginFlow, resolveSafeReturnTo } from "./loginFlow";
import type { LoginFlowIntent } from "./loginFlow";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_BUTTON,
  FIRST_VISIT_RESIDENT_REGISTRATION_NOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_QUOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_SUPPLEMENT,
  FIRST_VISIT_RESIDENT_REGISTRATION_TITLE,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";

const OAUTH_LOGIN_FAILURE_TIMEOUT_MS = 30_000;

const LOGIN_BROWSER_HELP = (
  <p className="mt-1.5">
    スマホで安心して使うには、Safari または Chrome で URL を直接開いてください（LINE
    等のアプリ内ブラウザは不安定なことがあります）。iPhone ではまずポップアップで Google
    が開き、うまくいかないときだけ Google へ移動する方式になります。Mac の Chrome
    でも小さなウィンドウ（ポップアップ）で Google が開きます。ポップアップをブロックしている場合は許可してください。
  </p>
);

/**
 * Mac／Windows のデスクトップ Chrome（Chromium 系）。ポップアップ後の `router.push` で
 * セッション Cookie が間に合わないときがあるため `browserWantsFullPagePostLoginNavigation` に使う。
 */
function isLikelyChromiumDesktop(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|webOS|Mobile/i.test(ua)) return false;
  if (!/Chrome/i.test(ua)) return false;
  if (/(Edg|OPR|Opera|Firefox|FxiOS)/i.test(ua)) return false;
  return true;
}

/**
 * Safari 系・モバイル・デスクトップ Chrome: `fetch(/api/auth/session)` 直後の `router.push` だと
 * Set-Cookie が次の RSC に乗らずミドルウェアで `/login` に戻されることがある → フルページ遷移にする。
 *
 * Chrome M115+ で Vercel 等にホストしている場合、`signInWithRedirect` はサードパーティストレージ制限で
 * getRedirectResult が常に空になる（Firebase 公式の redirect best practices）。Chrome デスクトップは
 * ポップアップ方式に戻す前提。
 */
function browserWantsFullPagePostLoginNavigation(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIosLike =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIosLike || /Android/i.test(ua)) return true;
  if (isLikelyChromiumDesktop()) return true;
  // デスクトップ Safari（Chrome / Edge / Opera / Firefox は除外）
  if (!/Safari/i.test(ua)) return false;
  if (/(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS)/i.test(ua)) return false;
  return true;
}

/** Google リダイレクトで `/login` に着地した直後（クッキー／保留フラグで検知） */
function readLoginOAuthReturnLikely(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname !== "/login") return false;
  return isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null;
}

function PostLoginTransitionOverlay({
  variant = "oauth-return",
}: {
  variant?: "oauth-return" | "already-signed-in";
}) {
  const isAlreadySignedIn = variant === "already-signed-in";
  return (
    <div
      className={
        isAlreadySignedIn
          ? "mx-auto max-w-md space-y-3 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm"
          : "fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/35 px-4 backdrop-blur-[2px]"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={
          isAlreadySignedIn
            ? undefined
            : "mx-auto max-w-md space-y-3 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-lg"
        }
      >
        <p className="text-base font-semibold text-stone-900">{LOG_HOUSE_MOVING_LABEL}</p>
        {isAlreadySignedIn ? (
          <p className="text-sm leading-relaxed text-stone-600">ログイン済みのため、自動で次の画面へ進みます。</p>
        ) : (
          <p className="text-sm leading-relaxed text-stone-600">
            Google でのサインインから戻ってきたあと、一度この画面を経由します。ログインが取り込め次第、自動で次の画面へ進みます。このまま少しお待ちください。
          </p>
        )}
        <p className="text-xs text-stone-500" aria-hidden>
          移動中
        </p>
      </div>
    </div>
  );
}

function pickErrorMessage(e: unknown, fallback: string): string {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : fallback;

  if (raw.includes("auth/email-already-in-use")) {
    return "このメールアドレスはすでに登録されています。下の「すでにアカウントをお持ちの方はログイン」から入ってください。";
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

export function LoginClient({
  returnToRaw,
  flowIntent = null,
}: {
  returnToRaw: string | null;
  flowIntent?: LoginFlowIntent | null;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyReset, setBusyReset] = useState(false);
  const [showResetFeedback, setShowResetFeedback] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState<{
    welcomeEmailSent: boolean;
  } | null>(null);
  /** iOS/Android の Google ポップアップ成功後にフルページ遷移する直前だけ表示 */
  const [fullPagePostLoginPending, setFullPagePostLoginPending] = useState(false);
  /** Google リダイレクトで `/login` に戻った最初から全画面案内（`dynamic` の ssr:false とセット） */
  const [oauthReturnHandoffUi, setOauthReturnHandoffUi] = useState(() => readLoginOAuthReturnLikely());
  /** Google から戻った直後に再描画してバナーを出す（Safari は pageshow が必要なことがある） */
  const [oauthReturnSurface, setOauthReturnSurface] = useState(0);
  const inAppBrowserLabel =
    typeof navigator === "undefined" ? null : detectInAppBrowserLabel();
  const inAppBrowserWarning = inAppBrowserGoogleLoginWarning(inAppBrowserLabel);
  /** 連打で途中状態が重なり「3回押すと入る」になるのを防ぐ */
  const googleSignInLock = useRef(false);
  const oauthReturnNavLock = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resetSectionRef = useRef<HTMLDivElement>(null);

  const returnTo = resolveSafeReturnTo(returnToRaw);
  const loginFlow = resolveLoginFlow(returnTo, flowIntent);
  const isRegisterFlow = loginFlow === "register";
  const isFirstVisitRegisterFlow =
    isRegisterFlow && isFirstVisitLoghouseReturnTo(returnTo);
  const postRegisterDestination = isFirstVisitLoghouseReturnTo(returnTo) ? returnTo : "/orders";
  const cookieLoggedIn = isLjLoggedInOnClient();
  const isAlreadySignedIn = (Boolean(user) || cookieLoggedIn) && !oauthReturnHandoffUi;

  const showGoogleReturnBanner =
    !authLoading &&
    !user &&
    (isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null);

  useLayoutEffect(() => {
    const bump = () => {
      setOauthReturnSurface((n) => n + 1);
      if (readLoginOAuthReturnLikely()) {
        setOauthReturnHandoffUi(true);
      }
    };
    bump();
    window.addEventListener("pageshow", bump);
    return () => window.removeEventListener("pageshow", bump);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setOauthReturnHandoffUi(false);
      return;
    }
    if (isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null) return;
    setOauthReturnHandoffUi(false);
  }, [authLoading, user]);

  const navigateAfterLogin = useCallback(
    (target: string) => {
      router.push(target);
      router.refresh();
    },
    [router],
  );

  const finalizeGoogleLoginAndGo = useCallback(
    async (input: { email: string | null; isNewGoogleUser?: boolean; showTransition?: boolean }) => {
      if (oauthReturnNavLock.current) return;
      oauthReturnNavLock.current = true;
      const hardNav = browserWantsFullPagePostLoginNavigation();
      if (input.showTransition && hardNav) {
        flushSync(() => setFullPagePostLoginPending(true));
      }
      clearGoogleOAuthRedirectFlow();
      setOauthReturnHandoffUi(false);
      syncLjAuthClientCookies({ email: input.email });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input.email ?? "" }),
        credentials: "same-origin",
      }).catch(() => {});
      if (input.isNewGoogleUser && isFirstVisitLoghouseReturnTo(returnTo)) {
        setFirstVisitFromRegisterFlag();
      }
      if (hardNav) {
        await new Promise((r) => setTimeout(r, 400));
        window.location.assign(new URL(returnTo, window.location.origin).toString());
        return;
      }
      navigateAfterLogin(returnTo);
    },
    [navigateAfterLogin, returnTo],
  );

  /** Google リダイレクト戻り：React の user 反映が遅れても currentUser が立っていれば進める */
  const tryFinishPendingOAuthReturn = useCallback(async () => {
    const oauthPending =
      oauthReturnHandoffUi ||
      isGoogleOAuthFlowCookieActive() ||
      readOAuthReturnPendingAgeMs() != null;
    if (!oauthPending || authLoading || oauthReturnNavLock.current) return;

    let auth: ReturnType<typeof getFirebaseAuth>;
    try {
      auth = getFirebaseAuth({ deferPersistence: true });
    } catch {
      return;
    }
    await waitForFirebaseAuthPersistence(auth);
    if (typeof auth.authStateReady === "function") {
      await auth.authStateReady();
    }
    const signed = user ?? auth.currentUser;
    if (!signed?.email?.trim()) return;

    await finalizeGoogleLoginAndGo({
      email: signed.email,
      showTransition: true,
    });
  }, [authLoading, finalizeGoogleLoginAndGo, oauthReturnHandoffUi, user]);

  useEffect(() => {
    void tryFinishPendingOAuthReturn();
  }, [tryFinishPendingOAuthReturn, oauthReturnSurface]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      clearGoogleOAuthRedirectFlow();
      return;
    }
    const pendingAge = readOAuthReturnPendingAgeMs();
    if (pendingAge == null && !isGoogleOAuthFlowCookieActive()) return;

    const id = window.setTimeout(() => {
      void (async () => {
        try {
          await tryFinishPendingOAuthReturn();
          if (oauthReturnNavLock.current) return;

          const auth = getFirebaseAuth();
          if (auth.currentUser?.email?.trim()) return;
          if (readOAuthReturnPendingAgeMs() == null && !isGoogleOAuthFlowCookieActive()) return;
          clearGoogleOAuthRedirectFlow();
          setOauthReturnHandoffUi(false);
          setError(
            [
              "Googleから戻りましたが、この端末でログイン状態を取り込めませんでした（Firebase がエラーを出さないことがあります）。",
              "",
              "試すこと：",
              "1）LINE・Instagram などの「アプリ内ブラウザ」ではなく、Safari または Chrome で URL を直接開き直す",
              "2）プライベート／シークレットをやめ、通常タブで開く",
              "3）ホーム画面に追加したショートカットから開いている場合は、一度 Safari で同じ URL を開き直す",
              "4）設定 → Safari → 詳細 → 「サイト越えトラッキング防止」をオフ（効果がない場合もあります）",
              "5）メールとパスワードでログイン（登録済みの場合）",
              "6）Mac の Chrome では、シークレットウィンドウをやめて通常ウィンドウで試す",
            ].join("\n"),
          );
        } catch {
          /* noop */
        }
      })();
    }, OAUTH_LOGIN_FAILURE_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [authLoading, user, oauthReturnSurface, tryFinishPendingOAuthReturn]);

  const auth = () => {
    try {
      return getFirebaseAuth();
    } catch (e) {
      setError(pickErrorMessage(e, "初期化に失敗しました。"));
      return null;
    }
  };

  const handleGoogle = async () => {
    if (googleSignInLock.current) return;
    if (inAppBrowserWarning) {
      setError(inAppBrowserWarning);
      return;
    }
    googleSignInLock.current = true;
    setBusyGoogle(true);
    try {
      setError(null);
      setNotice(null);
      let a: ReturnType<typeof getFirebaseAuth>;
      try {
        a = getFirebaseAuth({ deferPersistence: true });
      } catch (e) {
        setError(pickErrorMessage(e, "初期化に失敗しました。"));
        return;
      }
      const isIOS =
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(navigator.userAgent);
      await waitForFirebaseAuthPersistence(a);
      if (typeof a.authStateReady === "function") {
        await a.authStateReady();
      }
      const completeGoogleSignIn = async (cred: UserCredential) => {
        await finalizeGoogleLoginAndGo({
          email: cred.user.email ?? null,
          isNewGoogleUser: getAdditionalUserInfo(cred)?.isNewUser === true,
          showTransition: true,
        });
      };
      try {
      const provider = new GoogleAuthProvider();
      /** 複数 Google アカウントがあるときに選べるようにする（デスクトップのポップアップ） */
      if (!isIOS && !isAndroid) {
        provider.setCustomParameters({ prompt: "select_account" });
      }

      /**
       * iOS / Android はまずポップアップ（リダイレクトだけだと Safari や WebView で状態が取り込めないことがある）。
       * ポップアップ失敗後にリダイレクトに落ちる。
       */
      if (isIOS || isAndroid) {
        const popupProvider = new GoogleAuthProvider();
        popupProvider.setCustomParameters({ prompt: "select_account" });
        try {
          const cred = await signInWithPopup(a, popupProvider);
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
            const redirectProvider = new GoogleAuthProvider();
            redirectProvider.setCustomParameters({ prompt: "select_account" });
            await signInWithRedirect(a, redirectProvider);
            return;
          }
          throw e;
        }
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
    setShowResetFeedback(false);
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
        syncLjAuthClientCookies({ email: cred.user.email ?? null });
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cred.user.email ?? "" }),
          credentials: "same-origin",
        }).catch(() => {});
        let welcomeEmailSent = false;
        try {
          const welcomeRes = await fetch("/api/auth/welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cred.user.email ?? email }),
            credentials: "same-origin",
          });
          if (welcomeRes.ok) {
            const welcomeData = (await welcomeRes.json()) as { sent?: boolean };
            welcomeEmailSent = welcomeData.sent === true;
          }
        } catch {
          /* 登録完了画面はメール送信成否に関わらず表示 */
        }
        setRegistrationComplete({ welcomeEmailSent });
        return;
      }
      cred = await signInWithEmailAndPassword(a, email, password);
      syncLjAuthClientCookies({ email: cred.user.email ?? null });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cred.user.email ?? "" }),
        credentials: "same-origin",
      }).catch(() => {});
      if (browserWantsFullPagePostLoginNavigation()) {
        window.location.assign(new URL(returnTo, window.location.origin).toString());
      } else {
        navigateAfterLogin(returnTo);
      }
    } catch (e) {
      console.error("[login:email]", e);
      setError(pickErrorMessage(e, "メールでの認証に失敗しました。"));
    } finally {
      setBusyEmail(false);
    }
  };

  function readLoginEmailFromForm(): string {
    const input = emailInputRef.current;
    const form = input?.form;
    if (form) {
      return String(new FormData(form).get("email") ?? "").trim();
    }
    return (input?.value ?? "").trim();
  }

  const handlePasswordReset = async () => {
    setError(null);
    setNotice(null);
    setShowResetFeedback(true);
    const email = readLoginEmailFromForm();
    if (!email) {
      setError("先にメールアドレスを入力してください。");
      emailInputRef.current?.focus();
      requestAnimationFrame(() => {
        resetSectionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    const a = auth();
    if (!a) {
      setError("ログイン機能の準備ができていません。ページを再読み込みしてからお試しください。");
      return;
    }
    setBusyReset(true);
    try {
      await sendLjPasswordResetEmail(a, email);
      setNotice(getPasswordResetSentNotice());
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
        setNotice(getPasswordResetSentNotice());
      } else {
        setError(pickErrorMessage(e, "パスワード再設定メールの送信に失敗しました。"));
      }
    } finally {
      setBusyReset(false);
      requestAnimationFrame(() => {
        resetSectionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  };

  const showFullTransitionOverlay =
    fullPagePostLoginPending || oauthReturnHandoffUi || (authLoading && Boolean(user));

  if (showFullTransitionOverlay) {
    return <PostLoginTransitionOverlay variant="oauth-return" />;
  }

  if (registrationComplete) {
    return (
      <RegistrationCompletePanel
        welcomeEmailSent={registrationComplete.welcomeEmailSent}
        variant={isFirstVisitLoghouseReturnTo(returnTo) ? "firstVisitResident" : "default"}
        onGoMyPage={() => {
          if (isFirstVisitLoghouseReturnTo(returnTo)) {
            setFirstVisitFromRegisterFlag();
          }
          if (browserWantsFullPagePostLoginNavigation()) {
            window.location.assign(postRegisterDestination);
          } else {
            router.push(postRegisterDestination);
            router.refresh();
          }
        }}
      />
    );
  }

  if (isAlreadySignedIn) {
    return <AlreadyLoggedInPanel />;
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-medium text-stone-900">Googleの認証を確認しています…</p>
        <p className="text-sm text-stone-600">
          アカウントを選んだあと、まずこの画面のまま少しお待ちください。すぐに{LOG_HOUSE_GO_LABEL}。
        </p>
        <p className="text-xs text-stone-500" aria-hidden>
          読み込み中
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <div className="flex items-center gap-2">
          <h1 className={mobileReadable.pageTitle}>
            {isFirstVisitRegisterFlow
              ? FIRST_VISIT_RESIDENT_REGISTRATION_TITLE
              : isRegisterFlow
                ? "アカウント作成"
                : "ログイン"}
          </h1>
          <InlineHelpButton
            ariaLabel={
              isFirstVisitRegisterFlow
                ? "森の住民登録の説明"
                : isRegisterFlow
                  ? "アカウント作成の説明"
                  : "ログインの説明"
            }
          >
            {isFirstVisitRegisterFlow ? (
              <>
                <p>ログハウスを建てる前に、森の住民登録（アカウント作成）を行います。</p>
                <p className="mt-1.5">登録後はログハウス建築の案内へ進みます。</p>
                {LOGIN_BROWSER_HELP}
              </>
            ) : isRegisterFlow ? (
              <>
                <p>ログイン後は、無料鑑定の入力画面へ進みます。</p>
                {LOGIN_BROWSER_HELP}
              </>
            ) : (
              <>
                <p>ログイン後は、{LOG_HOUSE_SHORT_LABEL}（またはアクセスしようとしていたページ）へ移動します。</p>
                {LOGIN_BROWSER_HELP}
              </>
            )}
          </InlineHelpButton>
        </div>
        <p className={`mt-2 whitespace-pre-line ${mobileReadable.bodyMuted}`}>
          {isFirstVisitRegisterFlow
            ? `${FIRST_VISIT_RESIDENT_REGISTRATION_OWL_QUOTE}\n\n${FIRST_VISIT_RESIDENT_REGISTRATION_SUPPLEMENT}`
            : isRegisterFlow
              ? "無料鑑定へ進むために、アカウントを作成します。作成後はお名前と生年月日の入力画面へ進みます。"
              : "登録済みの方は、メールアドレスとパスワードでログインしてください。"}
        </p>
        {isFirstVisitRegisterFlow ? (
          <p className={`mt-2 ${mobileReadable.helperMuted}`}>
            {FIRST_VISIT_RESIDENT_REGISTRATION_NOTE}
          </p>
        ) : null}
      </div>

      {inAppBrowserWarning ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-base leading-[1.6] text-amber-950"
          role="alert"
        >
          <p className="font-semibold">Google ログインの前に</p>
          <p className="mt-2">{inAppBrowserWarning}</p>
          <p className="mt-2 text-sm">
            下のメールアドレスとパスワードでの登録・ログインは、このままお試しいただけます。
          </p>
        </div>
      ) : null}

      {showGoogleReturnBanner ? (
        <div
          key={oauthReturnSurface}
          className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-3 text-base leading-[1.6] text-violet-950"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">Google の認証から戻ってきました</p>
          <p className="mt-2">
            このあと自動で進まない場合、しばらくすると下に案内が出ることがあります。LINE
            などのアプリ内ブラウザのときは、Safari で同じ URL を開き直してからもう一度お試しください。
          </p>
        </div>
      ) : null}

      {(error || notice) ? (
        <div ref={feedbackRef} className="space-y-2">
          {error ? (
            <>
              <div className={mobileReadable.error}>{error}</div>
              <button
                type="button"
                className={`${mobileReadable.link} font-medium`}
                onClick={() => {
                  setError(null);
                  setOauthReturnHandoffUi(false);
                  clearGoogleOAuthRedirectFlow();
                }}
              >
                メッセージを閉じる
              </button>
            </>
          ) : null}
          {notice ? (
            <div className={mobileReadable.notice} role="status" aria-live="polite">
              {notice}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        disabled={busyGoogle}
        onClick={() => void handleGoogle()}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 ${mobileReadable.buttonSecondary}`}
      >
        {busyGoogle ? "処理中…" : "Google で続ける"}
      </button>

      {busyGoogle ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-base font-medium leading-[1.6] text-amber-950"
          role="status"
          aria-live="polite"
        >
          Google に接続しています。この表示がすぐ消える場合は、画面下の「ポップアップを許可」や、メール欄へフォーカスが移っただけのことがあります。いったん上のボタンをもう一度押してください。
        </div>
      ) : null}

      <div className="relative text-center text-sm text-stone-400">
        <span className="relative z-10 bg-white px-2">または</span>
        <span className="absolute inset-x-0 top-1/2 z-0 h-px bg-stone-200" aria-hidden />
      </div>

      <form
        className="space-y-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void handleEmailSubmit(new FormData(e.currentTarget), isRegisterFlow ? "register" : "login");
        }}
      >
        <label className={`block ${mobileReadable.label}`}>
          メールアドレス
          <input
            ref={emailInputRef}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue=""
            className={mobileReadable.input}
          />
        </label>
        <p className={mobileReadable.helper}>
          メールアドレスはログインと大切なお知らせのために使用します。
          <br />
          販促目的のメール配信には使用しません。
        </p>
        <label className={`block ${mobileReadable.label}`}>
          パスワード
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegisterFlow ? "new-password" : "current-password"}
              defaultValue=""
              className={`${mobileReadable.input} pr-16`}
            />
            <button
              type="button"
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              className="absolute right-2 top-1/2 min-h-[44px] -translate-y-1/2 rounded px-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "隠す" : "表示"}
            </button>
          </div>
        </label>
        {isRegisterFlow ? (
          <button
            type="submit"
            disabled={busyEmail}
            className={mobileReadable.buttonPrimary}
          >
            {isFirstVisitRegisterFlow
              ? FIRST_VISIT_RESIDENT_REGISTRATION_BUTTON
              : "新規登録（次に生年月日入力）"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={busyEmail}
            className={mobileReadable.buttonPrimary}
          >
            ログイン
          </button>
        )}
        {busyEmail ? (
          <p className={`text-center font-medium ${mobileReadable.bodyMuted}`}>処理中…</p>
        ) : null}
        <p className={mobileReadable.helperMuted}>
          Enterキーで送信した場合は「
          {isFirstVisitRegisterFlow ? "住民登録" : isRegisterFlow ? "新規登録" : "ログイン"}
          」として処理されます。
        </p>
        <p className={`text-center ${mobileReadable.helper}`}>
          {isRegisterFlow ? (
            <>
              <Link
                href={
                  isFirstVisitRegisterFlow
                    ? buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login")
                    : buildLoginHref("/orders")
                }
                className={mobileReadable.link}
              >
                すでにアカウントをお持ちの方はログイン
              </Link>
              <span className="mx-2 text-stone-300" aria-hidden>
                |
              </span>
              <Link href={buildLoginHref("/orders")} className={mobileReadable.link}>
                パスワードを忘れた方
              </Link>
            </>
          ) : (
            <Link
              href={buildLoginHref("/order")}
              className={mobileReadable.link}
            >
              はじめての方はこちら
            </Link>
          )}
        </p>
      </form>

      <div ref={resetSectionRef} className="space-y-2 border-t border-stone-100 pt-4">
        {showResetFeedback && error ? (
          <div className={mobileReadable.error} role="alert">
            {error}
          </div>
        ) : null}
        {showResetFeedback && notice ? (
          <div className={mobileReadable.notice} role="status" aria-live="polite">
            {notice}
          </div>
        ) : null}
        <button
          type="button"
          disabled={busyReset || busyEmail}
          className={mobileReadable.buttonSecondary}
          onClick={() => void handlePasswordReset()}
        >
          {busyReset ? "再設定メールを送信中…" : "パスワード再設定メールを送る"}
        </button>
        <p className={mobileReadable.helperMuted}>
          上のメールアドレス宛に、パスワード再設定用のリンクを送ります。
        </p>
      </div>

      <p className={`text-center ${mobileReadable.bodyMuted}`}>
        <Link href="/" className={mobileReadable.link}>
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}
