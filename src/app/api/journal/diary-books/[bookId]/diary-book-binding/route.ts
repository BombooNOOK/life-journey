import { NextResponse } from "next/server";

import {
  createOrReusePendingDiaryBookBindingForBook,
  getPendingDiaryBookBindingForBook,
} from "@/lib/commerce/createDiaryBookBindingRequestForBook";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";

type RouteParams = { params: Promise<{ bookId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const viewerEmail = normalizeEmail(await getViewerEmailFromCookie());
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { bookId } = await params;
  const trimmed = bookId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "日記ブックの指定が不正です。" }, { status: 400 });
  }

  const result = await getPendingDiaryBookBindingForBook({
    viewerEmail,
    bookId: trimmed,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    pending: result.pending,
    contentUpdated: result.contentUpdated,
  });
}

export async function POST(_req: Request, { params }: RouteParams) {
  const viewerEmail = normalizeEmail(await getViewerEmailFromCookie());
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const denied = await assertFullAccessForApi(viewerEmail);
  if (denied) return denied;

  const { bookId } = await params;
  const trimmed = bookId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "日記ブックの指定が不正です。" }, { status: 400 });
  }

  const result = await createOrReusePendingDiaryBookBindingForBook({
    viewerEmail,
    bookId: trimmed,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    requestId: result.requestId,
    diaryBindingCode: result.diaryBindingCode,
    reused: result.reused,
    contentUpdated: result.contentUpdated,
    baseShopUrl: result.baseShopUrl,
    pageCount: result.pageCount,
    planId: result.planId,
    displayTitle: result.displayTitle,
    startDate: result.startDate,
    endDate: result.endDate,
  });
}
