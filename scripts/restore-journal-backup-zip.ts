/**
 * 運営・開発者向け: バックアップ ZIP を新規プロフィールとして復元（DB 書き込みあり）。
 *
 * 使い方:
 *   VIEWER_EMAIL=user@example.com npx tsx scripts/restore-journal-backup-zip.ts tmp/backup.zip
 *   VIEWER_EMAIL=user@example.com npx tsx scripts/restore-journal-backup-zip.ts tmp/backup.zip --dry-run
 *
 * 本番 DB（非推奨）:
 *   ALLOW_PROD_DB=1 ALLOW_PROD_DB_MUTATION=1 VIEWER_EMAIL=... npx tsx scripts/restore-journal-backup-zip.ts ...
 */
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { extractJournalBackupZip } from "../src/lib/journal/journalBackupValidate";
import {
  JournalBackupRestoreError,
  restoreJournalBackupToNewProfile,
} from "../src/lib/journal/journalBackupRestore";

function parseArgs(argv: string[]) {
  const zipPath = argv.find((a) => !a.startsWith("--"))?.trim();
  const dryRun = argv.includes("--dry-run");
  return { zipPath, dryRun };
}

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "restore-journal-backup-zip.ts",
    mutatesDatabase: true,
  });

  const { zipPath, dryRun } = parseArgs(process.argv.slice(2));
  const viewerEmail = (process.env.VIEWER_EMAIL ?? "").trim();
  if (!zipPath) {
    console.error(
      "Usage: VIEWER_EMAIL=user@example.com npx tsx scripts/restore-journal-backup-zip.ts <zip-path> [--dry-run]",
    );
    process.exit(1);
  }
  if (!viewerEmail) {
    console.error("VIEWER_EMAIL is required.");
    process.exit(1);
  }

  const workDir = path.join("tmp", `restore-backup-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  try {
    console.log(`ZIP: ${zipPath}`);
    console.log(`VIEWER_EMAIL: ${viewerEmail}`);
    console.log(`mode: ${dryRun ? "dry-run" : "restore"}`);

    const extracted = extractJournalBackupZip(zipPath, workDir);
    const result = await restoreJournalBackupToNewProfile({
      viewerEmail,
      extracted,
      dryRun,
    });

    if (dryRun) {
      console.log(JSON.stringify({ ok: true, dryRun: true, plan: result }, null, 2));
      return;
    }

    console.log(JSON.stringify({ ok: true, restore: result }, null, 2));
  } catch (error) {
    if (error instanceof JournalBackupRestoreError) {
      console.error(JSON.stringify({ ok: false, code: error.code, error: error.message }, null, 2));
      process.exit(1);
    }
    throw error;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

void main();
