/**
 * 4B-4U fresh migrate: create blank DB on local disposable Postgres, migrate deploy, drop DB.
 * Host must remain 127.0.0.1:5433 only. Never Neon.
 */
import { spawnSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

import { assertLocalDisposableDatabaseUrl } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

const FRESH_DB = "ljd_4b4u_fresh";

function adminUrlFromDevUrl(devUrl: string): { adminUrl: string; freshUrl: string } {
  const u = new URL(devUrl);
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
    throw new Error("fresh_migrate_host_forbidden");
  }
  if ((u.port || "5432") !== "5433") throw new Error("fresh_migrate_port_forbidden");
  const admin = new URL(devUrl);
  admin.pathname = "/postgres";
  const fresh = new URL(devUrl);
  fresh.pathname = `/${FRESH_DB}`;
  return { adminUrl: admin.toString(), freshUrl: fresh.toString() };
}

function migrateDeploy(databaseUrl: string): string {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    shell: false,
  });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  process.stdout.write(out);
  if (r.status !== 0) throw new Error(`migrate_deploy_failed:${String(r.status)}`);
  return out;
}

async function main() {
  const base = process.env.DATABASE_URL;
  const audit = assertLocalDisposableDatabaseUrl(base);
  console.log(
    JSON.stringify({
      phase: "fresh",
      gate: audit.reason,
      host: audit.host,
      port: audit.port,
      baseDatabase: audit.database,
      freshDatabase: FRESH_DB,
    }),
  );

  const { adminUrl, freshUrl } = adminUrlFromDevUrl(base!);
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${FRESH_DB}"`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${FRESH_DB}"`);
  } finally {
    await admin.$disconnect();
  }

  migrateDeploy(freshUrl);
  const second = migrateDeploy(freshUrl);
  if (!/No pending migrations|Already in sync| Domigrations have been applied/i.test(second) &&
      !/No pending migrations/i.test(second)) {
    // Prisma typically prints "No pending migrations to apply."
    console.log(JSON.stringify({ secondDeployNote: "completed", lookFor: "No pending migrations" }));
  }

  const fresh = new PrismaClient({ datasources: { db: { url: freshUrl } } });
  try {
    const exists = await fresh.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='JournalSaveOperation'`,
    );
    const tracked = await fresh.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int as c FROM _prisma_migrations WHERE migration_name = '20260813140000_add_journal_save_operation' AND finished_at IS NOT NULL`,
    );
    const fks = await fresh.$queryRawUnsafe(
      `SELECT tc.constraint_name FROM information_schema.table_constraints AS tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='JournalSaveOperation'`,
    );
    console.log(
      JSON.stringify(
        {
          freshTableExists: Boolean(exists[0]?.c),
          migrationTracked: Boolean(tracked[0]?.c),
          foreignKeys: fks,
        },
        null,
        2,
      ),
    );
    if (!exists[0]?.c) throw new Error("fresh_table_missing");
    if (!tracked[0]?.c) throw new Error("fresh_migration_untracked");
  } finally {
    await fresh.$disconnect();
  }

  const admin2 = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await admin2.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${FRESH_DB}"`);
    console.log(JSON.stringify({ cleanup: "dropped_fresh_db", database: FRESH_DB }));
  } finally {
    await admin2.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
