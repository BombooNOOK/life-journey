"use client";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

/**
 * ヘッダー等のクライアント認証表示。
 * LoginClient の shouldLeaveLoginPage と同様、Firebase user または lj_logged_in Cookie でログイン済みとみなす。
 */
export function useClientAuthNavState() {
  const { user, loading } = useFirebaseAuth();
  const cookieLoggedIn = isLjLoggedInOnClient();
  const isLoggedIn = Boolean(user) || cookieLoggedIn;

  return {
    isLoggedIn,
    /** Firebase 初期化中で、未ログインと確定していない */
    isAuthLoading: loading && !isLoggedIn,
    showGuestNav: !isLoggedIn && !loading,
    showAuthenticatedNav: isLoggedIn,
  };
}
