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

import { syncLjAuthClientCookies, takeOAuthReturnTo } from "@/lib/auth/clientCookies";
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
        /** アプリ全体で先に処理しないと、onAuthStateChanged より後に getRedirectResult が走り結果が消える／クッキー競合が起きる */
        const redirectCred = await getRedirectResult(auth);
        if (cancelled) return;
        if (redirectCred?.user) {
          syncAuthCookies(redirectCred.user);
          await syncAuthCookiesOnServer(redirectCred.user);
          setUser(redirectCred.user);
          setLoading(false);
          const target = takeOAuthReturnTo() ?? "/orders";
          if (target.startsWith("/") && !target.startsWith("//")) {
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
        unsubscribe = onAuthStateChanged(auth, (next) => {
          if (cancelled) return;
          setUser(next);
          syncAuthCookies(next);
          void syncAuthCookiesOnServer(next);
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
