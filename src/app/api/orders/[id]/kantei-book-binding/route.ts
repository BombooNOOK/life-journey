import { NextResponse } from "next/server";

import { BASE_KANTEI_BOOK_URL } from "@/lib/commerce/baseUrls";
import { createOrReusePendingKanteiBookBindingRequest } from "@/lib/commerce/createKanteiBookBindingRequest";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewerEmail = normalizeEmail(await getViewerEmailFromCookie());
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await createOrReusePendingKanteiBookBindingRequest({
    orderId: id,
    viewerEmail,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    requestId: result.requestId,
    reused: result.reused,
    baseShopUrl: BASE_KANTEI_BOOK_URL,
  });
}
