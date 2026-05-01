import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { clampMonthOrder } from "@/lib/journal/bookshelfPeriod";
import { isDiaryDesignId } from "@/lib/journal/meta";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

type RouteParams = { params: Promise<{ year: string }> };

function parseYearParam(raw: string): number | null {
  const y = Number(raw);
  if (!Number.isFinite(y) || y < 1970 || y > 2100) return null;
  return y;
}

function getDiaryBookshelfBookDelegate() {
  return (prisma as unknown as {
    diaryBookshelfBook?: {
      findFirst: (args: { where: { email: string; profileId: string; year: number } }) => Promise<{
        displayTitle: string | null;
        coverTheme: string;
        periodStartMonth: number;
        periodEndMonth: number;
      } | null>;
      upsert: (args: {
        where: { email_profileId_year: { email: string; profileId: string; year: number } };
        create: {
          email: string;
          profileId: string;
          year: number;
          displayTitle: string | null;
          coverTheme: string;
          periodStartMonth: number;
          periodEndMonth: number;
        };
        update: {
          displayTitle: string | null;
          coverTheme: string;
          periodStartMonth: number;
          periodEndMonth: number;
        };
      }) => Promise<{
        displayTitle: string | null;
        coverTheme: string;
        periodStartMonth: number;
        periodEndMonth: number;
      }>;
    };
  }).diaryBookshelfBook;
}

export async function GET(_: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const activeProfileId = await resolveActiveProfileId(viewerEmail);

  const { year: ys } = await params;
  const year = parseYearParam(ys);
  if (year === null) {
    return NextResponse.json({ error: "年の指定が不正です。", code: "BAD_YEAR" }, { status: 400 });
  }

  const delegate = getDiaryBookshelfBookDelegate();
  if (!delegate) {
    return NextResponse.json({
      settings: null,
      code: "OK",
    });
  }

  const row = await delegate.findFirst({ where: { email: viewerEmail, profileId: activeProfileId, year } });

  return NextResponse.json({
    settings: row
      ? {
          displayTitle: row.displayTitle,
          coverTheme: row.coverTheme,
          periodStartMonth: row.periodStartMonth,
          periodEndMonth: row.periodEndMonth,
        }
      : null,
    code: "OK",
  });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const activeProfileId = await resolveActiveProfileId(viewerEmail);

  const { year: ys } = await params;
  const year = parseYearParam(ys);
  if (year === null) {
    return NextResponse.json({ error: "年の指定が不正です。", code: "BAD_YEAR" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const rawTitle =
    typeof json === "object" && json !== null && "displayTitle" in json
      ? String((json as { displayTitle: unknown }).displayTitle)
      : "";
  const rawCover =
    typeof json === "object" && json !== null && "coverTheme" in json
      ? String((json as { coverTheme: unknown }).coverTheme)
      : "simple";
  const rawStart =
    typeof json === "object" && json !== null && "periodStartMonth" in json
      ? Number((json as { periodStartMonth: unknown }).periodStartMonth)
      : 1;
  const rawEnd =
    typeof json === "object" && json !== null && "periodEndMonth" in json
      ? Number((json as { periodEndMonth: unknown }).periodEndMonth)
      : 12;

  const displayTitle = rawTitle.trim() === "" ? null : rawTitle.trim().slice(0, 80);
  const coverTheme = isDiaryDesignId(rawCover.trim()) ? rawCover.trim() : "simple";
  const { start: periodStartMonth, end: periodEndMonth } = clampMonthOrder(rawStart, rawEnd);

  const delegate = getDiaryBookshelfBookDelegate();
  if (!delegate) {
    return NextResponse.json(
      {
        error:
          "サーバー設定の反映待ちです。`npm run db:sync` 実行後に開発サーバーを再起動して再度お試しください。",
        code: "DB_SCHEMA_OUTDATED",
      },
      { status: 503 },
    );
  }

  let saved;
  try {
    saved = await delegate.upsert({
      where: {
        email_profileId_year: {
          email: viewerEmail,
          profileId: activeProfileId,
          year,
        },
      },
      create: {
        email: viewerEmail,
        profileId: activeProfileId,
        year,
        displayTitle,
        coverTheme,
        periodStartMonth,
        periodEndMonth,
      },
      update: {
        displayTitle,
        coverTheme,
        periodStartMonth,
        periodEndMonth,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "設定の保存に失敗しました。`npm run db:sync` 実行後に開発サーバーを再起動して、もう一度お試しください。",
        code: "SAVE_FAILED",
      },
      { status: 500 },
    );
  }

  revalidatePath("/orders/bookshelf");
  revalidatePath(`/orders/bookshelf/diary/${year}`);

  return NextResponse.json({
    settings: {
      displayTitle: saved.displayTitle,
      coverTheme: saved.coverTheme,
      periodStartMonth: saved.periodStartMonth,
      periodEndMonth: saved.periodEndMonth,
    },
    code: "OK",
  });
}
