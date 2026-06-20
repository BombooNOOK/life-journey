import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { resolveAboutCtaAudience } from "@/lib/viewer/aboutCtaAudience";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  const audience = await resolveAboutCtaAudience(viewerEmail);
  return NextResponse.json(audience);
}
