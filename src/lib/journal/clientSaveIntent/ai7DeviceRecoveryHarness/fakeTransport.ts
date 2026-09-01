/**
 * In-process fake journal transport for the AI-7 device harness.
 *
 * Structurally cannot reach Production, Preview, hosted dashboards, or loopback
 * HTTP: no fetch, no URL. Callers must inject this adapter instead of the
 * production orchestrator transport.
 */

import type {
  JournalCreatePayload,
  JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import type { ClientSaveIntentStoreBootstrapResult } from "@/lib/journal/clientSaveIntent/types";

export type Ai7FakePostedRecord = {
  saveOperationId: string;
  requestFingerprint: string;
  requestJson: string;
  entryId: string;
};

export type Ai7FakeJournalTransport = {
  postCalls: number;
  lookupCalls: number;
  posts: Ai7FakePostedRecord[];
  post: JournalCreateSaveOrchestratorDeps["post"];
  postExactJson: NonNullable<JournalCreateSaveOrchestratorDeps["postExactJson"]>;
  lookup: JournalCreateSaveOrchestratorDeps["lookup"];
  capability: JournalCreateSaveOrchestratorDeps["capability"];
};

function parseBody(input: string | JournalCreatePayload): {
  saveOperationId: string;
  requestFingerprint: string;
  requestJson: string;
} {
  const requestJson = typeof input === "string" ? input : JSON.stringify(input);
  let saveOperationId = "";
  try {
    const parsed = JSON.parse(requestJson) as { saveOperationId?: unknown };
    saveOperationId =
      typeof parsed.saveOperationId === "string" ? parsed.saveOperationId : "";
  } catch {
    saveOperationId = "";
  }
  return {
    saveOperationId,
    requestFingerprint: `ai7-fake:${saveOperationId}`,
    requestJson,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Simulated server: first lookup is not_found until a fake POST lands,
 * then lookup returns completed. Never touches a network.
 */
export function createAi7FakeJournalTransport(): Ai7FakeJournalTransport {
  const byOperation = new Map<string, Ai7FakePostedRecord>();
  const transport: Ai7FakeJournalTransport = {
    postCalls: 0,
    lookupCalls: 0,
    posts: [],
    capability: async () => ({ kind: "enabled" as const }),
    async post(payload) {
      return transport.postExactJson(JSON.stringify(payload));
    },
    async postExactJson(requestJson) {
      transport.postCalls += 1;
      const parsed = parseBody(requestJson);
      const existing = byOperation.get(parsed.saveOperationId);
      if (existing) {
        transport.posts.push(existing);
        return jsonResponse({ entry: { id: existing.entryId } });
      }
      const record: Ai7FakePostedRecord = {
        ...parsed,
        entryId: `ai7_sim_entry_${byOperation.size + 1}`,
      };
      byOperation.set(parsed.saveOperationId, record);
      transport.posts.push(record);
      return jsonResponse({ entry: { id: record.entryId } });
    },
    async lookup(input) {
      transport.lookupCalls += 1;
      const found = byOperation.get(input.saveOperationId);
      if (!found) {
        return jsonResponse({ state: "not_found" });
      }
      return jsonResponse({
        state: "completed",
        entryId: found.entryId,
      });
    },
  };
  return transport;
}

export function createAi7FakeOrchestratorDeps(
  bootstrap: () => Promise<ClientSaveIntentStoreBootstrapResult>,
  transport: Ai7FakeJournalTransport = createAi7FakeJournalTransport(),
): JournalCreateSaveOrchestratorDeps & { fake: Ai7FakeJournalTransport } {
  return {
    bootstrap,
    capability: transport.capability,
    post: transport.post,
    postExactJson: transport.postExactJson,
    lookup: transport.lookup,
    fake: transport,
  };
}
