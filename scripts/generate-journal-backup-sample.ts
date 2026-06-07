/**
 * ローカル DB からバックアップ ZIP を生成して tmp/ に保存（読み取り専用）。
 *
 * 使い方:
 *   npx tsx scripts/generate-journal-backup-sample.ts
 * 任意:
 *   VIEWER_EMAIL=... PROFILE_ID=... OUT=tmp/backup-sample.zip
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { writeJournalBackupZipToPath } from "../src/lib/journal/journalBackupExport";
import { prisma } from "../src/lib/db";

async function main() {
  requireSafeDatabaseUrl({ scriptName: "generate-journal-backup-sample.ts" });

  const viewerEmail = (process.env.VIEWER_EMAIL ?? "").trim();
  const profileIdOverride = (process.env.PROFILE_ID ?? "").trim();

  const profile =
    profileIdOverride
      ? await prisma.profile.findFirst({
          where: { id: profileIdOverride, isArchived: false },
          select: { id: true, nickname: true, email: true },
        })
      : await prisma.profile.findFirst({
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
          select: { id: true, nickname: true, email: true },
        });

  if (!profile) {
    console.error("対象プロフィールが見つかりません。");
    process.exit(1);
  }

  const email = viewerEmail || profile.email;
  const outPath =
    process.env.OUT?.trim() ||
    path.join("tmp", `life-journey-diary-backup_${profile.id.slice(0, 8)}_sample.zip`);

  await mkdir(path.dirname(outPath), { recursive: true });

  const { filename, photoCount } = await writeJournalBackupZipToPath(
    {
      viewerEmail: email,
      profileId: profile.id,
      profileNickname: profile.nickname,
    },
    outPath,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath,
        filename,
        profileId: profile.id,
        profileNickname: profile.nickname,
        viewerEmail: email,
        photoCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
