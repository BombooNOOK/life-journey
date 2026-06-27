import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "@/lib/journal/social-post-image/compositeImage";
import { extractSocialPostBodyText, extractSocialPostCommentText } from "@/lib/journal/social-post-image/textExtract";
import { normalizeJournalSocialPostTemplateId } from "@/lib/journal/social-post-image/templates";

export const runtime = "nodejs";

const DEMO_PHOTO_PATH = path.join(
  process.cwd(),
  "public/images/home-mock/demo-journal-photo.png",
);

const DEMO_CONTENT =
  "今日はモグの病院最終日。おでかけ前の、かわいいひとコマ。";

const DEMO_COMMENT = "動いたことが、やさしく次の流れにつながる日。";

/** 開発中だけ：ログインなしで投稿画像の見た目を確認 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") ?? "イスの下からこんにちは";
    const templateId = normalizeJournalSocialPostTemplateId(url.searchParams.get("template"));
    const download = url.searchParams.get("download") === "1";

    const photoBuffer = fs.existsSync(DEMO_PHOTO_PATH)
      ? fs.readFileSync(DEMO_PHOTO_PATH)
      : null;

    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId,
      title,
      bodyExcerpt: extractSocialPostBodyText(DEMO_CONTENT),
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "移動・おでかけをした",
      commentExcerpt: extractSocialPostCommentText(DEMO_COMMENT),
      photoBuffer,
      companionType: "owl",
      createdAt,
    });

    const { buffer, basename } = await compositeJournalSocialPostImage(input, { createdAt });

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
