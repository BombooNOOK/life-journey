import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import {
  buildDailyNumberZipBuffer,
  compositeDailyNumberCarousel,
} from "@/lib/admin/post-atelier/daily-number/compositeImages";
import {
  getDailyNumberDraftById,
  loadPayloadFromDraft,
} from "@/lib/admin/post-atelier/daily-number/draftQueries";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const runtime = "nodejs";
export const maxDuration = 120;

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const viewerEmail = await getViewerEmailFromCookie();
    if (!(await isAdminEmail(viewerEmail))) {
      return NextResponse.json(
        { error: "管理者のみアクセスできます。" },
        { status: 401, headers: CACHE_HEADERS },
      );
    }

    const { id } = await params;
    const draft = await getDailyNumberDraftById(id);
    if (!draft) {
      return NextResponse.json(
        { error: "投稿案が見つかりません。" },
        { status: 404, headers: CACHE_HEADERS },
      );
    }

    const payload = loadPayloadFromDraft(draft);
    if (!payload) {
      return NextResponse.json(
        { error: "生成データがありません。再保存してください。" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const url = new URL(req.url);
    const slideParam = url.searchParams.get("slide");

    if (slideParam) {
      const slideIndex = Number.parseInt(slideParam, 10);
      if (!Number.isFinite(slideIndex) || slideIndex < 1 || slideIndex > 9) {
        return NextResponse.json(
          { error: "slide は 1〜9 を指定してください。" },
          { status: 400, headers: CACHE_HEADERS },
        );
      }

      const slides = await compositeDailyNumberCarousel(payload);
      const slide = slides.find((s) => s.index === slideIndex);
      if (!slide) {
        return NextResponse.json(
          { error: "スライドを生成できませんでした。" },
          { status: 500, headers: CACHE_HEADERS },
        );
      }

      return new NextResponse(new Uint8Array(slide.buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="${slide.filename}"`,
          ...CACHE_HEADERS,
        },
      });
    }

    const { buffer, basename } = await buildDailyNumberZipBuffer(payload);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${basename}.zip"`,
        ...CACHE_HEADERS,
      },
    });
  } catch (e) {
    console.error("[daily-number-images]", e);
    const message = e instanceof Error ? e.message : "画像の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500, headers: CACHE_HEADERS });
  }
}
