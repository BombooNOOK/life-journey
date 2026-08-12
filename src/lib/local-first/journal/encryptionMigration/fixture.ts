import { Directory, Filesystem } from "@capacitor/filesystem";

import {
  applyFoundationSchema,
  closeNamedJournalDatabase,
  openNamedPlaintextJournalDatabase,
} from "@/lib/local-first/journal/database";
import {
  ENC_MIG_FIXTURE_MARKER,
  ENC_MIG_FIXTURE_PLAIN_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";
import { LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function buildEncryptionMigrationFixtureEntries() {
  return [
    {
      stableId: `${ENC_MIG_FIXTURE_MARKER}_e1`,
      dateKey: "2026-08-01",
      title: `${ENC_MIG_FIXTURE_MARKER} 朝の森`,
      content: `${ENC_MIG_FIXTURE_MARKER} 日本語本文その1。テスト専用。`,
      tags: ["森", "朝"],
      legacyServerId: "fixture_legacy_001",
      media: true,
    },
    {
      stableId: `${ENC_MIG_FIXTURE_MARKER}_e2`,
      dateKey: "2026-08-02",
      title: `${ENC_MIG_FIXTURE_MARKER} 空タグ`,
      content: `${ENC_MIG_FIXTURE_MARKER} タグなしエントリ。`,
      tags: [] as string[],
      legacyServerId: null,
      media: false,
    },
    {
      stableId: `${ENC_MIG_FIXTURE_MARKER}_e3`,
      dateKey: "2026-08-03",
      title: `${ENC_MIG_FIXTURE_MARKER} 複数タグ`,
      content: `${ENC_MIG_FIXTURE_MARKER} 複数タグと media metadata。`,
      tags: ["散歩", "雨", "記録"],
      legacyServerId: null,
      media: true,
    },
  ];
}

export function isFixtureStableId(stableId: string): boolean {
  return stableId.startsWith(`${ENC_MIG_FIXTURE_MARKER}_`);
}

export async function createPlaintextEncryptionMigrationFixture(): Promise<{
  dbName: string;
  entryCount: number;
  tagCount: number;
  mediaCount: number;
}> {
  const db = await openNamedPlaintextJournalDatabase(ENC_MIG_FIXTURE_PLAIN_DB);
  await db.execute(`
    DELETE FROM local_media;
    DELETE FROM local_journal_tags;
    DELETE FROM local_journal_entries;
  `);
  await applyFoundationSchema(db);

  const entries = buildEncryptionMigrationFixtureEntries();
  let tagCount = 0;
  let mediaCount = 0;
  const now = "2026-08-12T01:00:00.000Z";

  for (const entry of entries) {
    await db.run(
      `INSERT INTO local_journal_entries (
        stable_id, date_key, title, content, created_at, updated_at,
        tags_json, schema_version, source, local_status, imported_at, legacy_server_id,
        server_updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
      [
        entry.stableId,
        entry.dateKey,
        entry.title,
        entry.content,
        now,
        now,
        JSON.stringify(entry.tags),
        1,
        "local",
        "active",
        now,
        entry.legacyServerId,
        null,
      ],
    );
    for (const tag of entry.tags) {
      await db.run(
        `INSERT INTO local_journal_tags (journal_stable_id, tag) VALUES (?, ?);`,
        [entry.stableId, tag],
      );
      tagCount += 1;
    }
    if (entry.media) {
      const relativePath = `${LOCAL_JOURNAL_MEDIA_ROOT}/${entry.stableId}.png`;
      await Filesystem.mkdir({
        path: LOCAL_JOURNAL_MEDIA_ROOT,
        directory: Directory.Library,
        recursive: true,
      }).catch(() => undefined);
      await Filesystem.writeFile({
        path: relativePath,
        data: TINY_PNG,
        directory: Directory.Library,
      });
      await db.run(
        `INSERT INTO local_media (
          stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
        ) VALUES (?,?,?,?,?,?,?);`,
        [
          `${entry.stableId}_media`,
          entry.stableId,
          "image",
          relativePath,
          now,
          "fixture-checksum",
          "image/png",
        ],
      );
      mediaCount += 1;
    }
  }

  await closeNamedJournalDatabase(ENC_MIG_FIXTURE_PLAIN_DB);
  return {
    dbName: ENC_MIG_FIXTURE_PLAIN_DB,
    entryCount: entries.length,
    tagCount,
    mediaCount,
  };
}
