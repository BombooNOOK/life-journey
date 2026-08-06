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

/** 追加写真1枚あたり（圧縮後JPEG想定） */
const MAX_EXTRA_PHOTO_BYTES = 400_000;

type RouteParams = { params: Promise<{ entryId: string }> };

type ThreeKomaPostBody = {
  title?: string;
  subtitle?: string | null;
  template?: string | null;
  download?: boolean | string | number;
  body?: string | null;
  comment?: string | null;
  promptLabel?: string | null;
  summary?: string | null;
  panelSources?: string | null;
  focusX?: string | number | null;
  focusY?: string | number | null;
  scale?: string | number | null;
  /** JPEG base64（data: 接頭辞なし） */
  extra0Base64?: string | null;
  extra1Base64?: string | null;
};

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

function bufferFromBase64Jpeg(raw: string | null | undefined): Buffer | null {
  if (!raw || typeof raw !== "string") return null;
  let base64 = raw.trim();
  if (!base64) return null;
  if (base64.startsWith("data:image/")) {
    const comma = base64.indexOf(",");
    if (comma < 0) return null;
    base64 = base64.slice(comma + 1);
  }
  base64 = base64.replace(/\s+/g, "");
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength <= 0) return null;
  if (buffer.byteLength > MAX_EXTRA_PHOTO_BYTES) {
    throw new Error("追加写真が大きすぎます。別の写真で再度お試しください。");
  }
  return buffer;
}

function photoAdjustFromValues(values: {
  focusX?: string | number | null;
  focusY?: string | number | null;
  scale?: string | number | null;
}): JournalSocialPostPhotoAdjust {
  const params = new URLSearchParams();
  if (values.focusX != null && String(values.focusX) !== "") {
    params.set("focusX", String(values.focusX));
  }
  if (values.focusY != null && String(values.focusY) !== "") {
    params.set("focusY", String(values.focusY));
  }
  if (values.scale != null && String(values.scale) !== "") {
    params.set("scale", String(values.scale));
  }
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

/** 3コマ追加写真付き生成（JSON: 軽量 base64） */
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
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "リクエスト形式が不正です。", code: "BAD_REQUEST" },
        { status: 400, headers: CACHE_HEADERS },
      );
    }

    const body = (await req.json()) as ThreeKomaPostBody;
    const title = String(body.title ?? "");
    const subtitle = body.subtitle != null ? String(body.subtitle) : null;
    const template = body.template != null ? String(body.template) : null;
    const download = body.download === true || body.download === 1 || body.download === "1";
    const bodyExcerpt = body.body != null ? String(body.body) : null;
    const commentExcerpt = body.comment != null ? String(body.comment) : null;
    const promptLabel = body.promptLabel != null ? String(body.promptLabel) : null;
    const summary = body.summary != null ? String(body.summary) : null;
    const panelPhotoSources = parseMori3komaPanelAssignment(
      body.panelSources != null ? String(body.panelSources) : null,
    );

    const photoAdjust = photoAdjustFromValues({
      focusX: body.focusX,
      focusY: body.focusY,
      scale: body.scale,
    });

    const extraPhotoBuffers: [Buffer | null, Buffer | null] = [
      bufferFromBase64Jpeg(body.extra0Base64),
      bufferFromBase64Jpeg(body.extra1Base64),
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
