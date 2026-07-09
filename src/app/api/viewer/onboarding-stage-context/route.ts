import { NextResponse } from "next/server";

import { resolveOnboardingStageContextFromCookie } from "@/lib/viewer/onboardingStageContext";

export async function GET() {
  const context = await resolveOnboardingStageContextFromCookie();
  return NextResponse.json(context);
}
