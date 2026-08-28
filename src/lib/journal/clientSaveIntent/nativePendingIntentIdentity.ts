/**
 * Native pending save-intent stable identity helpers (AI-X6.6A).
 *
 * Canonical stable form matches server X6.3/X6.4: firebase:<UID>.
 * Legacy actorKey (normalized email snapshot) remains for compatibility.
 */

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import type { ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/types";
import { isNativeStablePendingIntentEnabled } from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";

export type NativePendingIntentSession = {
  viewerEmail: string;
  firebaseUid?: string | null;
};

export type StableIntentAccessResult =
  | { ok: true }
  | { ok: false; reason: "stable_identity_unavailable" | "stable_auth_mismatch" };

export function resolveSessionStableActorKey(
  firebaseUid: string | null | undefined,
): string | null {
  if (typeof firebaseUid !== "string" || firebaseUid.trim().length === 0) {
    return null;
  }
  return buildFirebaseActorKey(firebaseUid.trim());
}

/**
 * Stable key required when gate ON and creating a new durable intent.
 * Returns null when gate OFF (caller keeps legacy-only behavior).
 */
export function requireStableActorKeyForNewIntent(
  firebaseUid: string | null | undefined,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string | null {
  if (!isNativeStablePendingIntentEnabled(env)) return null;
  return resolveSessionStableActorKey(firebaseUid);
}

export function assertStableIntentRecoveryAccess(
  intent: ClientSaveOperationIntent,
  session: NativePendingIntentSession,
): StableIntentAccessResult {
  if (!intent.stableActorKey) return { ok: true };
  const currentStable = resolveSessionStableActorKey(session.firebaseUid);
  if (!currentStable) return { ok: false, reason: "stable_identity_unavailable" };
  if (currentStable !== intent.stableActorKey) {
    return { ok: false, reason: "stable_auth_mismatch" };
  }
  return { ok: true };
}

export function legacyActorKeyFromSession(session: NativePendingIntentSession): string {
  return normalizeClientActorKey(session.viewerEmail);
}

const RECOVERABLE_STATUSES = new Set([
  "prepared",
  "awaiting_result",
  "server_completed",
  "recovery_required",
]);

export function isRecoverableIntent(intent: ClientSaveOperationIntent): boolean {
  return RECOVERABLE_STATUSES.has(intent.status);
}

/** Dedupe by saveOperationId while preserving first-seen order. */
export function mergeRecoverableIntents(
  batches: ClientSaveOperationIntent[][],
): ClientSaveOperationIntent[] {
  const seen = new Set<string>();
  const merged: ClientSaveOperationIntent[] = [];
  for (const batch of batches) {
    for (const intent of batch) {
      if (seen.has(intent.saveOperationId)) continue;
      seen.add(intent.saveOperationId);
      merged.push(intent);
    }
  }
  return merged;
}
