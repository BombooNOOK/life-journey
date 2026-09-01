/**
 * Offline Capacitor local-assets entry for the AI-7 isolated recovery harness.
 * Bundled into capacitor-www/ai7-recovery.js — not the production Next app.
 */

import { Capacitor } from "@capacitor/core";

import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import {
  cleanupAi7DeviceRecoveryTestOperations,
  inspectAi7DeviceRecoveryTestOperations,
  persistAi7DeviceRecoveryTestOperation,
  recoverAi7DeviceRecoveryTestOperations,
  type Ai7InspectSnapshot,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/controller";
import { evaluateAi7DeviceRecoveryHarnessGate } from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/gate";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function asDurable(store: unknown): ClientSaveDurableStore | null {
  if (
    store &&
    typeof store === "object" &&
    "persistPreparedIntentWithExactPayload" in store
  ) {
    return store as ClientSaveDurableStore;
  }
  return null;
}

function formatInspect(snapshot: Ai7InspectSnapshot): string {
  const pending = snapshot.pendingTestOperationExists ? "yes" : "no";
  const lines = snapshot.operations.map((row) => {
    return [
      row.kind,
      `status=${row.status}`,
      row.pending ? "pending" : null,
      row.completed ? "completed" : null,
      row.payloadPresent ? "payload_present" : "payload_absent",
      row.fingerprintVerified ? "fingerprint_verified" : "fingerprint_unverified",
      row.payloadExact ? "payload_exact" : "payload_not_exact",
    ]
      .filter(Boolean)
      .join(" ");
  });
  return `pending test operation exists: ${pending}\n${lines.join("\n")}`;
}

async function boot(): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const gate = evaluateAi7DeviceRecoveryHarnessGate({ isNativePlatform: native });
  $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(native)} gate=${gate.reason}`;

  const setStatus = (text: string, isError = false) => {
    const el = $("status");
    el.textContent = text;
    el.className = isError ? "status err" : "status ok";
  };

  if (!gate.pageAllowed) {
    setStatus("harness unavailable", true);
    return;
  }
  if (!gate.operationsAllowed) {
    setStatus(`operations unavailable: ${gate.reason}`, true);
    return;
  }

  const storeFromBootstrap = async (): Promise<ClientSaveDurableStore> => {
    const bootstrap = await initializeSaveIntentStore();
    if (bootstrap.status !== "ready") {
      throw new Error(`store:${bootstrap.status}`);
    }
    const store = asDurable(bootstrap.store);
    if (!store) throw new Error("store_not_durable");
    return store;
  };

  const refresh = async () => {
    const snapshot = await inspectAi7DeviceRecoveryTestOperations({
      store: await storeFromBootstrap(),
    });
    if ("kind" in snapshot && snapshot.kind === "unavailable") {
      setStatus(`unavailable:${snapshot.reason}`, true);
      return;
    }
    $("inspect").textContent = formatInspect(snapshot as Ai7InspectSnapshot);
    const view = snapshot as Ai7InspectSnapshot;
    setStatus(
      view.pendingTestOperationExists
        ? "pending test operation exists"
        : view.operations.some((row) => row.completed)
          ? "completed"
          : "no test operation",
    );
  };

  $("btn-text").addEventListener("click", () => {
    void (async () => {
      const result = await persistAi7DeviceRecoveryTestOperation("text", {
        store: await storeFromBootstrap(),
      });
      setStatus(JSON.stringify(result), result.kind !== "persisted");
      await refresh();
    })().catch((error) => setStatus(String(error), true));
  });
  $("btn-photo").addEventListener("click", () => {
    void (async () => {
      const result = await persistAi7DeviceRecoveryTestOperation("photo", {
        store: await storeFromBootstrap(),
      });
      setStatus(JSON.stringify(result), result.kind !== "persisted");
      await refresh();
    })().catch((error) => setStatus(String(error), true));
  });
  $("btn-inspect").addEventListener("click", () => {
    void refresh().catch((error) => setStatus(String(error), true));
  });
  $("btn-recover").addEventListener("click", () => {
    void (async () => {
      const result = await recoverAi7DeviceRecoveryTestOperations({
        store: await storeFromBootstrap(),
      });
      if (result.kind === "recovered") {
        setStatus(
          `fake_recover posts=${result.postCalls} lookups=${result.lookupCalls}`,
        );
      } else {
        setStatus(JSON.stringify(result), true);
      }
      await refresh();
    })().catch((error) => setStatus(String(error), true));
  });
  $("btn-cleanup").addEventListener("click", () => {
    void (async () => {
      const result = await cleanupAi7DeviceRecoveryTestOperations({
        store: await storeFromBootstrap(),
      });
      setStatus(JSON.stringify(result), result.kind !== "cleaned");
      await refresh();
    })().catch((error) => setStatus(String(error), true));
  });

  await refresh();
}

void boot();
