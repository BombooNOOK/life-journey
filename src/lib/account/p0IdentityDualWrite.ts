/**
 * AI-X6.7B3 — Bound-only dual-write field helpers for P0 creates.
 * Default: gate OFF → identityId omitted (null).
 */

import {
  checkProfileIdentityForDualWrite,
  dualWriteIdentityIdOrNull,
  type P0OwnershipResolution,
} from "@/lib/account/p0IdentityOwnership";
import { isP0IdentityDualWriteEnabled } from "@/lib/account/p0IdentityDualWriteGate";

export type P0DualWriteDecision =
  | {
      action: "write_identity";
      identityId: string;
      reason: string;
    }
  | {
      action: "legacy_null";
      identityId: null;
      reason: string;
    }
  | {
      action: "hold";
      identityId: null;
      reason: string;
    };

/**
 * Decide identityId for a NEW Profile create.
 * UNBOUND/AMBIGUOUS/MISMATCH → legacy_null (compat write, no invent).
 */
export function decideP0ProfileDualWrite(input: {
  ownership: P0OwnershipResolution;
  dualWriteEnabled?: boolean;
}): P0DualWriteDecision {
  const enabled =
    input.dualWriteEnabled ?? isP0IdentityDualWriteEnabled();
  const id = dualWriteIdentityIdOrNull({
    dualWriteEnabled: enabled,
    ownership: input.ownership,
  });
  if (id) {
    return {
      action: "write_identity",
      identityId: id,
      reason: "bound_dual_write",
    };
  }
  if (!enabled) {
    return {
      action: "legacy_null",
      identityId: null,
      reason: "dual_write_gate_off",
    };
  }
  return {
    action: "legacy_null",
    identityId: null,
    reason: `ownership_${input.ownership.state.toLowerCase()}`,
  };
}

/**
 * Decide identityId for a NEW JournalEntry create.
 * Profile.identityId mismatch → HOLD (fail closed for identity dual-write;
 * caller may still write legacy-null row).
 */
export function decideP0JournalDualWrite(input: {
  ownership: P0OwnershipResolution;
  profileIdentityId: string | null | undefined;
  dualWriteEnabled?: boolean;
}): P0DualWriteDecision {
  const enabled =
    input.dualWriteEnabled ?? isP0IdentityDualWriteEnabled();
  if (!enabled) {
    return {
      action: "legacy_null",
      identityId: null,
      reason: "dual_write_gate_off",
    };
  }
  const id = dualWriteIdentityIdOrNull({
    dualWriteEnabled: true,
    ownership: input.ownership,
  });
  if (!id) {
    return {
      action: "legacy_null",
      identityId: null,
      reason: `ownership_${input.ownership.state.toLowerCase()}`,
    };
  }
  const check = checkProfileIdentityForDualWrite({
    resolvedIdentityId: id,
    profileIdentityId: input.profileIdentityId,
  });
  if (!check.ok) {
    return {
      action: "hold",
      identityId: null,
      reason: check.reason,
    };
  }
  return {
    action: "write_identity",
    identityId: id,
    reason: "bound_dual_write_profile_ok",
  };
}

/**
 * AccountSettings create/update: bind identityId only when BOUND and gate ON.
 * Email remains mutable contact/compat metadata.
 */
export function decideP0AccountSettingsDualWrite(input: {
  ownership: P0OwnershipResolution;
  dualWriteEnabled?: boolean;
}): P0DualWriteDecision {
  return decideP0ProfileDualWrite(input);
}
