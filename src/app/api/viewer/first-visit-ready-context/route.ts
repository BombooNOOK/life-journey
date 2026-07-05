import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { resolveFirstVisitReadyContext } from "@/lib/viewer/firstVisitReadyContext";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  const context = await resolveFirstVisitReadyContext(viewerEmail);
  return NextResponse.json(context);
}
