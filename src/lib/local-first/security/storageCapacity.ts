/**
 * Storage capacity provider (Foundation).
 * Reads available bytes only. No migration reserve / source×3 policy here.
 * iOS adapter is the slim plugin; Android can implement the same method later.
 * Explicit call only — never from general app boot.
 */

import { Capacitor } from "@capacitor/core";
import {
  LjdLocalSecurity,
  type VolumeAvailableCapacityResult,
} from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type StorageCapacityReading = {
  ok: boolean;
  availableBytes: number | null;
  importantUsageBytes: number | null;
  volumeAvailableCapacity: number | null;
  opportunisticUsageBytes: number | null;
  source: string;
  platform: string;
};

export type CapacityKnownDecision = {
  known: boolean;
  availableBytes: number | null;
  reason: "ok" | "capacity_unknown_fail_closed";
};

export type StorageCapacityProvider = {
  read(): Promise<StorageCapacityReading>;
};

export function mapVolumeResultToReading(
  result: VolumeAvailableCapacityResult,
  platform = Capacitor.getPlatform(),
): StorageCapacityReading {
  const available =
    typeof result.availableBytes === "number" && Number.isFinite(result.availableBytes)
      ? result.availableBytes
      : null;
  return {
    ok: Boolean(result.ok) && available != null,
    availableBytes: available,
    importantUsageBytes:
      typeof result.importantUsageBytes === "number" ? result.importantUsageBytes : null,
    volumeAvailableCapacity:
      typeof result.volumeAvailableCapacity === "number"
        ? result.volumeAvailableCapacity
        : null,
    opportunisticUsageBytes:
      typeof result.opportunisticUsageBytes === "number"
        ? result.opportunisticUsageBytes
        : null,
    source: result.source,
    platform,
  };
}

/** Fail-closed: unknown capacity is not a green light. Policy numbers live elsewhere. */
export function decideCapacityKnown(
  availableBytes: number | null,
): CapacityKnownDecision {
  if (availableBytes == null) {
    return {
      known: false,
      availableBytes: null,
      reason: "capacity_unknown_fail_closed",
    };
  }
  return { known: true, availableBytes, reason: "ok" };
}

export async function readStorageCapacity(): Promise<StorageCapacityReading> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "storage capacity is native-only");
  }
  try {
    const result = await LjdLocalSecurity.getVolumeAvailableCapacity();
    return mapVolumeResultToReading(result);
  } catch (error) {
    throw mapSecurityError(error);
  }
}

export const pluginStorageCapacityProvider: StorageCapacityProvider = {
  read: readStorageCapacity,
};

export async function readAvailableBytesOrNull(): Promise<{
  availableBytes: number | null;
  source: string;
  platform: string;
  decision: CapacityKnownDecision;
}> {
  try {
    const reading = await pluginStorageCapacityProvider.read();
    const decision = decideCapacityKnown(reading.ok ? reading.availableBytes : null);
    return {
      availableBytes: decision.availableBytes,
      source: reading.source,
      platform: reading.platform,
      decision,
    };
  } catch {
    return {
      availableBytes: null,
      source: "api_error",
      platform: Capacitor.getPlatform(),
      decision: decideCapacityKnown(null),
    };
  }
}
