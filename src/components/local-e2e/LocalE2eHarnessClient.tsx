"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import {
  activateLocalE2eClientSessionViaBridge,
  clearLocalE2eClientSession,
  getLocalE2eClientSession,
} from "@/lib/localE2eHarness/clientSession";
import {
  armLocalE2eFault,
  listArmedLocalE2eFaults,
  type LocalE2eFaultMode,
} from "@/lib/localE2eHarness/faultStore";

type StatusJson = {
  code?: string;
  harness?: boolean;
  actorEmail?: string;
  reason?: string;
  db?: { host?: string; port?: string; database?: string };
};

const FAULT_MODES: LocalE2eFaultMode[] = [
  "response_loss_after_server_success",
  "lookup_processing_once",
  "lookup_not_found_once",
  "native_cleanup_failure_once",
];

let browserAutosmokePromise: Promise<void> | null = null;

async function runBrowserAutosmokeOnce(handlers: {
  onStatus: (status: StatusJson | null, error: string | null) => void;
  onSession: (email: string | null) => void;
  onCapability: (value: string) => void;
  onSecureIntent: (value: string) => void;
  onMessage: (value: string) => void;
}): Promise<void> {
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("ljd_local_e2e_autosmoke_done") === "1") {
    const summary = sessionStorage.getItem("ljd_local_e2e_autosmoke_summary");
    if (summary) handlers.onMessage(summary);
    return;
  }
  if (browserAutosmokePromise) return browserAutosmokePromise;

  browserAutosmokePromise = (async () => {
    const statusRes = await fetch("/api/local-e2e/status", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!statusRes.ok) {
      handlers.onStatus(null, `status_http_${statusRes.status}`);
      handlers.onMessage("autosmoke_status_failed");
      return;
    }
    handlers.onStatus((await statusRes.json()) as StatusJson, null);
    const session = await activateLocalE2eClientSessionViaBridge();
    if (!session.ok) {
      handlers.onSession(null);
      handlers.onMessage(`autosmoke_session_failed:${session.reason}`);
      return;
    }
    handlers.onSession(session.email);

    let capText = "capability_failed";
    try {
      const capRes = await fetch("/api/journal/save-capability", { credentials: "same-origin" });
      const capJson = (await capRes.json().catch(() => ({}))) as Record<string, unknown>;
      capText = `http=${capRes.status} protocol=${String(capJson.protocolVersion)} enabled=${String(capJson.idempotentSaveEnabled)}`;
      handlers.onCapability(capText);
    } catch {
      handlers.onCapability("capability_error");
    }

    let intentStatus = "secure_intent_error";
    try {
      const intent = await Promise.race([
        initializeSaveIntentStore(),
        new Promise<{ status: string }>((resolve) =>
          setTimeout(() => resolve({ status: "secure_intent_timeout" }), 8000),
        ),
      ]);
      intentStatus = intent.status;
      handlers.onSecureIntent(intent.status);
    } catch (err) {
      intentStatus = `secure_intent_throw:${err instanceof Error ? err.message : "unknown"}`;
      handlers.onSecureIntent(intentStatus);
    }

    let journalStatus = "journal_error";
    try {
      const journalRes = await fetch("/journal", { credentials: "same-origin", redirect: "manual" });
      journalStatus = String(journalRes.status);
    } catch {
      journalStatus = "journal_fetch_failed";
    }

    const summary = `autosmoke_ok session=${session.email} capability=${capText} secureIntent=${intentStatus} journal=${journalStatus}`;
    handlers.onMessage(summary);
    try {
      sessionStorage.setItem("ljd_local_e2e_autosmoke_done", "1");
      sessionStorage.setItem("ljd_local_e2e_autosmoke_summary", summary);
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/local-e2e/smoke-result", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          capability: capText,
          secureIntent: intentStatus,
          sessionEmail: session.email,
          journal: journalStatus,
        }),
      });
    } catch {
      /* ignore */
    }
  })().finally(() => {
    browserAutosmokePromise = null;
  });

  return browserAutosmokePromise;
}

export function LocalE2eHarnessClient() {
  const searchParams = useSearchParams();
  const autosmoke = searchParams.get("autosmoke") === "1";
  const [status, setStatus] = useState<StatusJson | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(
    () => getLocalE2eClientSession()?.email ?? null,
  );
  const [capability, setCapability] = useState<string>("—");
  const [secureIntent, setSecureIntent] = useState<string>("—");
  const [armed, setArmed] = useState(() => listArmedLocalE2eFaults());
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setStatusError(null);
    const res = await fetch("/api/local-e2e/status", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) {
      setStatus(null);
      setStatusError(`status_http_${res.status}`);
      return false;
    }
    setStatus((await res.json()) as StatusJson);
    return true;
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!autosmoke) return;
    void runBrowserAutosmokeOnce({
      onStatus: (next, error) => {
        setStatus(next);
        setStatusError(error);
      },
      onSession: setSessionEmail,
      onCapability: setCapability,
      onSecureIntent: setSecureIntent,
      onMessage: setMessage,
    });
  }, [autosmoke]);

  async function activateSession() {
    setMessage(null);
    const result = await activateLocalE2eClientSessionViaBridge();
    if (!result.ok) {
      setMessage(`session_failed:${result.reason}`);
      setSessionEmail(null);
      return;
    }
    setSessionEmail(result.email);
    setMessage("session_ok");
  }

  async function clearSession() {
    await clearLocalE2eClientSession();
    setSessionEmail(null);
    setMessage("session_cleared");
  }

  async function probeCapability() {
    const res = await fetch("/api/journal/save-capability", { credentials: "same-origin" });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    setCapability(
      `http=${res.status} protocol=${String(json.protocolVersion)} enabled=${String(json.idempotentSaveEnabled)}`,
    );
  }

  async function probeSecureIntent() {
    const result = await initializeSaveIntentStore();
    setSecureIntent(result.status);
  }

  function armFault(mode: LocalE2eFaultMode) {
    const email = sessionEmail ?? status?.actorEmail;
    if (!email) {
      setMessage("arm_requires_actor");
      return;
    }
    armLocalE2eFault({ mode, actorKey: email });
    setArmed(listArmedLocalE2eFaults());
    setMessage(`armed:${mode}`);
  }

  return (
    <div className="space-y-6 text-sm text-stone-800">
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Harness status</h2>
        <button
          type="button"
          className="rounded border border-stone-300 bg-white px-3 py-1.5"
          onClick={() => void refreshStatus()}
        >
          Refresh status
        </button>
        {statusError ? <p className="text-red-700">{statusError}</p> : null}
        {status ? (
          <pre className="overflow-x-auto rounded bg-white p-3 text-xs leading-relaxed">
            {JSON.stringify(status, null, 2)}
          </pre>
        ) : (
          <p className="text-stone-500">Harness unavailable (expected outside local gates).</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Fixed-actor session</h2>
        <p>Client session: {sessionEmail ?? "(none)"}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => void activateSession()}
          >
            Activate bridge session
          </button>
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => void clearSession()}
          >
            Clear session
          </button>
        </div>
        {sessionEmail ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/journal"
              className="rounded border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-white"
            >
              Open Journal runtime
            </Link>
            <Link
              href="/journal/with-companion"
              className="rounded border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-white"
            >
              Open Companion runtime
            </Link>
            <Link
              href="/orders/account/delete"
              className="rounded border border-amber-800 bg-amber-800 px-3 py-1.5 text-white"
            >
              Open account delete runtime
            </Link>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Smoke probes</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => void probeCapability()}
          >
            Probe capability
          </button>
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => void probeSecureIntent()}
          >
            Probe secure intent
          </button>
        </div>
        <p data-testid="local-e2e-capability">capability: {capability}</p>
        <p data-testid="local-e2e-secure-intent">secure intent: {secureIntent}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">One-shot faults (client adapter)</h2>
        <p className="text-stone-600">
          Arms process-memory faults for the fixed actor only. No generic production fault API.
        </p>
        <div className="flex flex-wrap gap-2">
          {FAULT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs"
              onClick={() => armFault(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded bg-white p-3 text-xs">
          {JSON.stringify(armed, null, 2)}
        </pre>
      </section>

      {message ? (
        <p className="break-all text-emerald-800" data-testid="local-e2e-message">
          {message}
        </p>
      ) : null}
    </div>
  );
}
