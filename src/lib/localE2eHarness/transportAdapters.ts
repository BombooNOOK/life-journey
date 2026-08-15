/**
 * Client transport adapters for one-shot local E2E faults.
 * Harness OFF (no armed faults) → identical to the wrapped deps.
 */

import type { JournalCreatePayload, JournalCreateSaveOrchestratorDeps } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";
import { consumeLocalE2eFault } from "@/lib/localE2eHarness/faultStore";

function lookupJson(state: "processing" | "not_found"): Response {
  return new Response(JSON.stringify({ state }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Wraps post/lookup only. Capability and bootstrap stay formal.
 * Response-loss: real POST completes; client discards the successful Response.
 */
export function wrapJournalCreateDepsWithLocalE2eFaults(
  deps: JournalCreateSaveOrchestratorDeps,
  viewerEmailForScope: () => string | null | undefined,
): JournalCreateSaveOrchestratorDeps {
  return {
    ...deps,
    async post(payload: JournalCreatePayload) {
      const actorKey = normalizeClientActorKey(viewerEmailForScope() ?? "") ?? "";
      const saveOperationId =
        typeof payload.saveOperationId === "string" ? payload.saveOperationId : null;
      const response = await deps.post(payload);
      if (
        actorKey &&
        response.ok &&
        response.status === 200 &&
        consumeLocalE2eFault("response_loss_after_server_success", actorKey, saveOperationId)
      ) {
        // Server work already finished. Drop the body so the orchestrator
        // treats this as transport ambiguity (catch → processing).
        throw new Error("local_e2e_response_loss_after_server_success");
      }
      return response;
    },
    async lookup(input) {
      const actorKey = normalizeClientActorKey(viewerEmailForScope() ?? "") ?? "";
      if (
        actorKey &&
        consumeLocalE2eFault("lookup_processing_once", actorKey, input.saveOperationId)
      ) {
        return lookupJson("processing");
      }
      if (
        actorKey &&
        consumeLocalE2eFault("lookup_not_found_once", actorKey, input.saveOperationId)
      ) {
        return lookupJson("not_found");
      }
      return deps.lookup(input);
    },
  };
}
