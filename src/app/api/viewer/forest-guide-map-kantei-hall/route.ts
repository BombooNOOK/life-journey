import { NextResponse } from "next/server";

import { forestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { resolveForestGuideMapKanteiHallContext } from "@/lib/viewer/forestGuideMapKanteiHallContext";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  const { branch } = await resolveForestGuideMapKanteiHallContext(viewerEmail);
  const link = forestGuideMapKanteiHallLink(branch);
  return NextResponse.json({ branch, ...link });
}
