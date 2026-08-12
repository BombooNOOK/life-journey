/**
 * Routing preconditions for internal save mirror (4B-4L).
 * manifest valid + registry row + pair match + technical_active + integrity + encrypted preflight.
 * Fail-closed — no silent fallback to plaintext actual DB or candidate name alone.
 */

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { resolveLocalJournalGenerationTargetWithRegistryValidation } from "@/lib/local-first/journal/registry/resolveWithRegistryValidation";
import type { GenerationRegistryRow } from "@/lib/local-first/journal/registry/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { readAvailableBytesOrNull } from "@/lib/local-first/security";

export type SaveMirrorRoutingPreconditionOutcome =
  | {
      ok: true;
      target: ResolvedLocalJournalGeneration;
      registryRow: GenerationRegistryRow;
      availableBytes: number | null;
    }
  | {
      ok: false;
      reason: string;
      detail: string;
    };

export async function assertSaveMirrorRoutingPreconditions(options?: {
  allowUnknownCapacity?: boolean;
}): Promise<SaveMirrorRoutingPreconditionOutcome> {
  const inspection = await LocalJournalSecureBootstrapper.inspect();
  if (
    !inspection.exists ||
    !inspection.encrypted ||
    inspection.health.status !== "ready"
  ) {
    return {
      ok: false,
      reason: "candidate_preflight_failed",
      detail: inspection.health.status,
    };
  }

  const resolved = await resolveLocalJournalGenerationTargetWithRegistryValidation({
    allowUnknownCapacity: options?.allowUnknownCapacity ?? true,
  });
  if (!resolved.ok) {
    return {
      ok: false,
      reason: resolved.reason,
      detail: resolved.detail,
    };
  }

  const { availableBytes } = await readAvailableBytesOrNull();
  return {
    ok: true,
    target: resolved.target,
    registryRow: resolved.registryRow,
    availableBytes,
  };
}
