import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { compositeJournalSocialPostImage } from "@/lib/journal/social-post-image/compositeImage";
import { loadJournalSocialPostImageContext } from "@/lib/journal/social-post-image/loadContext";
import { parseJournalSocialPostPhotoAdjustFromSearchParams } from "@/lib/journal/social-post-image/photoAdjust";

export const runtime = "nodejs";
export const maxDuration = 60;

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;

type RouteParams = { params: Promise<{ entryId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const viewerEmail = await getViewerEmailFromCookie();
    if (!viewerEmail) {
      return NextResponse.json(
        { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
        { status: 401, headers: CACHE_HEADERS },
      );
    }

    const { entryId } = await params;
    const url = new URL(req.url);
    const title = url.searchParams.get("title") ?? "";
    const template = url.searchParams.get("template");
    const download = url.searchParams.get("download") === "1";

    const photoAdjust = parseJournalSocialPostPhotoAdjustFromSearchParams(url.searchParams);

    const context = await loadJournalSocialPostImageContext({
      entryId,
      viewerEmail,
      title,
      templateId: template,
      photoAdjust,
    });
    if (!context) {
      return NextResponse.json(
        { error: "対象の記録が見つかりません。", code: "NOT_FOUND" },
        { status: 404, headers: CACHE_HEADERS },
      );
    }

    const { buffer, basename } = await compositeJournalSocialPostImage(context.input, {
      createdAt: context.createdAt,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": download
          ? `attachment; filename="${basename}.png"`
          : `inline; filename="${basename}.png"`,
        ...CACHE_HEADERS,
      },
    });
  } catch (e) {
    console.error("[journal-social-post-image]", e);
    const message = e instanceof Error ? e.message : "画像の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500, headers: CACHE_HEADERS });
  }
}
