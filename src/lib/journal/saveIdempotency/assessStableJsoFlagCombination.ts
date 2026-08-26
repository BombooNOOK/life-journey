/**
 * Configuration safety for stable JSO write vs recovery flags (AI-X6.4).
 *
 * write ON + recovery OFF strands firebase:<UID> rows from recovery.
 * This helper reports the combination; it does NOT force recovery ON.
 */

import { isStableJsoRecoveryEnabled } from "@/lib/journal/saveIdempotency/stableJsoRecoveryGate";
import { isStableJsoWriteAuthorityEnabled } from "@/lib/journal/saveIdempotency/stableJsoWriteAuthorityGate";

export type StableJsoFlagCombination =
  | { status: "ok"; writeEnabled: boolean; recoveryEnabled: boolean }
  | {
      status: "unsafe";
      reason: "stable_write_without_recovery";
      writeEnabled: true;
      recoveryEnabled: false;
    };

export function assessStableJsoFlagCombination(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): StableJsoFlagCombination {
  const writeEnabled = isStableJsoWriteAuthorityEnabled(env);
  const recoveryEnabled = isStableJsoRecoveryEnabled(env);
  if (writeEnabled && !recoveryEnabled) {
    return {
      status: "unsafe",
      reason: "stable_write_without_recovery",
      writeEnabled: true,
      recoveryEnabled: false,
    };
  }
  return { status: "ok", writeEnabled, recoveryEnabled };
}
