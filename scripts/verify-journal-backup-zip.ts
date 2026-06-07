/**
 * 生成済みバックアップ ZIP の中身を検証（読み取り専用）。
 *
 * 使い方:
 *   npx tsx scripts/verify-journal-backup-zip.ts tmp/backup-sample.zip
 *   npx tsx scripts/verify-journal-backup-zip.ts tmp/backup.zip --expected-profile-id=...
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import type { JournalBackupDocument } from "../src/lib/journal/journalBackupExport";

type CheckResult = {
  id: number;
  label: string;
  ok: boolean;
  detail: string;
};

function parseArgs(argv: string[]) {
  const zipPath = argv[0]?.trim();
  const expectedProfileId = argv.find((a) => a.startsWith("--expected-profile-id="))?.split("=")[1]?.trim();
  return { zipPath, expectedProfileId };
}

function unzipList(zipPath: string): string[] {
  const out = execSync(`unzip -Z1 ${JSON.stringify(zipPath)}`, { encoding: "utf8" });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function unzipExtractFile(zipPath: string, innerPath: string, destDir: string): string {
  execSync(`unzip -oq ${JSON.stringify(zipPath)} ${JSON.stringify(innerPath)} -d ${JSON.stringify(destDir)}`, {
    encoding: "utf8",
  });
  return path.join(destDir, innerPath);
}

function main() {
  const { zipPath, expectedProfileId } = parseArgs(process.argv.slice(2));
  if (!zipPath || !existsSync(zipPath)) {
    console.error("Usage: npx tsx scripts/verify-journal-backup-zip.ts <zip-path> [--expected-profile-id=...]");
    process.exit(1);
  }

  const workDir = path.join("tmp", `verify-backup-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  const results: CheckResult[] = [];
  const push = (id: number, label: string, ok: boolean, detail: string) => {
    results.push({ id, label, ok, detail });
  };

  try {
    const stat = readFileSync(zipPath);
    push(1, "ZIPファイルが存在し読み取れる", stat.byteLength > 0, `${stat.byteLength} bytes`);

    let names: string[] = [];
    try {
      names = unzipList(zipPath);
      push(2, "ZIPを展開一覧できる", names.length > 0, `${names.length} entries`);
    } catch (error) {
      push(2, "ZIPを展開一覧できる", false, error instanceof Error ? error.message : String(error));
    }

    const hasBackupJson = names.includes("backup.json");
    push(3, "backup.json が入っている", hasBackupJson, hasBackupJson ? "found" : "missing");

    const photoFiles = names.filter((n) => n.startsWith("photos/") && n !== "photos/");
    push(4, "photos/ フォルダにファイルがある（写真付き記事がある場合）", true, `${photoFiles.length} photo file(s)`);

    let doc: JournalBackupDocument | null = null;
    if (hasBackupJson) {
      const jsonPath = unzipExtractFile(zipPath, "backup.json", workDir);
      doc = JSON.parse(readFileSync(jsonPath, "utf8")) as JournalBackupDocument;
    }

    if (doc) {
      const withPhotos = doc.entries.filter((e) => e.photos.length > 0);
      const withoutPhotos = doc.entries.filter((e) => e.photos.length === 0);
      push(
        5,
        "写真付き記事の写真が photos/ に入っている",
        withPhotos.every((e) => e.photos.every((p) => names.includes(p.filename))),
        `${withPhotos.length} entries with photos`,
      );
      push(
        6,
        "写真なし記事は photos: []",
        withoutPhotos.every((e) => e.photos.length === 0),
        `${withoutPhotos.length} entries without photos`,
      );

      const blobEntries = doc.entries.flatMap((e) => e.photos.filter((p) => p.source === "blob"));
      const legacyEntries = doc.entries.flatMap((e) => e.photos.filter((p) => p.source === "legacy_data_url"));
      push(
        7,
        "Blob写真の参照がある",
        blobEntries.length === 0 || blobEntries.every((p) => names.includes(p.filename)),
        `blob refs=${blobEntries.length}`,
      );
      push(
        8,
        "legacy photoDataUrl 参照がある",
        legacyEntries.length === 0 || legacyEntries.every((p) => names.includes(p.filename)),
        `legacy refs=${legacyEntries.length}`,
      );

      const linkOk = doc.entries.every((entry) =>
        entry.photos.every((photo) => {
          const expectedPrefix = `photos/entry_${entry.id}`;
          return photo.filename.startsWith(expectedPrefix) && names.includes(photo.filename);
        }),
      );
      push(9, "backup.json の entry と写真ファイル名が紐づく", linkOk, `entries=${doc.entries.length}`);

      if (expectedProfileId) {
        push(
          10,
          "アクティブプロフィールのみ（profile.id 一致）",
          doc.profile.id === expectedProfileId,
          `expected=${expectedProfileId} actual=${doc.profile.id}`,
        );
      } else {
        push(10, "profile.id が設定されている", Boolean(doc.profile.id), `profile.id=${doc.profile.id}`);
      }

      push(11, "他ユーザー情報は含まれない（emailはJSONに含めない）", !("email" in (doc as object)), "no top-level email field");

      push(12, "ZIPファイル名形式", /^life-journey-diary-backup_[a-zA-Z0-9]+_\d{8}\.zip$/.test(path.basename(zipPath)), path.basename(zipPath));

      push(13, "photoPolicy メタ情報", doc.photoPolicy?.exportedPhotoType === "processed", doc.photoPolicy?.exportedPhotoType ?? "missing");
      push(14, "format / formatVersion", doc.format === "life-journey-diary-backup" && doc.formatVersion === 1, `format=${doc.format} v=${doc.formatVersion}`);
    } else {
      for (const id of [5, 6, 7, 8, 9, 10, 11, 13, 14]) {
        push(id, "backup.json 未読のためスキップ", false, "backup.json missing");
      }
      push(12, "ZIPファイル名形式", /^life-journey-diary-backup_[a-zA-Z0-9]+_\d{8}\.zip$/.test(path.basename(zipPath)), path.basename(zipPath));
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ zipPath, results, ok: failed.length === 0 }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
