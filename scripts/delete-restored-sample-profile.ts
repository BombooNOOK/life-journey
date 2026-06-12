/**
 * 運営・開発者向け: 復元テスト用プロフィール「サンプル（復元）」を削除。
 *
 * 使い方:
 *   ALLOW_PROD_DB=1 ALLOW_PROD_DB_MUTATION=1 npx tsx scripts/delete-restored-sample-profile.ts
 */
import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { deleteJournalEntryPhotoBlobBestEffort } from "../src/lib/journal/journalEntryPhotoBlob";
import { prisma } from "../src/lib/db";

const RESTORED_PROFILE_ID = "cmq4jnnxk0000a1gv7fxolmmr";
const ORIGINAL_PROFILE_ID = "legacy:1888dd05fa3c123c1b723aeeb371acc2";

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "delete-restored-sample-profile.ts",
    mutatesDatabase: true,
  });

  const restored = await prisma.profile.findFirst({
    where: { id: RESTORED_PROFILE_ID, nickname: "サンプル（復元）", isArchived: false },
    select: { id: true, nickname: true },
  });
  if (!restored) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: "already deleted" }));
    return;
  }

  const original = await prisma.profile.findUnique({
    where: { id: ORIGINAL_PROFILE_ID },
    select: { id: true, nickname: true },
  });
  if (!original || original.nickname !== "サンプル") {
    throw new Error("元サンプルプロフィールの確認に失敗しました。中止します。");
  }

  const entries = await prisma.journalEntry.findMany({
    where: { profileId: restored.id },
    select: { id: true, photoBlobPathname: true, photoBlobUrl: true },
  });

  let blobsDeleted = 0;
  for (const entry of entries) {
    if (entry.photoBlobPathname || entry.photoBlobUrl) {
      await deleteJournalEntryPhotoBlobBestEffort(entry.photoBlobPathname, entry.photoBlobUrl);
      blobsDeleted += 1;
    }
  }

  const deletedEntries = await prisma.journalEntry.deleteMany({ where: { profileId: restored.id } });
  await prisma.profile.delete({ where: { id: restored.id } });

  const originalEntryCount = await prisma.journalEntry.count({
    where: { profileId: ORIGINAL_PROFILE_ID },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        deletedProfile: restored.nickname,
        deletedProfileId: restored.id,
        deletedEntries: deletedEntries.count,
        blobsDeleted,
        originalPreserved: original,
        originalEntryCount,
      },
      null,
      2,
    ),
  );
}

void main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
