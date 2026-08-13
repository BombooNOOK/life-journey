/**
 * 4B-4U upgrade migrate on populated ljd_dev (local disposable only).
 * Drops PoC-created JournalSaveOperation if present but not in migration history,
 * then applies official migration. Never touches Neon.
 */
import { spawnSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

import { assertLocalDisposableDatabaseUrl } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

function runMigrateDeploy(databaseUrl: string): void {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(`migrate_deploy_failed:${String(r.status)}`);
  }
}

async function countDonguri(prisma: PrismaClient): Promise<number | null> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='LogHouseDonguriLedgerEntry'`,
    );
    if (!rows[0]?.c) return null;
    const cnt = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM "LogHouseDonguriLedgerEntry"`,
    );
    return cnt[0]?.c ?? 0;
  } catch {
    return null;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  const audit = assertLocalDisposableDatabaseUrl(url);
  console.log(
    JSON.stringify({
      phase: "upgrade",
      gate: audit.reason,
      host: audit.host,
      port: audit.port,
      database: audit.database,
    }),
  );

  const prisma = new PrismaClient();
  try {
    const beforeJe = await prisma.journalEntry.count();
    const beforeDonguri = await countDonguri(prisma);
    const exists = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='JournalSaveOperation'`,
    );
    const tracked = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM _prisma_migrations WHERE migration_name = '20260813140000_add_journal_save_operation'`,
    );

    if (exists[0]?.c && !tracked[0]?.c) {
      console.log(
        JSON.stringify({
          action: "drop_poc_untracked_JournalSaveOperation",
          reason: "replace_with_official_migration",
        }),
      );
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "JournalSaveOperation"`);
    }

    await prisma.$disconnect();
    runMigrateDeploy(url!);
    runMigrateDeploy(url!); // idempotent second pass

    const prisma2 = new PrismaClient();
    try {
      const afterJe = await prisma2.journalEntry.count();
      const afterDonguri = await countDonguri(prisma2);
      const opExists = await prisma2.$queryRawUnsafe<Array<{ c: number }>>(
        `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='JournalSaveOperation'`,
      );
      const fks = await prisma2.$queryRawUnsafe(
        `SELECT tc.constraint_name FROM information_schema.table_constraints AS tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='JournalSaveOperation'`,
      );
      const trackedAfter = await prisma2.$queryRawUnsafe<Array<{ c: number }>>(
        `SELECT COUNT(*)::int as c FROM _prisma_migrations WHERE migration_name = '20260813140000_add_journal_save_operation' AND finished_at IS NOT NULL`,
      );
      console.log(
        JSON.stringify(
          {
            beforeJe,
            afterJe,
            journalEntryUnchanged: beforeJe === afterJe,
            beforeDonguri,
            afterDonguri,
            donguriUnchanged:
              beforeDonguri === null || beforeDonguri === afterDonguri,
            journalSaveOperationExists: Boolean(opExists[0]?.c),
            foreignKeys: fks,
            migrationTracked: Boolean(trackedAfter[0]?.c),
            secondDeployIdempotent: true,
          },
          null,
          2,
        ),
      );
      if (beforeJe !== afterJe) throw new Error("journalEntry_count_changed");
      if (!opExists[0]?.c) throw new Error("table_missing_after_migrate");
      if (Array.isArray(fks) && fks.length > 0) throw new Error("unexpected_fk");
    } finally {
      await prisma2.$disconnect();
    }
  } catch (e) {
    await prisma.$disconnect().catch(() => undefined);
    throw e;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
