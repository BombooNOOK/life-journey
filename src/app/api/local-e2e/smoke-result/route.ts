import { NextResponse } from "next/server";

import { assertLocalE2eHarnessRequest } from "@/lib/localE2eHarness/assertRequestLocalE2eHarness";

export const dynamic = "force-dynamic";

type SmokePayload = {
  summary?: string;
  capability?: string;
  secureIntent?: string;
  sessionEmail?: string;
  journal?: string;
};

let lastSmoke: (SmokePayload & { at: string }) | null = null;

/** Local-only smoke result sink for Simulator → host evidence. */
export async function POST(request: Request) {
  const asserted = assertLocalE2eHarnessRequest(request);
  if (!asserted.ok) return asserted.response;
  const json = (await request.json().catch(() => ({}))) as SmokePayload;
  lastSmoke = {
    at: new Date().toISOString(),
    summary: typeof json.summary === "string" ? json.summary : undefined,
    capability: typeof json.capability === "string" ? json.capability : undefined,
    secureIntent: typeof json.secureIntent === "string" ? json.secureIntent : undefined,
    sessionEmail: typeof json.sessionEmail === "string" ? json.sessionEmail : undefined,
    journal: typeof json.journal === "string" ? json.journal : undefined,
  };
  return NextResponse.json({ code: "OK" });
}

export async function GET(request: Request) {
  const asserted = assertLocalE2eHarnessRequest(request);
  if (!asserted.ok) return asserted.response;
  return NextResponse.json({ code: "OK", smoke: lastSmoke });
}
