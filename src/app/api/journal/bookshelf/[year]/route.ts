import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { clampMonthOrder } from "@/lib/journal/bookshelfPeriod";
import { isDiaryCoverStyleRawAllowed, normalizeDiaryCoverStyle } from "@/lib/journal/coverAssets";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";
import {
  assertProfileBelongsToIdentity,
  authorizeDiaryBookshelfAccess,
  diaryCreateIdentityFields,
  diaryIdentityOrExplicitEmailWhere,
  shouldUseDiaryIdentityMutation,
  shouldUseDiaryIdentityRead,
} from "@/lib/diary/diaryIdentityAuthority";
import { resolveP0IdentityReadAccess } from "@/lib/account/p0IdentityReadContract";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

type RouteParams = { params: Promise<{ year: string }> };

function parseYearParam(raw: string): number | null {
  const y = Number(raw);
  if (!Number.isFinite(y) || y < 1970 || y > 2100) return null;
  return y;
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

  let row: {
    displayTitle: string | null;
    coverTheme: string;
    periodStartMonth: number;
    periodEndMonth: number;
  } | null = null;

  if (shouldUseDiaryIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    const access = await resolveP0IdentityReadAccess(ownership);
    if (access.ok) {
      const where = diaryIdentityOrExplicitEmailWhere({
        identityId: access.identityId,
        explicitHistoricalEmails: access.explicitHistoricalEmails,
        profileId: activeProfileId,
      });
      row = await prisma.diaryBookshelfBook.findFirst({
        where: { ...where, year },
        select: {
          displayTitle: true,
          coverTheme: true,
          periodStartMonth: true,
          periodEndMonth: true,
        },
      });
    }
  } else {
    row = await prisma.diaryBookshelfBook.findFirst({
      where: { email: viewerEmail, profileId: activeProfileId, year },
      select: {
        displayTitle: true,
        coverTheme: true,
        periodStartMonth: true,
        periodEndMonth: true,
      },
    });
  }

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

  const denied = await assertFullAccessForApi(viewerEmail);
  if (denied) return denied;

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
      : "casual";
  const rawStart =
    typeof json === "object" && json !== null && "periodStartMonth" in json
      ? Number((json as { periodStartMonth: unknown }).periodStartMonth)
      : 1;
  const rawEnd =
    typeof json === "object" && json !== null && "periodEndMonth" in json
      ? Number((json as { periodEndMonth: unknown }).periodEndMonth)
      : 12;

  const displayTitle = rawTitle.trim() === "" ? null : rawTitle.trim().slice(0, 80);
  if (!isDiaryCoverStyleRawAllowed(rawCover)) {
    return NextResponse.json({ error: "表紙デザインの値が不正です。", code: "BAD_COVER" }, { status: 400 });
  }
  const coverTheme = normalizeDiaryCoverStyle(rawCover.trim() || "casual");
  const { start: periodStartMonth, end: periodEndMonth } = clampMonthOrder(rawStart, rawEnd);

  const updateData = {
    displayTitle,
    coverTheme,
    periodStartMonth,
    periodEndMonth,
  };

  let saved: {
    displayTitle: string | null;
    coverTheme: string;
    periodStartMonth: number;
    periodEndMonth: number;
  };

  try {
    if (shouldUseDiaryIdentityMutation()) {
      const ownership = await resolveValueIdentityOwnership();
      const profileAuth = await assertProfileBelongsToIdentity({
        ownership,
        profileId: activeProfileId,
      });
      if (profileAuth.state !== "AUTHORIZED") {
        return NextResponse.json(
          { error: "プロフィールへの権限がありません。", code: "IDENTITY_PROFILE_DENIED" },
          { status: 403 },
        );
      }
      const identityFields = diaryCreateIdentityFields({ ownership });
      const access = await resolveP0IdentityReadAccess(ownership);
      if (!access.ok) {
        return NextResponse.json(
          { error: "本人確認が完了していません。", code: "IDENTITY_UNBOUND" },
          { status: 403 },
        );
      }

      const existing = await prisma.diaryBookshelfBook.findFirst({
        where: {
          ...diaryIdentityOrExplicitEmailWhere({
            identityId: access.identityId,
            explicitHistoricalEmails: access.explicitHistoricalEmails,
            profileId: activeProfileId,
          }),
          year,
        },
      });

      if (existing) {
        const authz = await authorizeDiaryBookshelfAccess({
          ownership,
          shelfId: existing.id,
        });
        if (authz.state !== "AUTHORIZED") {
          return NextResponse.json(
            { error: "この本棚設定にはアクセスできません。", code: "NOT_OWNED" },
            { status: 403 },
          );
        }
        saved = await prisma.diaryBookshelfBook.update({
          where: { id: existing.id },
          data: {
            ...updateData,
            ...(identityFields.identityId && !existing.identityId
              ? { identityId: identityFields.identityId }
              : {}),
          },
          select: {
            displayTitle: true,
            coverTheme: true,
            periodStartMonth: true,
            periodEndMonth: true,
          },
        });
      } else {
        saved = await prisma.diaryBookshelfBook.create({
          data: {
            email: viewerEmail,
            profileId: activeProfileId,
            year,
            ...updateData,
            ...identityFields,
          },
          select: {
            displayTitle: true,
            coverTheme: true,
            periodStartMonth: true,
            periodEndMonth: true,
          },
        });
      }
    } else {
      saved = await prisma.diaryBookshelfBook.upsert({
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
          ...updateData,
        },
        update: updateData,
        select: {
          displayTitle: true,
          coverTheme: true,
          periodStartMonth: true,
          periodEndMonth: true,
        },
      });
    }
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
