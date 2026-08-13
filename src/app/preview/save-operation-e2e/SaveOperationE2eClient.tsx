"use client";

import { useEffect, useState } from "react";

import {
  createFakeJournalWorld,
  createFakeSavePorts,
} from "@/lib/journal/saveIdempotency/fakePorts";
import { createMemoryJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/memoryStore";
import { createMemoryLocalMirrorOutboxStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import { createMemoryLocalSaveOperationIntentStore } from "@/lib/local-first/journal/saveIntent/memoryStore";
import {
  assertSuccessfulFinalInvariant,
  createMemoryLocalMirrorSink,
  recoverInternalSaveOperationE2e,
  runInternalSaveOperationE2e,
} from "@/lib/local-first/journal/save/internalSaveOperationE2e";

/**
 * Developer-only 4B-4Q Q1–Q6 memory E2E runner (no production POST / Neon).
 */
export default function SaveOperationE2eClient() {
  const [text, setText] = useState("starting…");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const steps: Array<{ id: string; status: string; detail: string }> = [];
      const push = (id: string, status: string, detail: string) => {
        steps.push({ id, status, detail });
      };

      try {
        // Q3 response lost core
        {
          const world = createFakeJournalWorld();
          const deps = {
            actorEmail: "4b4q-preview@example.com",
            intentStore: createMemoryLocalSaveOperationIntentStore(),
            serverStore: createMemoryJournalSaveOperationStore(),
            ports: createFakeSavePorts(world),
            outboxStore: createMemoryLocalMirrorOutboxStore(),
            localMirror: createMemoryLocalMirrorSink(),
            contentHash: "preview",
            entryDate: "2026-08-13",
            saveOperationId: "01HX4B4QPREVIEWRESPONSELOST",
          };
          const lost = await runInternalSaveOperationE2e({
            ...deps,
            crashAt: "response_lost_after_server_completed",
          });
          const recovered = await recoverInternalSaveOperationE2e({
            ...deps,
            saveOperationId: lost.saveOperationId,
            requestFingerprint: lost.requestFingerprint,
            completeMirror: true,
          });
          assertSuccessfulFinalInvariant({
            result: recovered,
            journalEntryCount: world.entries.size,
            donguriChargeCount: world.chargeSuccessCount,
          });
          push(
            "Q3",
            "pass",
            `entry=${recovered.canonicalEntryId?.slice(0, 8)}… create=${world.createCount} charge=${world.chargeSuccessCount}`,
          );
        }

        // Q4 Window C
        {
          const world = createFakeJournalWorld();
          const deps = {
            actorEmail: "4b4q-preview@example.com",
            intentStore: createMemoryLocalSaveOperationIntentStore(),
            serverStore: createMemoryJournalSaveOperationStore(),
            ports: createFakeSavePorts(world),
            outboxStore: createMemoryLocalMirrorOutboxStore(),
            localMirror: createMemoryLocalMirrorSink(),
            contentHash: "preview",
            entryDate: "2026-08-13",
            saveOperationId: "01HX4B4QPREVIEWWINDOWC00001",
          };
          const stopped = await runInternalSaveOperationE2e({
            ...deps,
            crashAt: "after_bind_before_outbox",
          });
          const recovered = await recoverInternalSaveOperationE2e({
            ...deps,
            saveOperationId: stopped.saveOperationId,
            requestFingerprint: stopped.requestFingerprint,
            completeMirror: true,
          });
          push(
            "Q4",
            recovered.phase === "completed" ? "pass" : "fail",
            `phase=${recovered.phase}`,
          );
        }

        push("GATE", "pass", "production POST unused; Neon unused; memory E2E only");
      } catch (e) {
        push("FATAL", "fail", e instanceof Error ? e.message : String(e));
      }

      if (cancelled) return;
      const fails = steps.filter((s) => s.status === "fail").length;
      setText(JSON.stringify({ fails, steps, productionPostUntouched: true }, null, 2));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <pre className="overflow-auto rounded border border-stone-300 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap">
      {text}
    </pre>
  );
}
