import type { ClientSaveOperationIntentStatus } from "@/lib/journal/clientSaveIntent/types";

/**
 * Client intent lifecycle, deliberately independent from server JSO checkpoints.
 * Terminal states cannot be rewound. Re-entering the same state is idempotent.
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<ClientSaveOperationIntentStatus, readonly ClientSaveOperationIntentStatus[]>
> = {
  prepared: [
    "prepared",
    "awaiting_result",
    "server_completed",
    "completed",
    "recovery_required",
    "failed_final",
  ],
  awaiting_result: [
    "awaiting_result",
    "server_completed",
    "completed",
    "recovery_required",
    "failed_final",
  ],
  server_completed: ["server_completed", "completed"],
  completed: ["completed"],
  recovery_required: ["recovery_required", "awaiting_result", "failed_final"],
  failed_final: ["failed_final"],
};

export function isClientSaveOperationIntentTransitionAllowed(
  from: ClientSaveOperationIntentStatus,
  to: ClientSaveOperationIntentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertClientSaveOperationIntentTransition(
  from: ClientSaveOperationIntentStatus,
  to: ClientSaveOperationIntentStatus,
): void {
  if (!isClientSaveOperationIntentTransitionAllowed(from, to)) {
    throw new Error(`intent_transition_invalid:${from}->${to}`);
  }
}
