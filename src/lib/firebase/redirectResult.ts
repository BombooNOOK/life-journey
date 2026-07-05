import { getRedirectResult, type Auth, type UserCredential } from "firebase/auth";

/**
 * `getRedirectResult` は同一ページロードで1回しか結果を返せない。
 * React Strict Mode の二重マウントや Provider の再実行で空振りすると、
 * Google から戻ってもログイン状態が取り込めない。
 */
let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function consumeRedirectResultOnce(auth: Auth): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((e) => {
      console.error("[auth:getRedirectResult]", e);
      return null;
    });
  }
  return redirectResultPromise;
}

/** テスト・再試行用 */
export function resetRedirectResultForTests(): void {
  redirectResultPromise = null;
}
