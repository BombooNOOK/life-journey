/**
 * JournalEntry.photoDataUrl のサイズ集計（読み取り専用）。
 *
 * ⚠️ 本番 Neon で実行すると Network transfer を大量消費します。
 *    PostgreSQL は length/LIKE 集計でも photoDataUrl 列を読みに行くため、
 *    写真合計サイズと同程度（数 MB〜）の egress が 1 回の実行で発生し得ます。
 *
 * 通常はローカル DB: docs/DEV_DATABASE.md
 * 本番でどうしても 1 回: docs/PROD_DATABASE_INVESTIGATION.md
 *
 * 使い方:
 *   npx tsx scripts/photo-data-url-stats.ts
 * 本番（非推奨）:
 *   ALLOW_PROD_DB=1 ALLOW_PROD_PHOTO_DATA_URL_READ=1 npx tsx scripts/photo-data-url-stats.ts
 */
import { PrismaClient } from "@prisma/client";

import { requireSafeDatabaseUrl } from "./lib/safe-database-url";

const prisma = new PrismaClient();

/** data URL 文字列から概算バイナリサイズ（base64 部のみ） */
function approxBytesFromDataUrlChars(len: number): number {
  return Math.max(0, Math.floor((len - 50) * 0.75));
}

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "photo-data-url-stats.ts",
    readsPhotoDataUrl: true,
  });

  const [stats] = await prisma.$queryRaw<
    Array<{
      total_entries: number;
      photo_count: number;
      avg_len: unknown;
      max_len: number | null;
      sum_len: bigint | number | null;
    }>
  >`
    SELECT
      COUNT(*)::int AS total_entries,
      COUNT(*) FILTER (WHERE "photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')::int AS photo_count,
      AVG(length("photoDataUrl")) FILTER (WHERE "photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '') AS avg_len,
      MAX(length("photoDataUrl")) FILTER (WHERE "photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')::int AS max_len,
      SUM(length("photoDataUrl")) FILTER (WHERE "photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '') AS sum_len
    FROM "JournalEntry"
  `;

  const mimeRows = await prisma.$queryRaw<
    Array<{ mime: string; n: number; avg_len: number | null; max_len: number | null }>
  >`
    SELECT
      CASE
        WHEN "photoDataUrl" LIKE 'data:image/webp%' THEN 'webp'
        WHEN "photoDataUrl" LIKE 'data:image/jpeg%' OR "photoDataUrl" LIKE 'data:image/jpg%' THEN 'jpeg'
        WHEN "photoDataUrl" LIKE 'data:image/png%' THEN 'png'
        WHEN "photoDataUrl" IS NULL OR btrim("photoDataUrl") = '' THEN 'none'
        ELSE 'other'
      END AS mime,
      COUNT(*)::int AS n,
      ROUND(AVG(length("photoDataUrl")))::int AS avg_len,
      MAX(length("photoDataUrl"))::int AS max_len
    FROM "JournalEntry"
    GROUP BY 1
    ORDER BY n DESC
  `;

  const buckets = await prisma.$queryRaw<Array<{ bucket: string; n: number }>>`
    SELECT bucket, COUNT(*)::int AS n
    FROM (
      SELECT CASE
        WHEN "photoDataUrl" IS NULL OR btrim("photoDataUrl") = '' THEN 'no_photo'
        WHEN length("photoDataUrl") < 80000 THEN 'under_80k_chars'
        WHEN length("photoDataUrl") < 200000 THEN 'chars_80k_200k'
        WHEN length("photoDataUrl") < 800000 THEN 'chars_200k_800k'
        ELSE 'chars_800k_plus'
      END AS bucket
      FROM "JournalEntry"
    ) t
    GROUP BY bucket
    ORDER BY bucket
  `;

  const photoCount = Number(stats.photo_count);
  const avgLen = stats.avg_len != null ? Math.round(Number(stats.avg_len)) : 0;
  const maxLen = Number(stats.max_len ?? 0);
  const sumLen = Number(stats.sum_len ?? 0);

  console.log(
    JSON.stringify(
      {
        total_entries: Number(stats.total_entries),
        photo_count: photoCount,
        avg_chars: avgLen,
        max_chars: maxLen,
        sum_chars: sumLen,
        avg_mb_per_photo: photoCount
          ? Number((approxBytesFromDataUrlChars(avgLen) / 1048576).toFixed(2))
          : 0,
        max_mb_per_photo: Number((approxBytesFromDataUrlChars(maxLen) / 1048576).toFixed(2)),
        total_mb_approx: Number((approxBytesFromDataUrlChars(sumLen) / 1048576).toFixed(2)),
      },
      null,
      2,
    ),
  );
  console.log("mime_breakdown:", JSON.stringify(mimeRows, null, 2));
  console.log("size_buckets:", JSON.stringify(buckets, null, 2));
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
