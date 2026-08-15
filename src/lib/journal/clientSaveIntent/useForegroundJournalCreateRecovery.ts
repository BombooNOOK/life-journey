"use client";

import { useEffect, useState } from "react";

import {
  runForegroundJournalCreateRecovery,
  type JournalCreateSaveResult,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";

export type ForegroundJournalRecoveryState =
  | { status: "idle" | "checking" }
  | { status: "completed"; entryId: string }
  | { status: "processing" }
  | { status: "failed_final"; code: "ACORN_INSUFFICIENT" | "SERVER_FAILED_FINAL" }
  | { status: "recovery_required" };

/**
 * Shared, foreground-only Journal recovery admission. Components receive a
 * compact presentation state; lookup, intent storage, and single-flight stay
 * in the application layer.
 */
export function useForegroundJournalCreateRecovery(input: {
  viewerEmail: string | null | undefined;
  onCompleted?: (entryId: string) => Promise<void>;
}): ForegroundJournalRecoveryState {
  const [state, setState] = useState<ForegroundJournalRecoveryState>({ status: "idle" });
  const viewerEmail = input.viewerEmail?.trim() ?? "";

  useEffect(() => {
    if (!viewerEmail) return;
    let cancelled = false;
    setState({ status: "checking" });
    void runForegroundJournalCreateRecovery({
      viewerEmail,
      afterServerCompleted: input.onCompleted,
    }).then((results) => {
      if (cancelled || results.length === 0) return;
      const result = results[0] as JournalCreateSaveResult;
      if (result.kind === "completed") setState({ status: "completed", entryId: result.entryId });
      else if (result.kind === "processing") setState({ status: "processing" });
      else if (result.kind === "failed_final") setState({ status: "failed_final", code: result.code });
      else setState({ status: "recovery_required" });
    });
    return () => {
      cancelled = true;
    };
  }, [input.onCompleted, viewerEmail]);

  return state;
}
