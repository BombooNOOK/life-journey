import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import { ENC_MIG_FIXTURE_MARKER } from "@/lib/local-first/journal/encryptionMigration/types";

export {
  closeNamedJournalDatabase,
  openNamedPlaintextJournalDatabase,
} from "@/lib/local-first/journal/database";

export async function inventorySafeCounts(db: SQLiteDBConnection): Promise<{
  looksLikeRealUserData: boolean;
  fixtureLikeCount: number;
  otherCount: number;
}> {
  const rows = await db.query(
    `SELECT stable_id, source, length(content) AS content_len
     FROM local_journal_entries;`,
  );
  let fixtureLikeCount = 0;
  let otherCount = 0;
  for (const row of rows.values ?? []) {
    const id = String(row.stable_id ?? "");
    if (id.startsWith(`${ENC_MIG_FIXTURE_MARKER}_`)) fixtureLikeCount += 1;
    else otherCount += 1;
  }
  return {
    looksLikeRealUserData: otherCount > 0,
    fixtureLikeCount,
    otherCount,
  };
}
