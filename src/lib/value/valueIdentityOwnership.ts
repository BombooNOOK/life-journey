/**
 * AI-X6.7B7B — Canonical value/commerce person authority.
 *
 * Durable owner: AccountIdentity.id
 * Email: contact / receipt / historical transaction metadata only
 * ProfileId: optional product/context dimension only
 *
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT VALUE AUTHORITY.
 *
 * States: BOUND | UNBOUND | AMBIGUOUS | MISMATCH | NOT_OWNED
 */

import {
  resolveP0IdentityOwnership,
  type P0OwnershipResolution,
  type P0OwnershipResolverDeps,
} from "@/lib/account/p0IdentityOwnership";
import { dualWriteIdentityIdOrNull } from "@/lib/account/p0IdentityOwnership";

export type ValueOwnershipState =
  | "BOUND"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "MISMATCH"
  | "NOT_OWNED";

export type ValueOwnershipResolution = P0OwnershipResolution & {
  /** Explicit NOT_OWNED when comparing object identityId ≠ viewer identityId. */
  objectState?: "NOT_OWNED" | "MATCH" | "LEGACY_NULL";
};

export async function resolveValueIdentityOwnership(
  deps: P0OwnershipResolverDeps = {},
): Promise<P0OwnershipResolution> {
  return resolveP0IdentityOwnership(deps);
}

export function valueDualWriteIdentityIdOrNull(input: {
  dualWriteEnabled: boolean;
  ownership: P0OwnershipResolution;
}): string | null {
  return dualWriteIdentityIdOrNull(input);
}

/**
 * Classify object ownership vs viewer identity.
 * Legacy null identityId is not owned by current email alone.
 */
export function classifyValueObjectOwnership(input: {
  ownership: P0OwnershipResolution;
  objectIdentityId: string | null | undefined;
}): ValueOwnershipState {
  if (input.ownership.state !== "BOUND" || !input.ownership.identityId) {
    if (input.ownership.state === "AMBIGUOUS") return "AMBIGUOUS";
    if (input.ownership.state === "MISMATCH") return "MISMATCH";
    return "UNBOUND";
  }
  if (
    input.objectIdentityId == null ||
    input.objectIdentityId === ""
  ) {
    // Unbound historical row — fail closed for access/spend (not email claimable).
    return "NOT_OWNED";
  }
  if (input.objectIdentityId === input.ownership.identityId) {
    return "BOUND";
  }
  return "NOT_OWNED";
}
