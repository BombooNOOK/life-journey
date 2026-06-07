/**
 * ローカル DB のバックアップ検証用データ概要（読み取り専用）
 */
import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { prisma } from "../src/lib/db";

async function main() {
  requireSafeDatabaseUrl({ scriptName: "inspect-local-backup-data.ts" });

  const [profiles, entryGroups, photoStats, sampleEntries] = await Promise.all([
    prisma.profile.findMany({
      where: { isArchived: false },
      select: { id: true, nickname: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.journalEntry.groupBy({
      by: ["email", "profileId"],
      _count: { id: true },
    }),
    prisma.$queryRaw<Array<{ blob: number; legacy: number; total: number }>>`
      SELECT
        COUNT(*) FILTER (WHERE "photoBlobUrl" IS NOT NULL AND btrim("photoBlobUrl") <> '')::int AS blob,
        COUNT(*) FILTER (WHERE ("photoBlobUrl" IS NULL OR btrim("photoBlobUrl") = '') AND "photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')::int AS legacy,
        COUNT(*) FILTER (
          WHERE ("photoBlobUrl" IS NOT NULL AND btrim("photoBlobUrl") <> '')
             OR ("photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')
        )::int AS total
      FROM "JournalEntry"
    `,
    prisma.journalEntry.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        profileId: true,
        email: true,
        content: true,
        photoBlobUrl: true,
        photoDataUrl: true,
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        profiles,
        entryGroups,
        photoStats: photoStats[0],
        sampleEntries: sampleEntries.map((e) => ({
          id: e.id,
          profileId: e.profileId,
          email: e.email,
          contentLength: e.content.length,
          hasBlob: Boolean(e.photoBlobUrl?.trim()),
          hasLegacy: Boolean(e.photoDataUrl?.trim()),
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
