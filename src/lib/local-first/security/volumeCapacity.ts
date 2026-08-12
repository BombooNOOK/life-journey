/**
 * Platform volume capacity. iOS implementation lives in the slim plugin.
 * Android can later implement the same plugin method.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity, type VolumeAvailableCapacityResult } from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export async function getVolumeAvailableCapacity(): Promise<VolumeAvailableCapacityResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "volume capacity is native-only",
    );
  }
  try {
    const result = await LjdLocalSecurity.getVolumeAvailableCapacity();
    const available =
      typeof result.availableBytes === "number" && Number.isFinite(result.availableBytes)
        ? result.availableBytes
        : null;
    return {
      ...result,
      ok: Boolean(result.ok) && available != null,
      availableBytes: available,
    };
  } catch (error) {
    throw mapSecurityError(error);
  }
}

export async function readAvailableBytesOrNull(): Promise<{
  availableBytes: number | null;
  source: string;
}> {
  try {
    const result = await getVolumeAvailableCapacity();
    return {
      availableBytes: result.ok ? result.availableBytes : null,
      source: result.source,
    };
  } catch {
    return { availableBytes: null, source: "api_error" };
  }
}
