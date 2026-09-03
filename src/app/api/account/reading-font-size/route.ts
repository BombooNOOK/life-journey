import { NextResponse } from "next/server";

import {
  authorizeAccountSettingsMutation,
} from "@/lib/account/p0IdentityMutationAuthority";
import { isP0IdentityMutationAuthorityEnabled } from "@/lib/account/p0IdentityMutationAuthorityGate";
import { resolveP0IdentityOwnership } from "@/lib/account/p0IdentityOwnership";
import { isP0IdentityReadAuthorityEnabled } from "@/lib/account/p0IdentityReadAuthorityGate";
import { loadAccountSettingsForP0Read } from "@/lib/account/p0IdentityReads";
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

  if (isP0IdentityReadAuthorityEnabled()) {
    const ownership = await resolveP0IdentityOwnership();
    const loaded = await loadAccountSettingsForP0Read({ ownership });
    if (loaded.mode === "identity" && loaded.settings) {
      const row = await withPrismaConnectionRetry(() =>
        prisma.accountSettings.findUnique({
          where: { id: loaded.settings.id },
          select: { readingFontSize: true },
        }),
      );
      return NextResponse.json({
        readingFontSize: normalizeReadingFontSize(row?.readingFontSize),
      });
    }
    if (loaded.mode === "mismatch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
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

  if (isP0IdentityMutationAuthorityEnabled()) {
    const ownership = await resolveP0IdentityOwnership();
    const authz = await authorizeAccountSettingsMutation({
      ownership,
      contactEmail: viewerEmail,
    });
    if (authz.state !== "AUTHORIZED" || !("mode" in authz)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (authz.mode === "identity" && authz.settingsId) {
      await withPrismaConnectionRetry(() =>
        prisma.accountSettings.update({
          where: { id: authz.settingsId },
          data: { readingFontSize },
        }),
      );
    } else {
      // create_needed — create with identity bind; email remains contact metadata
      await withPrismaConnectionRetry(() =>
        prisma.accountSettings.create({
          data: {
            email: viewerEmail,
            readingFontSize,
            identityId: authz.identityId,
          },
        }),
      );
    }
    return NextResponse.json({ readingFontSize });
  }

  await withPrismaConnectionRetry(() =>
    prisma.accountSettings.upsert({
      where: { email: viewerEmail },
      create: { email: viewerEmail, readingFontSize },
      update: { readingFontSize },
    }),
  );

  return NextResponse.json({ readingFontSize });
}
