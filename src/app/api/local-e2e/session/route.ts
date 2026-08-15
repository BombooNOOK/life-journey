import { NextResponse } from "next/server";

import { assertLocalE2eHarnessRequest } from "@/lib/localE2eHarness/assertRequestLocalE2eHarness";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const cookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  // Local harness is never production; keep Secure off for http://127.0.0.1.
  secure: false,
};

/**
 * Fixed-actor local E2E session bridge.
 * Does not accept an email from the client body (no arbitrary impersonation).
 * Actor comes only from LJD_LOCAL_E2E_ACTOR_EMAIL after all harness gates pass.
 */
export async function POST(request: Request) {
  const asserted = assertLocalE2eHarnessRequest(request);
  if (!asserted.ok) return asserted.response;

  // Ignore any client-supplied email/body fields intentionally.
  const res = NextResponse.json({
    code: "OK",
    email: asserted.actorEmail,
  });
  res.cookies.set("lj_logged_in", "1", {
    ...cookieBase,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  res.cookies.set("lj_user_email", encodeURIComponent(asserted.actorEmail), {
    ...cookieBase,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE(request: Request) {
  const asserted = assertLocalE2eHarnessRequest(request);
  if (!asserted.ok) return asserted.response;

  const res = NextResponse.json({ code: "OK" });
  res.cookies.set("lj_logged_in", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_user_email", "", { ...cookieBase, maxAge: 0 });
  return res;
}
