/**
 * One-shot native cleanup failure for account-delete E2E (AI-4 / AI-5.2).
 * Does not corrupt SQLCipher files, Keychain secrets, or schema.
 */

import type { ClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/types";
import { consumeLocalE2eFault } from "@/lib/localE2eHarness/faultStore";

export function wrapIntentStoreWithNativeCleanupFault(
  store: ClientSaveOperationIntentStore,
  actorKey: string,
): ClientSaveOperationIntentStore {
  return {
    ...store,
    async deleteByActor(requestedActorKey) {
      if (
        requestedActorKey === actorKey &&
        consumeLocalE2eFault("native_cleanup_failure_once", actorKey)
      ) {
        throw new Error("local_e2e_native_cleanup_failure_once");
      }
      return store.deleteByActor(requestedActorKey);
    },
  };
}
