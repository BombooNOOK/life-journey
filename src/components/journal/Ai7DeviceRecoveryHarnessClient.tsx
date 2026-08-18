"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useState } from "react";

import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import {
  cleanupAi7DeviceRecoveryTestOperations,
  inspectAi7DeviceRecoveryTestOperations,
  persistAi7DeviceRecoveryTestOperation,
  recoverAi7DeviceRecoveryTestOperations,
  type Ai7InspectSnapshot,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness";
import { evaluateAi7DeviceRecoveryHarnessGate } from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/gate";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

function asDurable(store: unknown): ClientSaveDurableStore | null {
  if (
    store &&
    typeof store === "object" &&
    "persistPreparedIntentWithExactPayload" in store &&
    "loadExactPayloadBySaveOperationId" in store &&
    "deleteByActor" in store
  ) {
    return store as ClientSaveDurableStore;
  }
  return null;
}

function formatInspect(snapshot: Ai7InspectSnapshot): string {
  return snapshot.operations
    .map((row) => {
      const flags = [
        row.pending ? "pending" : null,
        row.completed ? "completed" : null,
        row.payloadPresent ? "payload_present" : "payload_absent",
        row.fingerprintVerified ? "fingerprint_verified" : "fingerprint_unverified",
        row.payloadExact ? "payload_exact" : "payload_not_exact",
      ]
        .filter(Boolean)
        .join(" · ");
      return `${row.kind}: ${row.status} · ${flags}`;
    })
    .join("\n");
}

export function Ai7DeviceRecoveryHarnessClient() {
  const [message, setMessage] = useState<string>("—");
  const [inspectText, setInspectText] = useState<string>("未実行");
  const [pendingExists, setPendingExists] = useState(false);
  const native = Capacitor.isNativePlatform();
  const gate = evaluateAi7DeviceRecoveryHarnessGate({ isNativePlatform: native });

  const withStore = useCallback(
    async (run: (store: ClientSaveDurableStore) => Promise<void>) => {
      if (!gate.operationsAllowed) {
        setMessage(`unavailable:${gate.reason}`);
        return;
      }
      const bootstrap = await initializeSaveIntentStore();
      if (bootstrap.status !== "ready") {
        setMessage(`store:${bootstrap.status}`);
        return;
      }
      const store = asDurable(bootstrap.store);
      if (!store) {
        setMessage("store_not_durable");
        return;
      }
      await run(store);
    },
    [gate.operationsAllowed, gate.reason],
  );

  const refreshInspect = useCallback(async () => {
    await withStore(async (store) => {
      const snapshot = await inspectAi7DeviceRecoveryTestOperations({ store });
      if ("kind" in snapshot && snapshot.kind === "unavailable") {
        setMessage(`unavailable:${snapshot.reason}`);
        return;
      }
      const view = snapshot as Ai7InspectSnapshot;
      setPendingExists(view.pendingTestOperationExists);
      setInspectText(formatInspect(view));
      setMessage(
        view.pendingTestOperationExists
          ? "pending test operation exists"
          : view.operations.some((row) => row.completed)
            ? "completed"
            : "no test operation",
      );
    });
  }, [withStore]);

  useEffect(() => {
    if (gate.operationsAllowed) void refreshInspect();
  }, [gate.operationsAllowed, refreshInspect]);

  if (!gate.pageAllowed) {
    return <p className="text-sm text-stone-600">この画面は利用できません。</p>;
  }

  return (
    <div className="space-y-4 text-sm text-stone-800">
      <p className="text-xs text-stone-500">
        native={String(native)} gate={gate.reason} · fake transport only · Production POST 0
      </p>
      {!gate.operationsAllowed ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
          操作は native + development/test flag のときだけ有効です（{gate.reason}）。
        </p>
      ) : null}
      <p className="rounded-md border border-stone-200 bg-white px-3 py-2">
        pending test operation exists: {pendingExists ? "yes" : "no"}
      </p>
      <pre className="overflow-auto rounded-md border border-stone-200 bg-white px-3 py-2 text-xs leading-relaxed">
        {inspectText}
      </pre>
      <div className="grid gap-2">
        <button
          type="button"
          className="rounded bg-stone-800 px-3 py-2 text-white disabled:opacity-40"
          disabled={!gate.operationsAllowed}
          onClick={() =>
            void withStore(async (store) => {
              const result = await persistAi7DeviceRecoveryTestOperation("text", { store });
              setMessage(JSON.stringify(result));
              await refreshInspect();
            })
          }
        >
          T1 Persist text
        </button>
        <button
          type="button"
          className="rounded bg-stone-800 px-3 py-2 text-white disabled:opacity-40"
          disabled={!gate.operationsAllowed}
          onClick={() =>
            void withStore(async (store) => {
              const result = await persistAi7DeviceRecoveryTestOperation("photo", { store });
              setMessage(JSON.stringify(result));
              await refreshInspect();
            })
          }
        >
          T2 Persist photo
        </button>
        <button
          type="button"
          className="rounded border border-stone-300 bg-white px-3 py-2 disabled:opacity-40"
          disabled={!gate.operationsAllowed}
          onClick={() => void refreshInspect()}
        >
          Inspect
        </button>
        <button
          type="button"
          className="rounded border border-stone-300 bg-white px-3 py-2 disabled:opacity-40"
          disabled={!gate.operationsAllowed}
          onClick={() =>
            void withStore(async (store) => {
              const result = await recoverAi7DeviceRecoveryTestOperations({ store });
              if (result.kind === "recovered") {
                setMessage(
                  `fake_recover posts=${result.postCalls} lookups=${result.lookupCalls} results=${result.results.map((row) => row.kind).join(",")}`,
                );
              } else {
                setMessage(JSON.stringify(result));
              }
              await refreshInspect();
            })
          }
        >
          Fake Recover
        </button>
        <button
          type="button"
          className="rounded border border-amber-700 px-3 py-2 text-amber-900 disabled:opacity-40"
          disabled={!gate.operationsAllowed}
          onClick={() =>
            void withStore(async (store) => {
              const result = await cleanupAi7DeviceRecoveryTestOperations({ store });
              setMessage(JSON.stringify(result));
              await refreshInspect();
            })
          }
        >
          Cleanup test operation
        </button>
      </div>
      <p className="text-xs text-stone-500">{message}</p>
    </div>
  );
}
