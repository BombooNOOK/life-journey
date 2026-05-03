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

/** `signInWithRedirect` 開始時にセットし、戻ってきて未ログインなら案内する（Safari 向け） */
export const OAUTH_RETURN_PENDING_LS_KEY = "lj_oauth_return_pending_ts";
const OAUTH_PENDING_MAX_MS = 5 * 60 * 1000;

export function markOAuthReturnPending(): void {
  try {
    localStorage.setItem(OAUTH_RETURN_PENDING_LS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

export function clearOAuthReturnPending(): void {
  try {
    localStorage.removeItem(OAUTH_RETURN_PENDING_LS_KEY);
  } catch {
    /* noop */
  }
}

export function readOAuthReturnPendingAgeMs(): number | null {
  try {
    const raw = localStorage.getItem(OAUTH_RETURN_PENDING_LS_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return null;
    const age = Date.now() - ts;
    if (age > OAUTH_PENDING_MAX_MS) {
      localStorage.removeItem(OAUTH_RETURN_PENDING_LS_KEY);
      return null;
    }
    return age;
  } catch {
    return null;
  }
}

/** Safari プライベート等で localStorage が使えないときも、同一セッションで戻りを検知しやすくする */
const GOOGLE_OAUTH_FLOW_COOKIE = "lj_google_oauth_flow";

export function setGoogleOAuthFlowCookieActive(): void {
  if (typeof document === "undefined") return;
  const s = secureSuffix();
  document.cookie = `${GOOGLE_OAUTH_FLOW_COOKIE}=1; Path=/; Max-Age=900; SameSite=Lax${s}`;
}

export function clearGoogleOAuthFlowCookie(): void {
  if (typeof document === "undefined") return;
  const s = secureSuffix();
  document.cookie = `${GOOGLE_OAUTH_FLOW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${s}`;
}

export function isGoogleOAuthFlowCookieActive(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${GOOGLE_OAUTH_FLOW_COOKIE}=1`));
}

/** Google リダイレクト開始時（戻り検知用） */
export function markGoogleOAuthRedirectFlow(): void {
  markOAuthReturnPending();
  setGoogleOAuthFlowCookieActive();
}

/** ログイン成功・失敗確定時 */
export function clearGoogleOAuthRedirectFlow(): void {
  clearOAuthReturnPending();
  clearGoogleOAuthFlowCookie();
}

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
