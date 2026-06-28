import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "@/lib/journal/social-post-image/compositeImage";
import { parseJournalSocialPostPhotoAdjustFromSearchParams } from "@/lib/journal/social-post-image/photoAdjust";
import {
  clampJournalSocialPostTitle,
  extractSocialPostBodyText,
  extractSocialPostCommentText,
  resolveJournalSocialPostSubtitle,
} from "@/lib/journal/social-post-image/textExtract";
import {
  JOURNAL_SOCIAL_POST_PREVIEW_DEMO_COMMENT,
  JOURNAL_SOCIAL_POST_PREVIEW_DEMO_CONTENT,
} from "@/lib/journal/social-post-image/previewDemoContent";
import { normalizeJournalSocialPostTemplateId } from "@/lib/journal/social-post-image/templates";

export const runtime = "nodejs";

const DEMO_PHOTO_PATH = path.join(
  process.cwd(),
  "public/images/home-mock/demo-journal-photo.png",
);

/** 開発中だけ：ログインなしで投稿画像の見た目を確認 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const url = new URL(req.url);
    const templateId = normalizeJournalSocialPostTemplateId(url.searchParams.get("template"));
    const rawTitle = url.searchParams.get("title") ?? "イスの下からこんに";
    const title = clampJournalSocialPostTitle(rawTitle, templateId);
    const subtitle = resolveJournalSocialPostSubtitle(url.searchParams.get("subtitle"));
    const download = url.searchParams.get("download") === "1";
    const photoRotateRaw = url.searchParams.get("photoRotate");
    const photoRotateDeg =
      photoRotateRaw != null && photoRotateRaw !== "" ? Number(photoRotateRaw) : undefined;

    const photoBuffer = fs.existsSync(DEMO_PHOTO_PATH)
      ? fs.readFileSync(DEMO_PHOTO_PATH)
      : null;

    const photoAdjust = parseJournalSocialPostPhotoAdjustFromSearchParams(url.searchParams);

    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId,
      title,
      bodyExcerpt: extractSocialPostBodyText(JOURNAL_SOCIAL_POST_PREVIEW_DEMO_CONTENT, templateId),
      subtitle,
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "移動・おでかけをした",
      commentExcerpt: extractSocialPostCommentText(JOURNAL_SOCIAL_POST_PREVIEW_DEMO_COMMENT),
      photoBuffer,
      photoAdjust,
      companionType: "owl",
      createdAt,
    });

    const { buffer, basename } = await compositeJournalSocialPostImage(input, {
      createdAt,
      photoRotateDeg: Number.isFinite(photoRotateDeg) ? photoRotateDeg : undefined,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": download
          ? `attachment; filename="${basename}.png"`
          : `inline; filename="${basename}.png"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[preview-journal-social-post-image]", e);
    return NextResponse.json({ error: "画像の生成に失敗しました。" }, { status: 500 });
  }
}
