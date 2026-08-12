/**
 * Routing preconditions for internal save mirror (4B-4L).
 * manifest valid + registry row + pair match + technical_active + integrity + encrypted preflight.
 * Fail-closed — no silent fallback to plaintext actual DB or candidate name alone.
 */

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { resolveLocalJournalGenerationTargetWithRegistryValidation } from "@/lib/local-first/journal/registry/resolveWithRegistryValidation";
import type { GenerationRegistryRow } from "@/lib/local-first/journal/registry/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import {
  ensurePluginEncryptionSecret,
  readAvailableBytesOrNull,
} from "@/lib/local-first/security";

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
  try {
    await ensurePluginEncryptionSecret();
  } catch {
    /* inspect will surface encryption issues */
  }
  let inspection = await LocalJournalSecureBootstrapper.inspect();
  // Bounded retry (exactly one): only when health.reason === "encryption_unknown"
  // (transient SQLite plugin settle). Any other abnormal / still-unknown after retry
  // → fail-closed below. Never falls back to plaintext actual DB; does not loosen
  // production readiness (still requires exists + encrypted === true + ready).
  if (
    inspection.health.status === "abnormal" &&
    inspection.health.reason === "encryption_unknown"
  ) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    inspection = await LocalJournalSecureBootstrapper.inspect();
  }
  if (
    !inspection.exists ||
    inspection.encrypted !== true ||
    inspection.health.status !== "ready"
  ) {
    return {
      ok: false,
      reason: "candidate_preflight_failed",
      detail: `${inspection.health.status}:${inspection.health.reason ?? "unknown"}`,
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
