/**
 * Pure validation: lifecycle transitions, retirement guard, registry routing rules.
 */

import type { LocalMirrorOutboxItem } from "@/lib/local-first/journal/outbox/types";
import {
  isRoutingAllowedState,
  type GenerationLifecycleState,
  type GenerationRegistryRow,
} from "@/lib/local-first/journal/registry/types";

export type StateTransitionResult =
  | { ok: true }
  | { ok: false; reason: string };

const ALLOWED_TRANSITIONS: ReadonlyArray<{
  from: GenerationLifecycleState;
  to: GenerationLifecycleState;
}> = [
  { from: "staged", to: "ready" },
  { from: "ready", to: "technical_active" },
  { from: "technical_active", to: "previous" },
  { from: "previous", to: "retirement_blocked" },
  { from: "previous", to: "retired" },
  { from: "retirement_blocked", to: "retired" },
  { from: "staged", to: "quarantined" },
  { from: "ready", to: "quarantined" },
  { from: "technical_active", to: "quarantined" },
  { from: "previous", to: "quarantined" },
  { from: "retirement_blocked", to: "quarantined" },
];

export function validateLifecycleTransition(
  from: GenerationLifecycleState,
  to: GenerationLifecycleState,
): StateTransitionResult {
  if (from === to) return { ok: true };
  const allowed = ALLOWED_TRANSITIONS.some((t) => t.from === from && t.to === to);
  if (!allowed) {
    return { ok: false, reason: `transition_forbidden:${from}->${to}` };
  }
  return { ok: true };
}

export function isIntegrityRoutingBlocked(
  integrityStatus: GenerationRegistryRow["integrityStatus"],
): boolean {
  return integrityStatus === "failed";
}

export function validateRegistryRoutingState(
  row: GenerationRegistryRow,
): StateTransitionResult {
  if (isIntegrityRoutingBlocked(row.integrityStatus)) {
    return { ok: false, reason: "integrity_failed" };
  }
  if (row.lifecycleState === "quarantined") {
    return { ok: false, reason: "quarantined" };
  }
  if (row.lifecycleState === "retired") {
    return { ok: false, reason: "retired" };
  }
  if (!isRoutingAllowedState(row.lifecycleState)) {
    return { ok: false, reason: `routing_forbidden:${row.lifecycleState}` };
  }
  return { ok: true };
}

export type RetirementGuardResult =
  | { ok: true }
  | { ok: false; reason: "active" | "outstanding_outbox" | "quarantined" | "integrity_failed" };

export function canRetireGeneration(input: {
  row: GenerationRegistryRow;
  outstandingOutboxCount: number;
  isManifestActive?: boolean;
}): RetirementGuardResult {
  if (input.isManifestActive) {
    return { ok: false, reason: "active" };
  }
  if (input.row.lifecycleState === "technical_active") {
    return { ok: false, reason: "active" };
  }
  if (input.row.lifecycleState === "quarantined") {
    return { ok: false, reason: "quarantined" };
  }
  if (input.row.integrityStatus === "failed") {
    return { ok: false, reason: "integrity_failed" };
  }
  if (input.outstandingOutboxCount > 0) {
    return { ok: false, reason: "outstanding_outbox" };
  }
  return { ok: true };
}

export const OUTSTANDING_OUTBOX_RESULTS = [
  null,
  "retry_needed",
  "attention_required",
] as const;

export function isOutstandingOutboxItem(item: LocalMirrorOutboxItem): boolean {
  return (OUTSTANDING_OUTBOX_RESULTS as readonly (string | null)[]).includes(
    item.lastResult,
  );
}

export function countOutstandingOutboxForDatabaseId(
  items: readonly LocalMirrorOutboxItem[],
  databaseId: string,
): number {
  return items.filter(
    (item) =>
      item.targetDatabaseId === databaseId && isOutstandingOutboxItem(item),
  ).length;
}

export function countOutstandingOutboxForGenerationId(
  items: readonly LocalMirrorOutboxItem[],
  generationId: string,
): number {
  return items.filter(
    (item) =>
      item.targetGenerationId === generationId && isOutstandingOutboxItem(item),
  ).length;
}

export function validateActiveUniqueness(
  rows: readonly GenerationRegistryRow[],
): StateTransitionResult {
  const activeCount = rows.filter(
    (r) => r.lifecycleState === "technical_active",
  ).length;
  if (activeCount > 1) {
    return { ok: false, reason: "multiple_technical_active" };
  }
  return { ok: true };
}
