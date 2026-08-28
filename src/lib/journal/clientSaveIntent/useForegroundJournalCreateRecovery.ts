"use client";

import { useCallback, useEffect, useState } from "react";

import {
  continueCurrentSessionJournalCreateSaveRecovery,
  runForegroundJournalCreateRecovery,
  type JournalCreateSaveResult,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";

export type ForegroundJournalRecoveryState =
  | { status: "idle" | "checking" }
  | { status: "completed"; entryId: string }
  | { status: "pending" }
  | { status: "processing" }
  | { status: "continuation_available"; saveOperationId: string }
  | { status: "failed_final"; code: "ACORN_INSUFFICIENT" | "SERVER_FAILED_FINAL" }
  | { status: "recovery_required" };

/**
 * Shared, foreground-only Journal recovery admission. Components receive a
 * compact presentation state; lookup, intent storage, and single-flight stay
 * in the application layer.
 */
export function useForegroundJournalCreateRecovery(input: {
  viewerEmail: string | null | undefined;
  firebaseUid?: string | null;
  authLoading?: boolean;
  onCompleted?: (entryId: string) => Promise<void>;
  revision?: number;
}): ForegroundJournalRecoveryState & { continueSave: () => Promise<void> } {
  const [state, setState] = useState<ForegroundJournalRecoveryState>({ status: "idle" });
  const viewerEmail = input.viewerEmail?.trim() ?? "";
  const firebaseUid = input.firebaseUid?.trim() ?? null;
  const authLoading = input.authLoading ?? false;

  useEffect(() => {
    if (authLoading || !viewerEmail) return;
    let cancelled = false;
    setState({ status: "checking" });
    void runForegroundJournalCreateRecovery({
      viewerEmail,
      firebaseUid,
      afterServerCompleted: input.onCompleted,
    }).then((results) => {
      if (cancelled) return;
      if (results.length === 0) {
        setState({ status: "idle" });
        return;
      }
      const result = results[0] as JournalCreateSaveResult;
      if (result.kind === "completed") setState({ status: "completed", entryId: result.entryId });
      else if (result.kind === "pending") setState({ status: "pending" });
      else if (result.kind === "processing") setState({ status: "processing" });
      else if (result.kind === "continuation_available") {
        setState({ status: "continuation_available", saveOperationId: result.intent.saveOperationId });
      }
      else if (result.kind === "failed_final") setState({ status: "failed_final", code: result.code });
      else setState({ status: "recovery_required" });
    }, () => {
      // Never leave the viewer on an endless "checking" state.
      if (!cancelled) setState({ status: "recovery_required" });
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, firebaseUid, input.onCompleted, input.revision, viewerEmail]);

  const continueSave = useCallback(async () => {
    if (!viewerEmail || state.status !== "continuation_available") return;
    const result = await continueCurrentSessionJournalCreateSaveRecovery({
      viewerEmail,
      firebaseUid,
      saveOperationId: state.saveOperationId,
      afterServerCompleted: input.onCompleted,
    });
    if (result.kind === "completed") setState({ status: "completed", entryId: result.entryId });
    else if (result.kind === "pending") setState({ status: "pending" });
    else if (result.kind === "processing") setState({ status: "processing" });
    else if (result.kind === "failed_final") setState({ status: "failed_final", code: result.code });
    else setState({ status: "recovery_required" });
  }, [firebaseUid, input.onCompleted, state, viewerEmail]);

  return { ...state, continueSave };
}
