"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type Auth, type User } from "firebase/auth";

import {
  clearGoogleOAuthRedirectFlow,
  readReturnToFromCurrentUrl,
  readOAuthReturnPendingAgeMs,
  isGoogleOAuthFlowCookieActive,
  syncLjAuthClientCookies,
  takeOAuthReturnTo,
} from "@/lib/auth/clientCookies";
import { getFirebaseAuth, waitForFirebaseAuthPersistence } from "@/lib/firebase/client";
import { consumeRedirectResultOnce } from "@/lib/firebase/redirectResult";
import {
  clearLocalE2eClientSession,
  getLocalE2eClientSession,
  restoreLocalE2eClientSessionCookies,
  subscribeLocalE2eClientSession,
} from "@/lib/localE2eHarness/clientSession";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(
  null,
);

function syncAuthCookies(user: User | null) {
  syncLjAuthClientCookies(user ? { email: user.email } : null);
}

function safePostLoginTarget(t: string): string {
  if (t === "/login" || t.startsWith("/login?")) return "/orders";
  return t;
}

/** サーバー Cookie 反映と描画の安定用。短すぎると「Googleで続ける」が一瞬戻って見えることがある */
const OAUTH_SETTLE_BEFORE_NAV_MS = 600;
/** OAuth 戻り後に currentUser の反映を待つ上限（LoginClient の失敗表示より短くする） */
const OAUTH_CURRENT_USER_WAIT_MS = 20000;

async function syncAuthCookiesOnServer(user: User | null) {
  try {
    // Local E2E bridge owns the cookie actor while active.
    if (!user?.email && getLocalE2eClientSession()) return;
    if (!user?.email) {
      await fetch("/api/auth/session", { method: "DELETE" });
      return;
    }
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
      credentials: "same-origin",
    });
  } catch {
    // サーバー同期に失敗してもクライアント側Cookieは残す
  }
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [localE2eEmail, setLocalE2eEmail] = useState<string | null>(
    () => getLocalE2eClientSession()?.email ?? null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeLocalE2eClientSession((session) => {
      setLocalE2eEmail(session?.email ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const run = async () => {
      // Restore fixed local-E2E actor before Firebase null can clear cookies
      // on full-page navigations (Companion save → calendar).
      if (getLocalE2eClientSession()) {
        await restoreLocalE2eClientSessionCookies();
        if (cancelled) return;
      }

      let auth: Auth | null = null;
      try {
        auth = getFirebaseAuth({ deferPersistence: true });
        let redirectCred: Awaited<ReturnType<typeof consumeRedirectResultOnce>> = null;
        try {
          /**
           * Chrome 等で IndexedDB へのリダイレクト結果の反映が数ティック遅れると getRedirectResult が空になることがある。
           * 戻り検知時のみ短く待ってから取り込む（同一 Auth インスタンスのまま）。
           */
          if (
            typeof window !== "undefined" &&
            window.location.pathname === "/login" &&
            (isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null)
          ) {
            await new Promise((r) => setTimeout(r, 350));
          }
          if (typeof auth.authStateReady === "function") {
            await auth.authStateReady();
          }
          redirectCred = await consumeRedirectResultOnce(auth);
        } finally {
          await waitForFirebaseAuthPersistence(auth);
        }
        if (cancelled) return;
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }

        if (redirectCred?.user) {
          const signed = redirectCred.user;
          syncAuthCookies(signed);
          await syncAuthCookiesOnServer(signed);
          setUser(signed);
          const target = safePostLoginTarget(
            takeOAuthReturnTo() ?? readReturnToFromCurrentUrl() ?? "/orders",
          );
          if (target.startsWith("/") && !target.startsWith("//")) {
            clearGoogleOAuthRedirectFlow();
            await new Promise((r) => setTimeout(r, OAUTH_SETTLE_BEFORE_NAV_MS));
            window.location.assign(target);
            return;
          }
          setLoading(false);
          return;
        }

        /**
         * Google から戻ったのに getRedirectResult が空になる環境（iOS の WKWebView 等）や、
         * sessionStorage が消えた場合でも currentUser が立っていればログイン済みとして進める。
         */
        if (
          typeof window !== "undefined" &&
          window.location.pathname === "/login" &&
          auth.currentUser
        ) {
          const signed = auth.currentUser;
          syncAuthCookies(signed);
          await syncAuthCookiesOnServer(signed);
          setUser(signed);
          const target = safePostLoginTarget(
            takeOAuthReturnTo() ?? readReturnToFromCurrentUrl() ?? "/orders",
          );
          if (target.startsWith("/") && !target.startsWith("//")) {
            clearGoogleOAuthRedirectFlow();
            await new Promise((r) => setTimeout(r, OAUTH_SETTLE_BEFORE_NAV_MS));
            window.location.assign(target);
            return;
          }
          setLoading(false);
          return;
        }

        /** OAuth 戻り直後は currentUser の反映が数フレーム遅れることがある。loading を維持して待つ */
        if (
          typeof window !== "undefined" &&
          window.location.pathname === "/login" &&
          !redirectCred?.user &&
          !auth.currentUser &&
          (isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null)
        ) {
          const deadline = Date.now() + OAUTH_CURRENT_USER_WAIT_MS;
          while (Date.now() < deadline && !cancelled) {
            await auth.authStateReady();
            if (auth.currentUser) {
              const signed = auth.currentUser;
              syncAuthCookies(signed);
              await syncAuthCookiesOnServer(signed);
              setUser(signed);
              const target = safePostLoginTarget(
                takeOAuthReturnTo() ?? readReturnToFromCurrentUrl() ?? "/orders",
              );
              if (target.startsWith("/") && !target.startsWith("//")) {
                clearGoogleOAuthRedirectFlow();
                await new Promise((r) => setTimeout(r, OAUTH_SETTLE_BEFORE_NAV_MS));
                window.location.assign(target);
                return;
              }
              setLoading(false);
              break;
            }
            await new Promise((r) => setTimeout(r, 120));
          }
        }
      } catch {
        /* consumeRedirectResultOnce 側でログ済み */
      }

      if (cancelled) return;

      try {
        if (!auth) {
          auth = getFirebaseAuth();
        }
        let isFirstAuthCallback = true;
        unsubscribe = onAuthStateChanged(auth, (next) => {
          if (cancelled) return;
          setUser(next);
          // Local E2E bridge owns cookies/session while active; do not let
          // Firebase null state clear the fixed harness actor.
          if (getLocalE2eClientSession()) {
            setLoading(false);
            return;
          }
          if (isFirstAuthCallback) {
            isFirstAuthCallback = false;
            if (next) {
              syncAuthCookies(next);
              void syncAuthCookiesOnServer(next);
            }
          } else {
            syncAuthCookies(next);
            void syncAuthCookiesOnServer(next);
          }
          setLoading(false);
        });
      } catch {
        if (!cancelled) {
          setUser(null);
          if (!getLocalE2eClientSession()) {
            syncAuthCookies(null);
          }
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOutUser = useCallback(async () => {
    if (getLocalE2eClientSession()) {
      await clearLocalE2eClientSession();
      syncAuthCookies(null);
      setLocalE2eEmail(null);
      return;
    }
    const auth = getFirebaseAuth();
    await signOut(auth);
    syncAuthCookies(null);
    await syncAuthCookiesOnServer(null);
  }, []);

  const effectiveUser = useMemo((): User | null => {
    if (!localE2eEmail) return user;
    // Minimal viewer stub for Journal UI. Not a Firebase credential.
    return {
      email: localE2eEmail,
      uid: `local-e2e:${localE2eEmail}`,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      displayName: null,
      phoneNumber: null,
      photoURL: null,
      providerId: "local-e2e",
      delete: async () => {
        throw new Error("local_e2e_user_immutable");
      },
      getIdToken: async () => {
        throw new Error("local_e2e_no_id_token");
      },
      getIdTokenResult: async () => {
        throw new Error("local_e2e_no_id_token");
      },
      reload: async () => undefined,
      toJSON: () => ({ email: localE2eEmail, uid: `local-e2e:${localE2eEmail}` }),
    } as User;
  }, [localE2eEmail, user]);

  const value = useMemo(
    () => ({
      user: effectiveUser,
      loading: localE2eEmail ? false : loading,
      signOutUser,
    }),
    [effectiveUser, loading, localE2eEmail, signOutUser],
  );

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth は FirebaseAuthProvider 内で使ってください。");
  }
  return ctx;
}
