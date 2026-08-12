/**
 * Application-layer results for internal save mirror wiring (4B-4L).
 * Distinct from Server save success/failure — never mix in UI messaging.
 */

import type { OutboxLastResult } from "@/lib/local-first/journal/outbox/types";

export const SAVE_WIRING_TEST_TAG = "#SaveWiringTest" as const;

/** Simulator file: one-line server entry id for #SaveWiringTest live PoC. */
export const SAVE_WIRING_POC_ENTRY_ID_PATH =
  "ljd/security-poc/save-wiring-test-entry-id.txt" as const;

export type ConfirmedServerJournalMirrorInput = {
  serverEntryId: string;
  /** Developer/PoC only — never set from production UI save handlers. */
  developer?: {
    /** Model SERVER_SUCCESS_TO_OUTBOX_GAP: enqueue skipped entirely. */
    simulateCrashBeforeEnqueue?: boolean;
    /** Force Local mirror failure after durable enqueue (before Local save). */
    injectLocalFailureAfterEnqueue?: "save" | "media_write";
  };
};

export type ConfirmedServerJournalMirrorResult =
  | { status: "disabled"; serverEntryId: string }
  | {
      status: "routing_unavailable";
      serverEntryId: string;
      reason: string;
      detail: string;
    }
  | {
      status: "mirrored";
      serverEntryId: string;
      outboxItemId: string;
    }
  | {
      status: "already_present";
      serverEntryId: string;
      outboxItemId: string;
    }
  | {
      status: "queued_retry";
      serverEntryId: string;
      outboxItemId: string | null;
      lastResult: OutboxLastResult | "not_enqueued";
      detail: string;
    }
  | {
      status: "attention_required";
      serverEntryId: string;
      outboxItemId: string;
      detail: string;
    };

export type RetryPendingServerJournalMirrorInput = {
  outboxItemId?: string;
  serverEntryId?: string;
  injectLocalFailure?: "save" | "media_write" | false;
};
