import { NextResponse } from "next/server";

import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  canCreateJournalEntry,
  canUseContinuedFeatures,
  continuedFeaturesDeniedMessage,
  resolveUserEntitlement,
  type EntitlementDenialCode,
  type UserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";

export class EntitlementDeniedError extends Error {
  readonly code: EntitlementDenialCode;
  readonly httpStatus = 403;

  constructor(code: EntitlementDenialCode, message: string) {
    super(message);
    this.name = "EntitlementDeniedError";
    this.code = code;
  }
}

export async function loadUserEntitlement(viewerEmail: string): Promise<UserEntitlement> {
  const ctx = await loadEntitlementContext(viewerEmail);
  return resolveUserEntitlement(ctx);
}

export async function requireFullAccess(viewerEmail: string): Promise<UserEntitlement> {
  const ctx = await loadEntitlementContext(viewerEmail);
  const entitlement = resolveUserEntitlement(ctx);
  if (!entitlement.canUseContinuedFeatures) {
    const code = entitlement.denialCode ?? "FREE_TRIAL_EXPIRED";
    throw new EntitlementDeniedError(code, continuedFeaturesDeniedMessage(entitlement));
  }
  return entitlement;
}

export async function requireJournalCreateAccess(viewerEmail: string): Promise<UserEntitlement> {
  const ctx = await loadEntitlementContext(viewerEmail);
  if (!canCreateJournalEntry(ctx)) {
    const entitlement = resolveUserEntitlement(ctx);
    const code = entitlement.denialCode ?? "FREE_TRIAL_EXPIRED";
    throw new EntitlementDeniedError(code, continuedFeaturesDeniedMessage(entitlement));
  }
  return resolveUserEntitlement(ctx);
}

export function entitlementDeniedResponse(error: EntitlementDeniedError) {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.httpStatus },
  );
}

export function entitlementDeniedResponseFromEntitlement(entitlement: UserEntitlement) {
  const code = entitlement.denialCode ?? "FREE_TRIAL_EXPIRED";
  return NextResponse.json(
    { error: continuedFeaturesDeniedMessage(entitlement), code },
    { status: 403 },
  );
}

export async function checkContinuedFeatures(viewerEmail: string): Promise<
  | { ok: true; entitlement: UserEntitlement }
  | { ok: false; entitlement: UserEntitlement }
> {
  const ctx = await loadEntitlementContext(viewerEmail);
  const entitlement = resolveUserEntitlement(ctx);
  if (!canUseContinuedFeatures(ctx)) {
    return { ok: false, entitlement };
  }
  return { ok: true, entitlement };
}

/** Route handler 用。制限時は 403 Response、許可時は null */
export async function assertFullAccessForApi(viewerEmail: string): Promise<NextResponse | null> {
  try {
    await requireFullAccess(viewerEmail);
    return null;
  } catch (e) {
    if (e instanceof EntitlementDeniedError) {
      return entitlementDeniedResponse(e);
    }
    throw e;
  }
}
