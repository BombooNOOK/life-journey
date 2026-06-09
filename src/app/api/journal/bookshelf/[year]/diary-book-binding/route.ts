import { NextResponse } from "next/server";

import {
  createOrReusePendingDiaryBookBindingRequest,
  getPendingDiaryBookBindingForYear,
} from "@/lib/commerce/createDiaryBookBindingRequest";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type RouteParams = { params: Promise<{ year: string }> };

function parseYearParam(raw: string): number | null {
  const y = Number(raw);
  if (!Number.isFinite(y) || y < 1970 || y > 2100) return null;
  return y;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const viewerEmail = normalizeEmail(await getViewerEmailFromCookie());
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { year: ys } = await params;
  const year = parseYearParam(ys);
  if (year === null) {
    return NextResponse.json({ error: "年の指定が不正です。" }, { status: 400 });
  }

  const profileId = await resolveActiveProfileId(viewerEmail);

  const result = await getPendingDiaryBookBindingForYear({
    viewerEmail,
    profileId,
    year,
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

  const { year: ys } = await params;
  const year = parseYearParam(ys);
  if (year === null) {
    return NextResponse.json({ error: "年の指定が不正です。" }, { status: 400 });
  }

  const profileId = await resolveActiveProfileId(viewerEmail);

  const result = await createOrReusePendingDiaryBookBindingRequest({
    viewerEmail,
    profileId,
    year,
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
  });
}
