/**
 * Client-side local E2E session after a gated server bridge succeeds.
 * Email is never client-authored; it comes only from the server response.
 *
 * Persisted in sessionStorage so Companion full-page navigations (and other
 * same-tab reloads) do not lose the fixed actor and get bounced to /login.
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

function emit(): void {
  for (const listener of listeners) listener(session);
}

function readStored(): LocalE2eClientSession | null {
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
  if (session) return;
  session = readStored();
}

export function getLocalE2eClientSession(): LocalE2eClientSession | null {
  hydrateFromStorage();
  return session;
}

export function subscribeLocalE2eClientSession(listener: Listener): () => void {
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
  session = email ? { email: email.trim().toLowerCase() } : null;
  writeStored(session);
  emit();
}

/**
 * Re-apply cookies after a same-tab reload when a stored local E2E session exists.
 * Does not invent an email; only refreshes the fixed-actor bridge cookies.
 */
export async function restoreLocalE2eClientSessionCookies(): Promise<boolean> {
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
  syncLjAuthClientCookies(null);
  emit();
  try {
    await fetch("/api/local-e2e/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // Best-effort cookie clear; client session is already cleared.
  }
}
