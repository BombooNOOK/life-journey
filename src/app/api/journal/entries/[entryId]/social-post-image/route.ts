import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  parseMori3komaPanelAssignment,
  type Mori3komaPanelAssignment,
} from "@/lib/journal/moriLog/moriLog3komaPhotos";
import { compositeJournalSocialPostImage } from "@/lib/journal/social-post-image/compositeImage";
import { loadJournalSocialPostImageContext } from "@/lib/journal/social-post-image/loadContext";
import {
  parseJournalSocialPostPhotoAdjustFromSearchParams,
  type JournalSocialPostPhotoAdjust,
} from "@/lib/journal/social-post-image/photoAdjust";

export const runtime = "nodejs";
export const maxDuration = 60;

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;

/** 追加写真1枚あたりの上限（クライアントで圧縮後想定） */
const MAX_EXTRA_PHOTO_BYTES = 4 * 1024 * 1024;

type RouteParams = { params: Promise<{ entryId: string }> };

function pngResponse(buffer: Buffer, basename: string, download: boolean) {
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
}

function readOptionalText(form: FormData, key: string): string | null {
  return form.has(key) ? String(form.get(key) ?? "") : null;
}

async function readExtraPhotoBuffer(
  form: FormData,
  key: string,
): Promise<Buffer | null> {
  const value = form.get(key);
  if (!value || typeof value === "string") return null;
  const file = value as File;
  if (file.size <= 0) return null;
  if (file.size > MAX_EXTRA_PHOTO_BYTES) {
    throw new Error(`追加写真は ${MAX_EXTRA_PHOTO_BYTES / (1024 * 1024)}MB 以下にしてください。`);
  }
  const mime = file.type || "";
  if (mime && !mime.startsWith("image/")) {
    throw new Error("追加写真は画像ファイルを選んでください。");
  }
  return Buffer.from(await file.arrayBuffer());
}

function photoAdjustFromRecord(values: Record<string, string>): JournalSocialPostPhotoAdjust | undefined {
  const params = new URLSearchParams(values);
  return parseJournalSocialPostPhotoAdjustFromSearchParams(params);
}

async function composeFromParams(input: {
  entryId: string;
  viewerEmail: string;
  title: string;
  subtitle: string | null;
  template: string | null;
  bodyExcerpt: string | null;
  commentExcerpt: string | null;
  promptLabel: string | null;
  summary: string | null;
  photoAdjust?: JournalSocialPostPhotoAdjust;
  extraPhotoBuffers?: [Buffer | null, Buffer | null];
  panelPhotoSources?: Mori3komaPanelAssignment;
}) {
  return loadJournalSocialPostImageContext({
    entryId: input.entryId,
    viewerEmail: input.viewerEmail,
    title: input.title,
    subtitle: input.subtitle,
    bodyExcerpt: input.bodyExcerpt,
    commentExcerpt: input.commentExcerpt,
    promptLabel: input.promptLabel,
    summary: input.summary,
    templateId: input.template,
    photoAdjust: input.photoAdjust,
    extraPhotoBuffers: input.extraPhotoBuffers,
    panelPhotoSources: input.panelPhotoSources ?? undefined,
  });
}

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
    const subtitle = url.searchParams.get("subtitle");
    const template = url.searchParams.get("template");
    const download = url.searchParams.get("download") === "1";
    const hasBodyParam = url.searchParams.has("body");
    const hasCommentParam = url.searchParams.has("comment");
    const hasPromptLabelParam = url.searchParams.has("promptLabel");
    const hasSummaryParam = url.searchParams.has("summary");
    const bodyExcerpt = hasBodyParam ? (url.searchParams.get("body") ?? "") : null;
    const commentExcerpt = hasCommentParam ? (url.searchParams.get("comment") ?? "") : null;
    const promptLabel = hasPromptLabelParam ? (url.searchParams.get("promptLabel") ?? "") : null;
    const summary = hasSummaryParam ? (url.searchParams.get("summary") ?? "") : null;
    const panelPhotoSources = parseMori3komaPanelAssignment(
      url.searchParams.get("panelSources"),
    );

    const photoAdjust = parseJournalSocialPostPhotoAdjustFromSearchParams(url.searchParams);

    const context = await composeFromParams({
      entryId,
      viewerEmail,
      title,
      subtitle,
      template,
      bodyExcerpt,
      commentExcerpt,
      promptLabel,
      summary,
      photoAdjust,
      panelPhotoSources: panelPhotoSources ?? undefined,
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

    return pngResponse(buffer, basename, download);
  } catch (e) {
    console.error("[journal-social-post-image]", e);
    const message = e instanceof Error ? e.message : "画像の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500, headers: CACHE_HEADERS });
  }
}

/** 3コマの追加写真付き生成（multipart） */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const viewerEmail = await getViewerEmailFromCookie();
    if (!viewerEmail) {
      return NextResponse.json(
        { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
        { status: 401, headers: CACHE_HEADERS },
      );
    }

    const { entryId } = await params;
    const form = await req.formData();
    const title = String(form.get("title") ?? "");
    const subtitle = readOptionalText(form, "subtitle");
    const template = readOptionalText(form, "template");
    const download = String(form.get("download") ?? "") === "1";
    const bodyExcerpt = readOptionalText(form, "body");
    const commentExcerpt = readOptionalText(form, "comment");
    const promptLabel = readOptionalText(form, "promptLabel");
    const summary = readOptionalText(form, "summary");
    const panelPhotoSources = parseMori3komaPanelAssignment(
      readOptionalText(form, "panelSources"),
    );

    const photoAdjust = photoAdjustFromRecord({
      focusX: String(form.get("focusX") ?? ""),
      focusY: String(form.get("focusY") ?? ""),
      scale: String(form.get("scale") ?? ""),
    });

    const extraPhotoBuffers: [Buffer | null, Buffer | null] = [
      await readExtraPhotoBuffer(form, "extra0"),
      await readExtraPhotoBuffer(form, "extra1"),
    ];

    const context = await composeFromParams({
      entryId,
      viewerEmail,
      title,
      subtitle,
      template,
      bodyExcerpt,
      commentExcerpt,
      promptLabel,
      summary,
      photoAdjust,
      extraPhotoBuffers,
      panelPhotoSources: panelPhotoSources ?? undefined,
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

    return pngResponse(buffer, basename, download);
  } catch (e) {
    console.error("[journal-social-post-image-post]", e);
    const message = e instanceof Error ? e.message : "画像の生成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500, headers: CACHE_HEADERS });
  }
}
