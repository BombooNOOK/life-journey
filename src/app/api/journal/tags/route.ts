import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { collectDiaryTagsFromContents } from "@/lib/journal/diaryTags";
import {
  journalProfileIdsForQuery,
  profileByIdForViewer,
  resolveActiveProfileId,
} from "@/lib/profile/activeProfile";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

function parseYear(input: string | null): { from: Date; to: Date } | null {
  if (!input) return null;
  const m = /^(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const year = Number(m[1]);
  if (!Number.isFinite(year) || year < 1970 || year > 2100) return null;
  return {
    from: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    to: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
}

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  try {
    const url = new URL(req.url);
    const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
    const activeProfileId = await resolveActiveProfileId(viewerEmail);
    const profileId = rawProfileId || activeProfileId;
    if (profileId) {
      const p = await profileByIdForViewer(profileId, viewerEmail);
      if (!p) {
        return NextResponse.json(
          { error: "指定プロフィールは利用できません。", code: "FORBIDDEN_PROFILE" },
          { status: 403, ...JSON_NO_STORE },
        );
      }
    }

    const yearFilter = parseYear(url.searchParams.get("year"));
    const profileIds = journalProfileIdsForQuery(profileId, viewerEmail);
    const profileWhere =
      profileIds.length === 1 ? { profileId: profileIds[0]! } : { profileId: { in: profileIds } };

    const rows = await prisma.journalEntry.findMany({
      where: {
        email: viewerEmail,
        ...profileWhere,
        ...(yearFilter ? { createdAt: { gte: yearFilter.from, lt: yearFilter.to } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { content: true },
    });

    const tags = collectDiaryTagsFromContents(rows.map((row) => row.content));

    return NextResponse.json({ tags, code: "OK" }, JSON_NO_STORE);
  } catch (e) {
    const message = e instanceof Error ? e.message : "タグ一覧の取得に失敗しました。";
    return NextResponse.json({ error: message, code: "DB_READ" }, { status: 500, ...JSON_NO_STORE });
  }
}
