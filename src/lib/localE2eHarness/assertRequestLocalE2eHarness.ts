import { NextResponse } from "next/server";

import {
  evaluateLocalE2eHarnessGate,
  requestHostFromHeaders,
} from "@/lib/localE2eHarness/gate";

/**
 * Assert harness gates for a local-e2e API request.
 * On failure returns a 404 response (route appears absent outside local harness).
 */
export function assertLocalE2eHarnessRequest(request: Request):
  | { ok: true; actorEmail: string }
  | { ok: false; response: NextResponse } {
  const gate = evaluateLocalE2eHarnessGate({
    requestHost: requestHostFromHeaders(request.headers),
  });
  if (!gate.ok || !gate.actorEmail) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not Found" }, { status: 404 }),
    };
  }
  return { ok: true, actorEmail: gate.actorEmail };
}
