/**
 * Recovery listing for native pending intents (AI-X6.6A).
 */

import {
  assertStableIntentRecoveryAccess,
  legacyActorKeyFromSession,
  mergeRecoverableIntents,
  resolveSessionStableActorKey,
  type NativePendingIntentSession,
} from "@/lib/journal/clientSaveIntent/nativePendingIntentIdentity";
import { isNativeStablePendingIntentEnabled } from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import type {
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

export async function listRecoverableIntentsForSession(
  store: ClientSaveOperationIntentStore,
  session: NativePendingIntentSession,
): Promise<ClientSaveOperationIntent[]> {
  const legacyActorKey = legacyActorKeyFromSession(session);
  if (!legacyActorKey) return [];

  if (!isNativeStablePendingIntentEnabled()) {
    return store.listRecoverableByActor(legacyActorKey);
  }

  const legacyBatch = await store.listRecoverableByActor(legacyActorKey);
  const stableKey = resolveSessionStableActorKey(session.firebaseUid);
  if (!stableKey) return legacyBatch;
  const stableBatch = await store.listRecoverableByStableActorKey(stableKey);
  return mergeRecoverableIntents([legacyBatch, stableBatch]);
}

export async function findRecoverableIntentForSession(
  store: ClientSaveOperationIntentStore,
  session: NativePendingIntentSession,
  saveOperationId: string,
): Promise<
  | { kind: "found"; intent: ClientSaveOperationIntent }
  | { kind: "not_found" }
  | { kind: "stable_auth_mismatch"; intent: ClientSaveOperationIntent }
  | { kind: "stable_identity_unavailable"; intent: ClientSaveOperationIntent }
> {
  const legacyActorKey = legacyActorKeyFromSession(session);
  const stableKey = resolveSessionStableActorKey(session.firebaseUid);

  if (isNativeStablePendingIntentEnabled() && stableKey) {
    const stableIntent = await store.findByStableActorAndSaveOperationId(
      stableKey,
      saveOperationId,
    );
    if (stableIntent) {
      const access = assertStableIntentRecoveryAccess(stableIntent, session);
      if (!access.ok) {
        return access.reason === "stable_auth_mismatch"
          ? { kind: "stable_auth_mismatch", intent: stableIntent }
          : { kind: "stable_identity_unavailable", intent: stableIntent };
      }
      return { kind: "found", intent: stableIntent };
    }
  }

  if (!legacyActorKey) return { kind: "not_found" };
  const legacyIntent = await store.findByActorAndSaveOperationId(
    legacyActorKey,
    saveOperationId,
  );
  if (!legacyIntent) return { kind: "not_found" };

  const access = assertStableIntentRecoveryAccess(legacyIntent, session);
  if (!access.ok) {
    return access.reason === "stable_auth_mismatch"
      ? { kind: "stable_auth_mismatch", intent: legacyIntent }
      : { kind: "stable_identity_unavailable", intent: legacyIntent };
  }
  return { kind: "found", intent: legacyIntent };
}
