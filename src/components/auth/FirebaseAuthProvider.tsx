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
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase/client";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(
  null,
);

function setLoginFlagCookie(isLoggedIn: boolean) {
  if (typeof document === "undefined") return;
  if (isLoggedIn) {
    document.cookie = "lj_logged_in=1; Path=/; Max-Age=2592000; SameSite=Lax";
    return;
  }
  document.cookie = "lj_logged_in=; Path=/; Max-Age=0; SameSite=Lax";
}

function setViewerEmailCookie(email: string | null) {
  if (typeof document === "undefined") return;
  if (email) {
    const value = encodeURIComponent(email);
    document.cookie = `lj_user_email=${value}; Path=/; Max-Age=2592000; SameSite=Lax`;
    return;
  }
  document.cookie = "lj_user_email=; Path=/; Max-Age=0; SameSite=Lax";
}

function syncAuthCookies(user: User | null) {
  setLoginFlagCookie(Boolean(user));
  setViewerEmailCookie(user?.email ?? null);
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

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (next) => {
        if (!cancelled) {
          setUser(next);
          syncAuthCookies(next);
          void syncAuthCookiesOnServer(next);
          setLoading(false);
        }
      });
    } catch {
      if (!cancelled) {
        setUser(null);
        syncAuthCookies(null);
        setLoading(false);
      }
    }

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
