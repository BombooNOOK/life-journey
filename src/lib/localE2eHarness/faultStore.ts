/**
 * Process-memory one-shot fault arming for local E2E (AI-5.2).
 * Scoped to a fixed test actor; auto-clears on consume.
 */

export type LocalE2eFaultMode =
  | "response_loss_after_server_success"
  | "lookup_processing_once"
  | "lookup_not_found_once"
  | "native_cleanup_failure_once";

export type LocalE2eArmedFault = {
  mode: LocalE2eFaultMode;
  actorKey: string;
  saveOperationId?: string | null;
};

const armed = new Map<LocalE2eFaultMode, LocalE2eArmedFault>();

export function clearLocalE2eFaultsForTest(): void {
  armed.clear();
}

export function listArmedLocalE2eFaults(): LocalE2eArmedFault[] {
  return [...armed.values()];
}

export function armLocalE2eFault(input: LocalE2eArmedFault): void {
  const actorKey = input.actorKey.trim().toLowerCase();
  if (!actorKey) throw new Error("local_e2e_fault_actor_required");
  armed.set(input.mode, {
    mode: input.mode,
    actorKey,
    saveOperationId: input.saveOperationId?.trim() || null,
  });
}

function matchesScope(
  fault: LocalE2eArmedFault,
  actorKey: string,
  saveOperationId?: string | null,
): boolean {
  if (fault.actorKey !== actorKey.trim().toLowerCase()) return false;
  if (!fault.saveOperationId) return true;
  return fault.saveOperationId === (saveOperationId ?? "").trim();
}

/**
 * Consume a one-shot fault when actor (and optional saveOperationId) match.
 * Wrong actor → no consume, no activation.
 */
export function consumeLocalE2eFault(
  mode: LocalE2eFaultMode,
  actorKey: string,
  saveOperationId?: string | null,
): boolean {
  const fault = armed.get(mode);
  if (!fault) return false;
  if (!matchesScope(fault, actorKey, saveOperationId)) return false;
  armed.delete(mode);
  return true;
}

export function peekLocalE2eFault(
  mode: LocalE2eFaultMode,
  actorKey: string,
  saveOperationId?: string | null,
): boolean {
  const fault = armed.get(mode);
  if (!fault) return false;
  return matchesScope(fault, actorKey, saveOperationId);
}
