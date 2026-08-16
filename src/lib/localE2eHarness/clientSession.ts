/**
 * Client-side local E2E session after a gated server bridge succeeds.
 * Email is never client-authored; it comes only from the server response.
 *
 * Persisted in sessionStorage so Companion full-page navigations (and other
 * same-tab reloads) do not lose the fixed actor and get bounced to /login.
 *
 * Production / Preview Next builds set NODE_ENV=production. In that mode this
 * module is structurally inert: no sessionStorage, no /api/local-e2e fetch,
 * and no viewer stub input for FirebaseAuthProvider.
 */

import { syncLjAuthClientCookies } from "@/lib/auth/clientCookies";

const STORAGE_KEY = "ljd_local_e2e_client_session_v1";

type LocalE2eClientSession = {
  email: string;
};

type Listener = (session: LocalE2eClientSession | null) => void;

let session: LocalE2eClientSession | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

/**
 * Local `next dev` only. Vercel Production and Preview both compile with
 * NODE_ENV=production, so the client harness cannot activate there.
 */
export function isLocalE2eClientRuntimeEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return (nodeEnv ?? "").trim() !== "production";
}

function emit(): void {
  for (const listener of listeners) listener(session);
}

function readStored(): LocalE2eClientSession | null {
  if (!isLocalE2eClientRuntimeEnabled()) return null;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown };
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return null;
    return { email };
  } catch {
    return null;
  }
}

function writeStored(next: LocalE2eClientSession | null): void {
  if (!isLocalE2eClientRuntimeEnabled()) return;
  if (typeof sessionStorage === "undefined") return;
  try {
    if (!next) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: next.email }));
  } catch {
    // Best-effort only.
  }
}

function hydrateFromStorage(): void {
  if (hydrated) return;
  hydrated = true;
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    return;
  }
  if (session) return;
  session = readStored();
}

export function getLocalE2eClientSession(): LocalE2eClientSession | null {
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    hydrated = true;
    return null;
  }
  hydrateFromStorage();
  return session;
}

export function subscribeLocalE2eClientSession(listener: Listener): () => void {
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    hydrated = true;
    listeners.add(listener);
    listener(null);
    return () => {
      listeners.delete(listener);
    };
  }
  hydrateFromStorage();
  listeners.add(listener);
  listener(session);
  return () => {
    listeners.delete(listener);
  };
}

/** Test / diagnostics only — prefer activateLocalE2eClientSessionViaBridge. */
export function setLocalE2eClientSessionForTest(email: string | null): void {
  hydrated = true;
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    writeStored(null);
    emit();
    return;
  }
  session = email ? { email: email.trim().toLowerCase() } : null;
  writeStored(session);
  emit();
}

/**
 * Re-apply cookies after a same-tab reload when a stored local E2E session exists.
 * Does not invent an email; only refreshes the fixed-actor bridge cookies.
 */
export async function restoreLocalE2eClientSessionCookies(): Promise<boolean> {
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    hydrated = true;
    return false;
  }
  hydrateFromStorage();
  if (!session) return false;
  syncLjAuthClientCookies({ email: session.email });
  try {
    const res = await fetch("/api/local-e2e/session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as { email?: string };
    if (typeof data.email === "string" && data.email.trim()) {
      session = { email: data.email.trim().toLowerCase() };
      writeStored(session);
      syncLjAuthClientCookies({ email: session.email });
      emit();
    }
    return true;
  } catch {
    return false;
  }
}

export async function activateLocalE2eClientSessionViaBridge(): Promise<
  | { ok: true; email: string }
  | { ok: false; reason: string }
> {
  if (!isLocalE2eClientRuntimeEnabled()) {
    session = null;
    hydrated = true;
    emit();
    return { ok: false, reason: "local_e2e_client_runtime_disabled" };
  }
  const res = await fetch("/api/local-e2e/session", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const data = (await res.json().catch(() => ({}))) as {
    email?: string;
    reason?: string;
    code?: string;
  };
  if (!res.ok || typeof data.email !== "string" || !data.email.trim()) {
    session = null;
    writeStored(null);
    emit();
    return { ok: false, reason: data.reason ?? data.code ?? `http_${res.status}` };
  }
  hydrated = true;
  session = { email: data.email.trim().toLowerCase() };
  writeStored(session);
  syncLjAuthClientCookies({ email: session.email });
  emit();
  return { ok: true, email: session.email };
}

export async function clearLocalE2eClientSession(): Promise<void> {
  hydrated = true;
  session = null;
  writeStored(null);
  emit();
  if (!isLocalE2eClientRuntimeEnabled()) {
    return;
  }
  syncLjAuthClientCookies(null);
  try {
    await fetch("/api/local-e2e/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // Best-effort cookie clear; client session is already cleared.
  }
}

/**
 * Pure effective-user selection for auth UI. Production / Preview never pass a
 * local E2E email because getLocalE2eClientSession is inert there.
 */
export function resolveFirebaseAuthEffectiveUser<TUser>(input: {
  firebaseUser: TUser | null;
  localE2eEmail: string | null | undefined;
  buildLocalE2eUser: (email: string) => TUser;
}): TUser | null {
  const email = input.localE2eEmail?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@") || !isLocalE2eClientRuntimeEnabled()) {
    return input.firebaseUser;
  }
  return input.buildLocalE2eUser(email);
}
