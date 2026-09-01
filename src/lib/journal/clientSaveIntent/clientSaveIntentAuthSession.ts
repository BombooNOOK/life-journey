/**
 * Firebase Auth → client save-intent session (AI-X6.6A2).
 *
 * Centralizes viewer email + Firebase UID extraction for durable save/recovery
 * wiring. Does not perform saves itself.
 */

import type { User } from "firebase/auth";

export type ClientSaveIntentAuthSession = {
  authLoading: boolean;
  viewerEmail: string | null;
  firebaseUid: string | null;
  /** Auth settled with a usable email — safe to invoke save/recovery admission. */
  sessionReady: boolean;
};

export function resolveClientSaveIntentAuthSession(input: {
  user: User | null;
  authLoading: boolean;
}): ClientSaveIntentAuthSession {
  const viewerEmail = input.user?.email?.trim() ?? null;
  const firebaseUid = input.user?.uid?.trim() ?? null;
  return {
    authLoading: input.authLoading,
    viewerEmail,
    firebaseUid,
    sessionReady: !input.authLoading && Boolean(viewerEmail),
  };
}

/**
 * Inputs for orchestrator save/recovery calls from UI layers.
 * Omits firebaseUid when absent (legacy gate OFF path unchanged).
 */
export function buildClientSaveIntentOrchestratorSession(
  session: ClientSaveIntentAuthSession,
): {
  viewerEmail: string;
  firebaseUid?: string | null;
} | null {
  if (!session.sessionReady || !session.viewerEmail) return null;
  return {
    viewerEmail: session.viewerEmail,
    firebaseUid: session.firebaseUid,
  };
}
