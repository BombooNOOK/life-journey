"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import {
  clearEvidenceStorage,
  evaluateX66bDeviceValidationGate,
  loadEvidenceFromStorage,
  runX66bCreatePendingAutorun,
  runX66bRecoveryAutorun,
  saveEvidenceToStorage,
  type X66bAutorunState,
  type X66bValidationEvidence,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation";

/**
 * Dev-only autorun UI. Calls real journal orchestrator with Firebase session.
 * Manual step: after INTERRUPTION_READY, terminate+relaunch the app.
 */
export function X66bDeviceValidationClient() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const profileState = useEnsureActiveViewerProfile({ syncProfileToUrl: false });
  const gate = useMemo(() => evaluateX66bDeviceValidationGate(), []);
  const [evidence, setEvidence] = useState<X66bValidationEvidence>(() =>
    loadEvidenceFromStorage(),
  );
  const [state, setState] = useState<X66bAutorunState>("IDLE");
  const [message, setMessage] = useState<string>("—");
  const startedRef = useRef(false);

  const hasPendingMarker = evidence.phases.some(
    (p) => p.stage === "PENDING_PERSISTED" || p.stage === "INTERRUPTION_READY",
  );
  const hasCompleted = evidence.phases.some((p) => p.stage === "COMPLETED");
  const needsRecovery =
    hasPendingMarker &&
    !hasCompleted &&
    !evidence.phases.some((p) => p.stage === "SECOND_RESTART_NO_REPLAY");

  const runCreate = useCallback(async () => {
    setMessage("create_pending…");
    const result = await runX66bCreatePendingAutorun({
      user,
      authLoading,
      profileId: profileState.effectiveProfileId ?? "",
      interruptAfterPersist: true,
      evidence: loadEvidenceFromStorage(),
    });
    setEvidence(result.evidence);
    setState(result.state);
    setMessage(`create:${result.state} auth=${result.authAlias}`);
    saveEvidenceToStorage(result.evidence);
  }, [authLoading, profileState.effectiveProfileId, user]);

  const runRecovery = useCallback(async () => {
    setMessage("recovering…");
    const result = await runX66bRecoveryAutorun({
      user,
      authLoading,
      evidence: loadEvidenceFromStorage(),
    });
    setEvidence(result.evidence);
    setState(result.state);
    setMessage(`recovery:${result.state} auth=${result.authAlias}`);
    saveEvidenceToStorage(result.evidence);
  }, [authLoading, user]);

  useEffect(() => {
    if (!gate.operationsAllowed) {
      setState("HARNESS_OFF");
      setMessage(`unavailable:${gate.reason}`);
      return;
    }
    if (startedRef.current) return;
    if (authLoading) {
      setState("AUTH_WAIT");
      return;
    }
    if (!profileState.ready && !profileState.effectiveProfileId) {
      setMessage("waiting_profile");
      return;
    }
    startedRef.current = true;
    if (needsRecovery) {
      void runRecovery();
    } else if (!hasCompleted) {
      void runCreate();
    } else {
      setState("COMPLETED");
      setMessage("already_completed_evidence_present");
    }
  }, [
    authLoading,
    gate.operationsAllowed,
    gate.reason,
    hasCompleted,
    needsRecovery,
    profileState.effectiveProfileId,
    profileState.ready,
    runCreate,
    runRecovery,
  ]);

  return (
    <div className="space-y-4 text-sm text-stone-800">
      <section className="space-y-2 rounded border border-stone-200 bg-white p-3">
        <p>
          gate: {gate.reason} · state: <strong>{state}</strong>
        </p>
        <p className="break-all text-stone-600">{message}</p>
        <p className="text-xs text-stone-500">
          After INTERRUPTION_READY: terminate the app (do not uninstall), then relaunch
          this page. Recovery uses the normal orchestrator path.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => {
              startedRef.current = false;
              void runCreate();
            }}
          >
            Re-run create+interrupt
          </button>
          <button
            type="button"
            className="rounded border border-stone-300 bg-white px-3 py-1.5"
            onClick={() => {
              startedRef.current = false;
              void runRecovery();
            }}
          >
            Run recovery
          </button>
          <button
            type="button"
            className="rounded border border-amber-700 bg-amber-50 px-3 py-1.5 text-amber-900"
            onClick={() => {
              clearEvidenceStorage();
              setEvidence(loadEvidenceFromStorage());
              setState("IDLE");
              setMessage("evidence_cleared");
              startedRef.current = false;
            }}
          >
            Clear evidence
          </button>
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold">PII-safe evidence</h2>
        <pre className="overflow-x-auto rounded bg-stone-900 p-3 text-xs text-emerald-100">
          {JSON.stringify(evidence, null, 2)}
        </pre>
      </section>
    </div>
  );
}
