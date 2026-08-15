import { NextResponse } from "next/server";

import { evaluateLocalE2eHarnessGate, requestHostFromHeaders } from "@/lib/localE2eHarness/gate";

export const dynamic = "force-dynamic";

/** Read-only gate status. Never returns secrets. 404 when harness is unavailable. */
export async function GET(request: Request) {
  const gate = evaluateLocalE2eHarnessGate({
    requestHost: requestHostFromHeaders(request.headers),
  });
  if (!gate.ok) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json({
    code: "OK",
    harness: true,
    reason: gate.reason,
    actorEmail: gate.actorEmail,
    db: {
      host: gate.db.host,
      port: gate.db.port,
      database: gate.db.database,
    },
  });
}
