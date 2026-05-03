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
import { getRedirectResult, onAuthStateChanged, signOut, type User } from "firebase/auth";

import {
  OAUTH_RETURN_SESSION_KEY,
  clearOAuthReturnPending,
  readReturnToFromCurrentUrl,
  syncLjAuthClientCookies,
  takeOAuthReturnTo,
} from "@/lib/auth/clientCookies";
import { getFirebaseAuth } from "@/lib/firebase/client";

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

async function syncAuthCookiesOnServer(user: User | null) {
  try {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const run = async () => {
      try {
        const auth = getFirebaseAuth();
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }

        const redirectCred = await getRedirectResult(auth);
        if (cancelled) return;

        if (redirectCred?.user) {
          const signed = redirectCred.user;
          syncAuthCookies(signed);
          await syncAuthCookiesOnServer(signed);
          setUser(signed);
          setLoading(false);
          const target = safePostLoginTarget(
            takeOAuthReturnTo() ?? readReturnToFromCurrentUrl() ?? "/orders",
          );
          if (target.startsWith("/") && !target.startsWith("//")) {
            clearOAuthReturnPending();
            window.location.assign(target);
            return;
          }
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
          setLoading(false);
          try {
            sessionStorage.removeItem(OAUTH_RETURN_SESSION_KEY);
          } catch {
            /* noop */
          }
          const target = safePostLoginTarget(readReturnToFromCurrentUrl() ?? "/orders");
          if (target.startsWith("/") && !target.startsWith("//")) {
            clearOAuthReturnPending();
            window.location.assign(target);
            return;
          }
        }
      } catch (e) {
        console.error("[auth:getRedirectResult]", e);
      }

      if (cancelled) return;

      try {
        const auth = getFirebaseAuth();
        let isFirstAuthCallback = true;
        unsubscribe = onAuthStateChanged(auth, (next) => {
          if (cancelled) return;
          setUser(next);
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
          syncAuthCookies(null);
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
    const auth = getFirebaseAuth();
    await signOut(auth);
    syncAuthCookies(null);
    await syncAuthCookiesOnServer(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signOutUser }),
    [user, loading, signOutUser],
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
