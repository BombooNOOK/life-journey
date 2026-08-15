import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";
import type {
  ClientSaveIntentStoreBootstrapResult,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

type Deps = {
  bootstrap: () => Promise<ClientSaveIntentStoreBootstrapResult>;
};

const productionDeps: Deps = { bootstrap: initializeSaveIntentStore };
const deletionInFlightActors = new Set<string>();
const deletedActors = new Set<string>();

export function isSaveIntentActivityBlockedForActor(actorKey: string): boolean {
  return deletionInFlightActors.has(actorKey) || deletedActors.has(actorKey);
}

export type AccountDeleteSaveIntentTeardown = {
  actorKey: string;
  serverDeleteFailed(): Promise<void>;
  serverDeleteSucceeded(): Promise<{ deletedIntentCount: number }>;
};

/**
 * Admission occurs before the irreversible server request. Native storage
 * failures block the delete; browser has no native intent database to clean.
 */
export async function beginAccountDeleteSaveIntentTeardown(
  viewerEmail: string,
  deps: Deps = productionDeps,
): Promise<AccountDeleteSaveIntentTeardown> {
  const actorKey = normalizeClientActorKey(viewerEmail);
  if (!actorKey) throw new Error("account_delete_actor_missing");
  if (deletionInFlightActors.has(actorKey) || deletedActors.has(actorKey)) {
    throw new Error("account_delete_already_in_progress");
  }
  const bootstrap = await deps.bootstrap();
  if (bootstrap.status !== "ready" && bootstrap.status !== "unsupported_platform") {
    throw new Error("account_delete_secure_intent_store_unavailable");
  }
  deletionInFlightActors.add(actorKey);
  const store = bootstrap.status === "ready" ? bootstrap.store : null;
  if (store) {
    try {
      await store.writeDeletionTombstone(actorKey, new Date().toISOString());
    } catch {
      deletionInFlightActors.delete(actorKey);
      throw new Error("account_delete_tombstone_write_failed");
    }
  }
  return createTeardown(actorKey, store);
}

function createTeardown(
  actorKey: string,
  store: ClientSaveOperationIntentStore | null,
): AccountDeleteSaveIntentTeardown {
  let settled = false;
  return {
    actorKey,
    async serverDeleteFailed() {
      if (settled) return;
      settled = true;
      deletionInFlightActors.delete(actorKey);
      if (store) {
        try {
          await store.clearDeletionTombstone(actorKey);
        } catch {
          // Fail closed: preserve the runtime block when durable cancellation
          // cannot be confirmed.
          deletedActors.add(actorKey);
        }
      }
    },
    async serverDeleteSucceeded() {
      if (settled) throw new Error("account_delete_teardown_already_settled");
      settled = true;
      // The server delete is irreversible. Block all save activity before
      // cleanup so a local cleanup failure can never revive/replay an intent.
      deletionInFlightActors.delete(actorKey);
      deletedActors.add(actorKey);
      if (!store) return { deletedIntentCount: 0 };
      const deletedIntentCount = await store.deleteByActor(actorKey);
      const remaining = await store.listRecoverableByActor(actorKey);
      if (remaining.length !== 0) throw new Error("account_delete_intent_cleanup_incomplete");
      await store.clearDeletionTombstone(actorKey);
      return { deletedIntentCount };
    },
  };
}

/** Restart-safe local cleanup only; it never touches Journal transport. */
export async function resumeAccountDeleteSaveIntentCleanup(
  actorKey: string,
  store: ClientSaveOperationIntentStore,
): Promise<boolean> {
  const tombstone = await store.getDeletionTombstone(actorKey);
  if (!tombstone) return false;
  deletedActors.add(actorKey);
  try {
    await store.deleteByActor(actorKey);
    if ((await store.listRecoverableByActor(actorKey)).length !== 0) return true;
    await store.clearDeletionTombstone(actorKey);
    return false;
  } catch {
    return true;
  }
}

export function resetAccountDeleteSaveIntentTeardownForTest(): void {
  deletionInFlightActors.clear();
  deletedActors.clear();
}
