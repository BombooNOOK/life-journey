import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";

export const dynamic = "force-dynamic";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログインが必要です。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const ctx = await loadEntitlementContext(viewerEmail);
  const entitlement = resolveUserEntitlement(ctx);

  return NextResponse.json(
    {
      entitlement: serializeUserEntitlement(entitlement),
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
