import { unzipSync } from "fflate";

import type { JournalBackupDocument } from "@/lib/journal/journalBackupExport";

export function unzipBufferToFileMap(buffer: Buffer): Map<string, Buffer> {
  const unzipped = unzipSync(new Uint8Array(buffer));
  const map = new Map<string, Buffer>();
  for (const [name, data] of Object.entries(unzipped)) {
    if (!name || name.endsWith("/")) continue;
    const bytes = Array.isArray(data) ? data[0] : data;
    if (!bytes || bytes.byteLength === 0) continue;
    map.set(name, Buffer.from(bytes));
  }
  return map;
}

export function listZipEntryNamesFromBuffer(buffer: Buffer): string[] {
  return [...unzipBufferToFileMap(buffer).keys()].sort();
}

export function hasKanteiHintsInBackupProfile(profile: JournalBackupDocument["profile"]): boolean {
  return Boolean(
    profile.birthDate?.trim() ||
      profile.lifePathNumber != null ||
      profile.birthMonth != null ||
      profile.birthDay != null,
  );
}
