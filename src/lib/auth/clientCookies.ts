const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 日

function secureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

/** ミドルウェア用 `lj_logged_in` / `lj_user_email`（HTTPS では Secure） */
export function syncLjAuthClientCookies(user: { email: string | null } | null): void {
  if (typeof document === "undefined") return;
  const s = secureSuffix();
  if (!user) {
    document.cookie = `lj_logged_in=; Path=/; Max-Age=0; SameSite=Lax${s}`;
    document.cookie = `lj_user_email=; Path=/; Max-Age=0; SameSite=Lax${s}`;
    return;
  }
  document.cookie = `lj_logged_in=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${s}`;
  if (user.email) {
    document.cookie = `lj_user_email=${encodeURIComponent(user.email)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${s}`;
  } else {
    document.cookie = `lj_user_email=; Path=/; Max-Age=0; SameSite=Lax${s}`;
  }
}

export function clearLjAuthCookiesOnClient(): void {
  syncLjAuthClientCookies(null);
}

/** Google `signInWithRedirect` 完了後に戻すパス（同一オリジン・先頭 `/` のみ） */
export const OAUTH_RETURN_SESSION_KEY = "lj_oauth_return_to";

export function stashOAuthReturnTo(returnTo: string): void {
  if (typeof sessionStorage === "undefined") return;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return;
  sessionStorage.setItem(OAUTH_RETURN_SESSION_KEY, returnTo);
}

export function takeOAuthReturnTo(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(OAUTH_RETURN_SESSION_KEY);
  sessionStorage.removeItem(OAUTH_RETURN_SESSION_KEY);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/** OAuth 後に `sessionStorage` が消えても、URL の `returnTo` で戻れるようにする */
export function readReturnToFromCurrentUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = new URL(window.location.href).searchParams.get("returnTo");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    if (raw === "/login" || raw.startsWith("/login?")) return null;
    return raw;
  } catch {
    return null;
  }
}
