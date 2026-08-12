/**
 * Read-only sqlite artifact inspection (Foundation).
 * Names, sizes, generic roles only. No delete / unlink / connection cleanup.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity } from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type StorageArtifactRole =
  | "sqlite_db"
  | "sidecar_wal"
  | "sidecar_shm"
  | "sidecar_journal"
  | "other";

export type StorageArtifactListing = {
  name: string;
  bytes: number;
  role: StorageArtifactRole | string;
};

export function classifySqliteArtifactRole(fileName: string): StorageArtifactRole {
  if (fileName.endsWith("-wal") || fileName.includes(".db-wal")) return "sidecar_wal";
  if (fileName.endsWith("-shm") || fileName.includes(".db-shm")) return "sidecar_shm";
  if (fileName.includes("-journal")) return "sidecar_journal";
  if (fileName.endsWith("SQLite.db") || fileName.endsWith(".db")) return "sqlite_db";
  return "other";
}

export async function listSqliteArtifactsReadOnly(): Promise<StorageArtifactListing[]> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "sqlite artifact inspection is native-only",
    );
  }
  try {
    const listing = await LjdLocalSecurity.listSqliteArtifactsInLjdDir();
    return (listing.artifacts ?? []).map((item) => ({
      name: item.name,
      bytes: Number(item.bytes) || 0,
      role: item.role || classifySqliteArtifactRole(item.name),
    }));
  } catch (error) {
    throw mapSecurityError(error);
  }
}
