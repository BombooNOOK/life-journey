"use client";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { getLjViewerEmailOnClient, isLjLoggedInOnClient, readLjHadAccountOnClient } from "@/lib/auth/clientCookies";

/**
 * ヘッダー等のクライアント認証表示。
 * LoginClient の shouldLeaveLoginPage と同様、Firebase user または lj_logged_in Cookie でログイン済みとみなす。
 */
export function useClientAuthNavState() {
  const { user, loading } = useFirebaseAuth();
  const cookieLoggedIn = isLjLoggedInOnClient();
  const isLoggedIn = Boolean(user) || cookieLoggedIn;
  const viewerEmail = user?.email ?? getLjViewerEmailOnClient();

  return {
    isLoggedIn,
    viewerEmail,
    /** Firebase 初期化中で、未ログインと確定していない */
    isAuthLoading: loading && !isLoggedIn,
    showGuestNav: !isLoggedIn && !loading,
    /** 過去にアカウントを持ったゲスト向け（初回未登録ではログイン導線を出さない） */
    showGuestLoginNav: !isLoggedIn && !loading && readLjHadAccountOnClient(),
    showAuthenticatedNav: isLoggedIn,
  };
}
