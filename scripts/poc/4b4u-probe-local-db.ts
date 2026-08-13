/**
 * 4B-4U local disposable DB probe (no secrets beyond host/port/db).
 */
import { PrismaClient } from "@prisma/client";

import { assertLocalDisposableDatabaseUrl } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

async function main() {
  const audit = assertLocalDisposableDatabaseUrl(process.env.DATABASE_URL);
  console.log(
    JSON.stringify({
      gate: audit.reason,
      host: audit.host,
      port: audit.port,
      database: audit.database,
    }),
  );
  const prisma = new PrismaClient();
  try {
    const exists = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='JournalSaveOperation'`,
    );
    const je = await prisma.journalEntry.count();
    let opCount: number | null = null;
    let columns: unknown = null;
    if (exists[0]?.c) {
      const cnt = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
        `SELECT COUNT(*)::int as c FROM "JournalSaveOperation"`,
      );
      opCount = cnt[0]?.c ?? 0;
      columns = await prisma.$queryRawUnsafe(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='JournalSaveOperation' ORDER BY ordinal_position`,
      );
    }
    const related = await prisma.$queryRawUnsafe(
      `SELECT migration_name FROM _prisma_migrations WHERE migration_name ILIKE '%journal_save%' OR migration_name ILIKE '%JournalSave%' ORDER BY started_at`,
    );
    console.log(
      JSON.stringify(
        {
          journalSaveOperationExists: Boolean(exists[0]?.c),
          journalSaveOperationRows: opCount,
          journalEntryCount: je,
          relatedMigrations: related,
          columns,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
