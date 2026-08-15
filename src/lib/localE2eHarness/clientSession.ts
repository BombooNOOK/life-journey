/**
 * Client-side local E2E session after a gated server bridge succeeds.
 * Email is never client-authored; it comes only from the server response.
 */

import { syncLjAuthClientCookies } from "@/lib/auth/clientCookies";

type LocalE2eClientSession = {
  email: string;
};

type Listener = (session: LocalE2eClientSession | null) => void;

let session: LocalE2eClientSession | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener(session);
}

export function getLocalE2eClientSession(): LocalE2eClientSession | null {
  return session;
}

export function subscribeLocalE2eClientSession(listener: Listener): () => void {
  listeners.add(listener);
  listener(session);
  return () => {
    listeners.delete(listener);
  };
}

/** Test / diagnostics only — prefer activateLocalE2eClientSessionViaBridge. */
export function setLocalE2eClientSessionForTest(email: string | null): void {
  session = email ? { email: email.trim().toLowerCase() } : null;
  emit();
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
    emit();
    return { ok: false, reason: data.reason ?? data.code ?? `http_${res.status}` };
  }
  session = { email: data.email.trim().toLowerCase() };
  syncLjAuthClientCookies({ email: session.email });
  emit();
  return { ok: true, email: session.email };
}

export async function clearLocalE2eClientSession(): Promise<void> {
  session = null;
  syncLjAuthClientCookies(null);
  emit();
  try {
    await fetch("/api/local-e2e/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // Best-effort cookie clear; client session is already cleared.
  }
}
