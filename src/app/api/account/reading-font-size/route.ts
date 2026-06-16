import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  normalizeReadingFontSize,
  type ReadingFontSize,
} from "@/lib/reading/readingFontSize";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await withPrismaConnectionRetry(() =>
    prisma.accountSettings.findUnique({
      where: { email: viewerEmail },
      select: { readingFontSize: true },
    }),
  );

  return NextResponse.json({
    readingFontSize: normalizeReadingFontSize(row?.readingFontSize),
  });
}

export async function PUT(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { readingFontSize?: unknown };
  const readingFontSize: ReadingFontSize = normalizeReadingFontSize(body.readingFontSize);

  await withPrismaConnectionRetry(() =>
    prisma.accountSettings.upsert({
      where: { email: viewerEmail },
      create: { email: viewerEmail, readingFontSize },
      update: { readingFontSize },
    }),
  );

  return NextResponse.json({ readingFontSize });
}
