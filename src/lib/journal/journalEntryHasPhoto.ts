import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/** photoDataUrl 本文を読まず、写真の有無だけ取得（Neon egress 削減） */
export async function loadJournalEntryHasPhotoFlags(params: {
  email: string;
  entryIds: string[];
}): Promise<Map<string, boolean>> {
  const { email, entryIds } = params;
  if (entryIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<Array<{ id: string; hasPhoto: boolean }>>(Prisma.sql`
    SELECT
      id,
      (
        ("photoBlobUrl" IS NOT NULL AND btrim("photoBlobUrl") <> '')
        OR ("photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')
      ) AS "hasPhoto"
    FROM "JournalEntry"
    WHERE email = ${email}
      AND id IN (${Prisma.join(entryIds)})
  `);

  return new Map(rows.map((row) => [row.id, row.hasPhoto === true]));
}
