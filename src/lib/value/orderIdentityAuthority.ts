/**
 * AI-X6.7B7B — Order / Kantei purchase ownership authority.
 *
 * Canonical owner: Order.identityId → AccountIdentity.id
 * KanteiBookBindingRequest: inherits via orderId → Order.identityId
 *   (orderId is soft string; no direct binding identityId required when Order FK path is used).
 *
 * Receipt/contact email on Order is historical metadata — never remapped.
 * CURRENT AUTH EMAIL ALONE NEVER grants purchase access.
 */

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { journalProfileIdsForQuery } from "@/lib/profile/activeProfile";
import {
  classifyValueObjectOwnership,
  resolveValueIdentityOwnership,
  valueDualWriteIdentityIdOrNull,
} from "@/lib/value/valueIdentityOwnership";
import {
  isP1ValueIdentityDualWriteEnabled,
  isP1ValueIdentityMutationAuthorityEnabled,
  isP1ValueIdentityReadAuthorityEnabled,
} from "@/lib/value/valueIdentityGates";

const KANTEI_ORDER_CORE_SELECT = {
  id: true,
  birthYear: true,
  birthMonth: true,
  birthDay: true,
  birthDate: true,
  numerologyJson: true,
} as const;

export const KANTEI_ORDER_BOOKSHELF_SELECT = {
  id: true,
  kanteiCode: true,
  fullNameDisplay: true,
  fullNameRomanDisplay: true,
  createdAt: true,
  pdfDownloadCount: true,
  pdfDownloadLimit: true,
} as const;

export type OrderAccessAuthResult =
  | { ok: true; identityId: string; orderId: string }
  | {
      ok: false;
      state:
        | "UNBOUND"
        | "AMBIGUOUS"
        | "MISMATCH"
        | "NOT_OWNED"
        | "NOT_FOUND"
        | "IDENTITY_UNAVAILABLE";
      reason: string;
    };

async function countActiveProfilesForIdentity(
  identityId: string,
): Promise<number> {
  return prisma.profile.count({
    where: { identityId, isArchived: false },
  });
}

export async function listKanteiOrdersForIdentity(params: {
  ownership: P0OwnershipResolution;
  profileId: string;
  take?: number;
}): Promise<
  Array<{
    id: string;
    kanteiCode: string | null;
    fullNameDisplay: string;
    fullNameRomanDisplay: string;
    createdAt: Date;
    pdfDownloadCount: number;
    pdfDownloadLimit: number;
  }>
> {
  if (params.ownership.state !== "BOUND" || !params.ownership.identityId) {
    return [];
  }
  const identityId = params.ownership.identityId;
  const take = params.take ?? 20;
  const emailMeta = params.ownership.verifiedEmailMetadata;
  const profileIds = journalProfileIdsForQuery(
    params.profileId,
    emailMeta || "identity",
  );

  const scoped = await prisma.order.findMany({
    where: {
      identityId,
      profileId: { in: profileIds },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: KANTEI_ORDER_BOOKSHELF_SELECT,
  });
  if (scoped.length > 0) return scoped;

  if ((await countActiveProfilesForIdentity(identityId)) <= 1) {
    return prisma.order.findMany({
      where: { identityId },
      orderBy: { createdAt: "desc" },
      take,
      select: KANTEI_ORDER_BOOKSHELF_SELECT,
    });
  }
  return [];
}

export async function findKanteiOrderForIdentity(params: {
  ownership: P0OwnershipResolution;
  profileId: string;
}): Promise<{
  id: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthDate: string;
  numerologyJson: string | null;
} | null> {
  if (params.ownership.state !== "BOUND" || !params.ownership.identityId) {
    return null;
  }
  const identityId = params.ownership.identityId;
  const emailMeta = params.ownership.verifiedEmailMetadata;
  const profileIds = journalProfileIdsForQuery(
    params.profileId,
    emailMeta || "identity",
  );

  const scoped = await prisma.order.findFirst({
    where: {
      identityId,
      profileId: { in: profileIds },
    },
    select: KANTEI_ORDER_CORE_SELECT,
    orderBy: { createdAt: "desc" },
  });
  if (scoped) return scoped;

  if ((await countActiveProfilesForIdentity(identityId)) <= 1) {
    return prisma.order.findFirst({
      where: { identityId },
      select: KANTEI_ORDER_CORE_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }
  return null;
}

/**
 * Direct Order ID access under identity authority.
 * Fail closed for unbound / mismatched / other-owner rows.
 */
export async function authorizeOrderIdUnderValueAuthority(input: {
  orderId: string;
  ownership?: P0OwnershipResolution;
}): Promise<OrderAccessAuthResult> {
  const ownership =
    input.ownership ?? (await resolveValueIdentityOwnership());
  if (ownership.state !== "BOUND" || !ownership.identityId) {
    if (ownership.state === "AMBIGUOUS") {
      return { ok: false, state: "AMBIGUOUS", reason: ownership.reason };
    }
    if (ownership.state === "MISMATCH") {
      return { ok: false, state: "MISMATCH", reason: ownership.reason };
    }
    return { ok: false, state: "UNBOUND", reason: ownership.reason };
  }

  const row = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, identityId: true },
  });
  if (!row) {
    return { ok: false, state: "NOT_FOUND", reason: "order_not_found" };
  }

  const objectState = classifyValueObjectOwnership({
    ownership,
    objectIdentityId: row.identityId,
  });
  if (objectState !== "BOUND") {
    return {
      ok: false,
      state: objectState === "NOT_OWNED" ? "NOT_OWNED" : objectState,
      reason: `order_${objectState.toLowerCase()}`,
    };
  }
  return { ok: true, identityId: ownership.identityId, orderId: row.id };
}

/**
 * Kantei binding access: inherit Order.identityId via orderId soft link.
 */
export async function authorizeKanteiBindingUnderValueAuthority(input: {
  bindingId: string;
  ownership?: P0OwnershipResolution;
}): Promise<OrderAccessAuthResult> {
  const ownership =
    input.ownership ?? (await resolveValueIdentityOwnership());
  if (ownership.state !== "BOUND" || !ownership.identityId) {
    if (ownership.state === "AMBIGUOUS") {
      return { ok: false, state: "AMBIGUOUS", reason: ownership.reason };
    }
    if (ownership.state === "MISMATCH") {
      return { ok: false, state: "MISMATCH", reason: ownership.reason };
    }
    return { ok: false, state: "UNBOUND", reason: ownership.reason };
  }

  const binding = await prisma.kanteiBookBindingRequest.findUnique({
    where: { id: input.bindingId },
    select: { id: true, orderId: true, email: true },
  });
  if (!binding) {
    return { ok: false, state: "NOT_FOUND", reason: "binding_not_found" };
  }

  const orderAuth = await authorizeOrderIdUnderValueAuthority({
    orderId: binding.orderId,
    ownership,
  });
  if (!orderAuth.ok) {
    return orderAuth;
  }
  return {
    ok: true,
    identityId: ownership.identityId,
    orderId: binding.orderId,
  };
}

export function orderCreateIdentityFields(input: {
  ownership: P0OwnershipResolution;
}): { identityId?: string } {
  const id = valueDualWriteIdentityIdOrNull({
    dualWriteEnabled:
      isP1ValueIdentityDualWriteEnabled() ||
      isP1ValueIdentityMutationAuthorityEnabled(),
    ownership: input.ownership,
  });
  return id ? { identityId: id } : {};
}

export function shouldUseOrderIdentityRead(): boolean {
  return isP1ValueIdentityReadAuthorityEnabled();
}

export function shouldUseOrderIdentityMutation(): boolean {
  return isP1ValueIdentityMutationAuthorityEnabled();
}

/** Legacy email check preserved for gate-OFF path callers. */
export function orderEmailMatchesViewer(
  orderEmail: string,
  viewerEmail: string,
): boolean {
  return normalizeEmail(orderEmail) === normalizeEmail(viewerEmail);
}
