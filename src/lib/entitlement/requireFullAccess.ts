import { NextResponse } from "next/server";

import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
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

/** 試用期限なし。ログイン済みなら常に許可（将来の制限用にフックは残す） */
export async function requireFullAccess(viewerEmail: string): Promise<UserEntitlement> {
  return loadUserEntitlement(viewerEmail);
}

export async function requireKanteiOrderAccess(viewerEmail: string): Promise<UserEntitlement> {
  return loadUserEntitlement(viewerEmail);
}

export async function requireJournalCreateAccess(viewerEmail: string): Promise<UserEntitlement> {
  return loadUserEntitlement(viewerEmail);
}

export function entitlementDeniedResponse(error: EntitlementDeniedError) {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.httpStatus },
  );
}

export function entitlementDeniedResponseFromEntitlement(entitlement: UserEntitlement) {
  return NextResponse.json(
    {
      error: entitlement.denialMessage ?? "この操作はご利用いただけません。",
      code: entitlement.denialCode ?? "FREE_TRIAL_EXPIRED",
    },
    { status: 403 },
  );
}

export async function checkContinuedFeatures(viewerEmail: string): Promise<
  | { ok: true; entitlement: UserEntitlement }
  | { ok: false; entitlement: UserEntitlement }
> {
  const entitlement = await loadUserEntitlement(viewerEmail);
  if (!entitlement.canUseContinuedFeatures) {
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

export async function assertKanteiOrderAccessForApi(viewerEmail: string): Promise<NextResponse | null> {
  try {
    await requireKanteiOrderAccess(viewerEmail);
    return null;
  } catch (e) {
    if (e instanceof EntitlementDeniedError) {
      return entitlementDeniedResponse(e);
    }
    throw e;
  }
}
