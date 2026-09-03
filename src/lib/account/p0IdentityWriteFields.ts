/**
 * AI-X6.7B3/B5 — Optional identityId field for P0 creates.
 * Dual-write gate controls writing identityId.
 * Mutation authority gate (B5) authorizes profile ownership before create.
 */

import {
  decideP0AccountSettingsDualWrite,
  decideP0JournalDualWrite,
  decideP0ProfileDualWrite,
} from "@/lib/account/p0IdentityDualWrite";
import { isP0IdentityDualWriteEnabled } from "@/lib/account/p0IdentityDualWriteGate";
import {
  authorizeJournalCreateUnderProfile,
} from "@/lib/account/p0IdentityMutationAuthority";
import { isP0IdentityMutationAuthorityEnabled } from "@/lib/account/p0IdentityMutationAuthorityGate";
import {
  resolveP0IdentityOwnership,
  type P0OwnershipResolverDeps,
} from "@/lib/account/p0IdentityOwnership";
import { prisma as defaultPrisma } from "@/lib/db";

export async function resolveP0ProfileCreateIdentityFields(
  deps: P0OwnershipResolverDeps = {},
): Promise<{ identityId?: string }> {
  if (!isP0IdentityDualWriteEnabled()) return {};
  const ownership = await resolveP0IdentityOwnership(deps);
  const decision = decideP0ProfileDualWrite({ ownership, dualWriteEnabled: true });
  if (decision.action === "write_identity") {
    return { identityId: decision.identityId };
  }
  return {};
}

export type P0JournalCreateIdentityFields =
  | { identityId?: string }
  | { forbidden: true };

export async function resolveP0JournalCreateIdentityFields(input: {
  profileId: string;
  deps?: P0OwnershipResolverDeps;
  db?: typeof defaultPrisma;
}): Promise<P0JournalCreateIdentityFields> {
  const ownership = await resolveP0IdentityOwnership(input.deps ?? {});

  if (isP0IdentityMutationAuthorityEnabled()) {
    const authz = await authorizeJournalCreateUnderProfile({
      ownership,
      profileId: input.profileId,
      db: input.db,
    });
    if (authz.state !== "AUTHORIZED") {
      return { forbidden: true };
    }
  }

  if (!isP0IdentityDualWriteEnabled()) return {};
  const db = input.db ?? defaultPrisma;
  const profile = await db.profile.findUnique({
    where: { id: input.profileId },
    select: { identityId: true },
  });
  const decision = decideP0JournalDualWrite({
    ownership,
    profileIdentityId: profile?.identityId,
    dualWriteEnabled: true,
  });
  if (decision.action === "write_identity") {
    return { identityId: decision.identityId };
  }
  return {};
}

export async function resolveP0AccountSettingsCreateIdentityFields(
  deps: P0OwnershipResolverDeps = {},
): Promise<{ identityId?: string }> {
  if (!isP0IdentityDualWriteEnabled()) return {};
  const ownership = await resolveP0IdentityOwnership(deps);
  const decision = decideP0AccountSettingsDualWrite({
    ownership,
    dualWriteEnabled: true,
  });
  if (decision.action === "write_identity") {
    return { identityId: decision.identityId };
  }
  return {};
}
