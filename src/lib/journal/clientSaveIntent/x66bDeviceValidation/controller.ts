/**
 * X6.6B0 autorun controller — ENTRY only.
 * Calls real runJournalCreateSave / recoverJournalCreateSaves with Firebase session.
 */

import type { User } from "firebase/auth";

import {
  buildClientSaveIntentOrchestratorSession,
  resolveClientSaveIntentAuthSession,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentAuthSession";
import {
  recoverJournalCreateSaves,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
  type JournalCreateSaveResult,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import {
  X66B_VALIDATION_CONTENT,
  X66B_VALIDATION_DRAFT_REF,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/constants";
import {
  aliasSaveOperationId,
  appendEvidencePhase,
  classifyStableActorKey,
  emptyX66bEvidence,
  resolveAuthAlias,
  saveEvidenceToStorage,
  type X66bAuthAlias,
  type X66bValidationEvidence,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/evidence";
import { evaluateX66bDeviceValidationGate } from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/gate";
import { createX66bInstrumentedDeps } from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/interruption";

export type X66bAutorunState =
  | "IDLE"
  | "AUTH_WAIT"
  | "READY"
  | "CREATE_PENDING"
  | "PENDING_PERSISTED"
  | "INTERRUPTION_READY"
  | "RECOVERY_WAIT"
  | "RECOVERING"
  | "COMPLETED"
  | "FAILED"
  | "AUTH_REQUIRED"
  | "HARNESS_OFF";

export type X66bAutorunResult = {
  state: X66bAutorunState;
  evidence: X66bValidationEvidence;
  authAlias: X66bAuthAlias;
  saveResult?: JournalCreateSaveResult;
  recoveryResults?: JournalCreateSaveResult[];
};

function validationPayload(profileId: string): JournalCreatePayload {
  const today = new Date().toISOString().slice(0, 10);
  return {
    content: X66B_VALIDATION_CONTENT,
    mood: "calm",
    activity: "record_anyway",
    companionType: "owl",
    designTheme: "simple_plain",
    contentFontMode: "standard",
    entryDate: today,
    profileId,
    effectiveProfileId: profileId,
    includeInBook: true,
  };
}

function gateOrOff(evidence: X66bValidationEvidence): X66bAutorunResult | null {
  const gate = evaluateX66bDeviceValidationGate();
  if (!gate.operationsAllowed) {
    const next = appendEvidencePhase(evidence, {
      stage: gate.reason === "production_build" ? "FAILED" : "HARNESS_OFF",
      note: gate.reason,
    });
    return {
      state: gate.reason === "production_build" ? "FAILED" : "HARNESS_OFF",
      evidence: next,
      authAlias: "SIGNED_OUT",
    };
  }
  return null;
}

export async function runX66bCreatePendingAutorun(input: {
  user: User | null;
  authLoading: boolean;
  profileId: string;
  /** Leave a durable pending row (throw after persist, before successful completion). */
  interruptAfterPersist?: boolean;
  evidence?: X66bValidationEvidence;
  depsBase?: JournalCreateSaveOrchestratorDeps;
  persistEvidence?: boolean;
}): Promise<X66bAutorunResult> {
  let evidence = input.evidence ?? emptyX66bEvidence();
  const blocked = gateOrOff(evidence);
  if (blocked) return blocked;

  const authAlias = resolveAuthAlias(evidence, {
    authLoading: input.authLoading,
    firebaseUid: input.user?.uid?.trim() ?? null,
  });

  if (input.authLoading) {
    evidence = appendEvidencePhase(evidence, { stage: "AUTH_WAIT", authAlias });
    return { state: "AUTH_WAIT", evidence, authAlias };
  }

  const session = resolveClientSaveIntentAuthSession({
    user: input.user,
    authLoading: false,
  });
  const orchestratorSession = buildClientSaveIntentOrchestratorSession(session);
  if (!orchestratorSession || !session.firebaseUid) {
    evidence = appendEvidencePhase(evidence, {
      stage: "AUTH_REQUIRED",
      authAlias: session.viewerEmail ? "AUTH_REQUIRED" : "SIGNED_OUT",
      note: session.viewerEmail ? "firebase_uid_missing" : "signed_out",
    });
    return {
      state: "AUTH_REQUIRED",
      evidence,
      authAlias: session.viewerEmail ? "AUTH_REQUIRED" : "SIGNED_OUT",
    };
  }

  const profileId = input.profileId.trim();
  if (!profileId) {
    evidence = appendEvidencePhase(evidence, {
      stage: "FAILED",
      authAlias,
      note: "profile_id_required",
    });
    return { state: "FAILED", evidence, authAlias };
  }

  evidence = appendEvidencePhase(evidence, { stage: "READY", authAlias });
  evidence = appendEvidencePhase(evidence, { stage: "CREATE_PENDING", authAlias });

  const interruptAfterPersist = input.interruptAfterPersist !== false;
  const deps = createX66bInstrumentedDeps({
    interruptAfterPersist,
    base: input.depsBase,
    onEvent: (event) => {
      evidence = appendEvidencePhase(evidence, event);
    },
  });

  let saveResult: JournalCreateSaveResult;
  try {
    saveResult = await runJournalCreateSave(
      {
        ...orchestratorSession,
        payload: validationPayload(profileId),
        draftRef: X66B_VALIDATION_DRAFT_REF,
      },
      deps,
    );
  } catch (err) {
    const note = err instanceof Error ? err.message : String(err);
    evidence = appendEvidencePhase(evidence, {
      stage: "FAILED",
      authAlias,
      note: `orchestrator_threw:${note}`,
      persistBeforePostOk: evidence.persistBeforePostOk,
    });
    if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
    return { state: "FAILED", evidence, authAlias };
  }

  if (saveResult.kind === "pending" || saveResult.kind === "processing") {
    const intent = saveResult.intent;
    const alias = aliasSaveOperationId(intent.saveOperationId);
    if (
      evidence.lastSaveOperationIdAlias &&
      evidence.lastSaveOperationIdAlias !== alias &&
      evidence.phases.some((p) => p.stage === "PENDING_PERSISTED")
    ) {
      evidence = { ...evidence, duplicateSaveDetected: true };
    }
    evidence = appendEvidencePhase(evidence, {
      stage: "PENDING_PERSISTED",
      authAlias,
      saveOperationIdAlias: alias,
      payloadHash: intent.requestFingerprint,
      intentStatus: intent.status,
      stableActorClass: classifyStableActorKey(intent.stableActorKey),
      resultKind: saveResult.kind,
      persistBeforePostOk: evidence.persistBeforePostOk,
      note: interruptAfterPersist ? "interrupt_left_pending" : "pending_without_forced_interrupt",
    });
    evidence = appendEvidencePhase(evidence, {
      stage: "INTERRUPTION_READY",
      authAlias,
      saveOperationIdAlias: alias,
      payloadHash: intent.requestFingerprint,
      note: "operator_may_terminate_app",
    });
    if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
    return {
      state: interruptAfterPersist ? "INTERRUPTION_READY" : "PENDING_PERSISTED",
      evidence,
      authAlias,
      saveResult,
    };
  }

  if (saveResult.kind === "completed") {
    evidence = appendEvidencePhase(evidence, {
      stage: "COMPLETED",
      authAlias,
      saveOperationIdAlias: saveResult.intent
        ? aliasSaveOperationId(saveResult.intent.saveOperationId)
        : undefined,
      payloadHash: saveResult.intent?.requestFingerprint,
      intentStatus: saveResult.intent?.status,
      stableActorClass: classifyStableActorKey(saveResult.intent?.stableActorKey),
      resultKind: "completed",
      note: "completed_without_interrupt",
    });
    if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
    return { state: "COMPLETED", evidence, authAlias, saveResult };
  }

  evidence = appendEvidencePhase(evidence, {
    stage: "FAILED",
    authAlias,
    resultKind: saveResult.kind,
    note:
      saveResult.kind === "protocol_start_failed"
        ? saveResult.reason
        : saveResult.kind === "legacy"
          ? "legacy_path_unexpected"
          : "unexpected_result",
  });
  if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
  return { state: "FAILED", evidence, authAlias, saveResult };
}

export async function runX66bRecoveryAutorun(input: {
  user: User | null;
  authLoading: boolean;
  evidence?: X66bValidationEvidence;
  depsBase?: JournalCreateSaveOrchestratorDeps;
  persistEvidence?: boolean;
}): Promise<X66bAutorunResult> {
  let evidence = input.evidence ?? emptyX66bEvidence();
  const blocked = gateOrOff(evidence);
  if (blocked) return blocked;

  const authAlias = resolveAuthAlias(evidence, {
    authLoading: input.authLoading,
    firebaseUid: input.user?.uid?.trim() ?? null,
  });

  if (input.authLoading) {
    evidence = appendEvidencePhase(evidence, { stage: "AUTH_WAIT", authAlias });
    return { state: "AUTH_WAIT", evidence, authAlias };
  }

  const session = resolveClientSaveIntentAuthSession({
    user: input.user,
    authLoading: false,
  });
  const orchestratorSession = buildClientSaveIntentOrchestratorSession(session);
  if (!orchestratorSession || !session.firebaseUid) {
    evidence = appendEvidencePhase(evidence, {
      stage: "AUTH_REQUIRED",
      authAlias: "SIGNED_OUT",
      note: "recovery_requires_auth",
    });
    return { state: "AUTH_REQUIRED", evidence, authAlias: "SIGNED_OUT" };
  }

  evidence = appendEvidencePhase(evidence, {
    stage: "RECOVERY_WAIT",
    authAlias,
    note: "auth_ready_begin_recovery",
  });
  evidence = appendEvidencePhase(evidence, { stage: "RECOVERING", authAlias });

  // Real recovery/bootstrap path — no controlled interrupt on recovery.
  const recoveryResults = input.depsBase
    ? await recoverJournalCreateSaves(orchestratorSession, input.depsBase)
    : await recoverJournalCreateSaves(orchestratorSession);

  const completed = recoveryResults.filter((r) => r.kind === "completed");
  const pendingLeft = recoveryResults.filter(
    (r) => r.kind === "pending" || r.kind === "processing",
  );
  const priorAlias = evidence.lastSaveOperationIdAlias;
  const priorHash = evidence.lastPayloadHash;

  for (const row of completed) {
    if (row.kind !== "completed" || !row.intent) continue;
    const alias = aliasSaveOperationId(row.intent.saveOperationId);
    evidence = appendEvidencePhase(evidence, {
      stage: "COMPLETED",
      authAlias,
      saveOperationIdAlias: alias,
      payloadHash: row.intent.requestFingerprint,
      intentStatus: row.intent.status,
      stableActorClass: classifyStableActorKey(row.intent.stableActorKey),
      resultKind: "completed",
      note:
        priorAlias && priorAlias !== alias
          ? "save_operation_id_mismatch"
          : priorHash && priorHash !== row.intent.requestFingerprint
            ? "payload_hash_mismatch"
            : "recovered_original_pending",
    });
    if (priorAlias && priorAlias !== alias) {
      evidence = { ...evidence, duplicateSaveDetected: true };
    }
  }

  if (completed.length === 0 && pendingLeft.length === 0 && recoveryResults.length === 0) {
    evidence = appendEvidencePhase(evidence, {
      stage: "SECOND_RESTART_NO_REPLAY",
      authAlias,
      note: "no_recoverable_pending",
    });
    if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
    return {
      state: "COMPLETED",
      evidence,
      authAlias,
      recoveryResults,
    };
  }

  if (completed.length > 0) {
    if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
    return { state: "COMPLETED", evidence, authAlias, recoveryResults };
  }

  evidence = appendEvidencePhase(evidence, {
    stage: "FAILED",
    authAlias,
    pendingCount: pendingLeft.length,
    resultKind: recoveryResults[0]?.kind,
    note: "recovery_did_not_complete",
  });
  if (input.persistEvidence !== false) saveEvidenceToStorage(evidence);
  return { state: "FAILED", evidence, authAlias, recoveryResults };
}
