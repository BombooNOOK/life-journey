import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const includeInBook =
    typeof json === "object" && json !== null && "includeInBook" in json
      ? (json as { includeInBook: unknown }).includeInBook
      : null;
  const ids =
    typeof json === "object" && json !== null && "ids" in json
      ? (json as { ids: unknown }).ids
      : null;

  if (typeof includeInBook !== "boolean") {
    return NextResponse.json(
      { error: "includeInBook は true/false を指定してください。", code: "BAD_INCLUDE" },
      { status: 400 },
    );
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids は1件以上の文字列配列で指定してください。", code: "BAD_IDS" },
      { status: 400 },
    );
  }

  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return NextResponse.json(
      { error: "ids は1件以上の文字列配列で指定してください。", code: "BAD_IDS" },
      { status: 400 },
    );
  }

  const result = await prisma.journalEntry.updateMany({
    where: {
      email: viewerEmail,
      id: { in: uniqueIds },
    },
    data: { includeInBook },
  });

  return NextResponse.json({ code: "OK", updatedCount: result.count });
}
