/**
 * Activation manifest filesystem port + Application Support store.
 * Never uses localStorage / sessionStorage / Keychain for the pointer.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity } from "ljd-local-security";

import {
  attachManifestChecksum,
  verifyManifestChecksum,
} from "@/lib/local-first/journal/activation/manifestCanonical";
import type {
  LocalJournalActivationManifest,
  ManifestChecksumBody,
  ManifestReadStatus,
} from "@/lib/local-first/journal/activation/types";
import {
  ACTIVATION_MANIFEST_FILE_NAME,
  ACTIVATION_MANIFEST_FORMAT_VERSION,
} from "@/lib/local-first/journal/activation/types";
import { resolveLjdApplicationSupportDir } from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type ManifestFsPort = {
  readText(absolutePath: string): Promise<{ exists: boolean; contents: string | null }>;
  /**
   * temp → synchronize/fsync → atomic replace.
   * Must not leave a truncated final file on failure.
   */
  atomicReplaceText(absolutePath: string, contents: string): Promise<void>;
};

export type ManifestReadResult =
  | { status: "missing"; manifest: null }
  | { status: "ok"; manifest: LocalJournalActivationManifest }
  | {
      status: Exclude<ManifestReadStatus, "missing" | "ok">;
      manifest: null;
      detail: string;
    };

function isActivationState(value: unknown): value is LocalJournalActivationManifest["activationState"] {
  return (
    value === "inactive" ||
    value === "activating" ||
    value === "active" ||
    value === "rollback_pending"
  );
}

function parseManifestShape(raw: unknown): LocalJournalActivationManifest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.formatVersion !== "number") return null;
  if (typeof o.generation !== "number") return null;
  if (typeof o.activeDatabaseId !== "string" || !o.activeDatabaseId) return null;
  if (typeof o.activeMediaRootId !== "string" || !o.activeMediaRootId) return null;
  if (!(o.previousDatabaseId === null || typeof o.previousDatabaseId === "string")) return null;
  if (!(o.previousMediaRootId === null || typeof o.previousMediaRootId === "string")) return null;
  if (!isActivationState(o.activationState)) return null;
  if (typeof o.schemaVersion !== "number") return null;
  if (!(o.activatedAt === null || typeof o.activatedAt === "string")) return null;
  if (typeof o.checksum !== "string" || !o.checksum) return null;
  return {
    formatVersion: o.formatVersion as LocalJournalActivationManifest["formatVersion"],
    generation: o.generation,
    activeDatabaseId: o.activeDatabaseId,
    activeMediaRootId: o.activeMediaRootId,
    previousDatabaseId: o.previousDatabaseId,
    previousMediaRootId: o.previousMediaRootId,
    activationState: o.activationState,
    schemaVersion: o.schemaVersion,
    activatedAt: o.activatedAt,
    checksum: o.checksum,
  };
}

export function createMemoryManifestFs(): ManifestFsPort & {
  files: Map<string, string>;
  replaceCalls: number;
} {
  const files = new Map<string, string>();
  return {
    files,
    replaceCalls: 0,
    async readText(absolutePath) {
      if (!files.has(absolutePath)) return { exists: false, contents: null };
      return { exists: true, contents: files.get(absolutePath)! };
    },
    async atomicReplaceText(absolutePath, contents) {
      this.replaceCalls += 1;
      files.set(absolutePath, contents);
    },
  };
}

export async function createNativeManifestFs(): Promise<ManifestFsPort> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "manifest FS is native-only");
  }
  return {
    async readText(absolutePath) {
      const result = await LjdLocalSecurity.readTextFile({ path: absolutePath });
      return {
        exists: result.exists,
        contents: result.contents ?? null,
      };
    },
    async atomicReplaceText(absolutePath, contents) {
      await LjdLocalSecurity.atomicReplaceTextFile({
        path: absolutePath,
        contents,
      });
    },
  };
}

export async function resolveActivationManifestAbsolutePath(): Promise<string> {
  const asDir = await resolveLjdApplicationSupportDir();
  return `${asDir.ljdApplicationSupportDir}/${ACTIVATION_MANIFEST_FILE_NAME}`;
}

export const LocalJournalActivationManifestStore = {
  async readWithFs(
    absolutePath: string,
    fs: ManifestFsPort,
  ): Promise<ManifestReadResult> {
    const file = await fs.readText(absolutePath);
    if (!file.exists || file.contents == null) {
      return { status: "missing", manifest: null };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.contents);
    } catch {
      return { status: "corrupt_json", manifest: null, detail: "json_parse_failed" };
    }
    const shape = parseManifestShape(parsed);
    if (!shape) {
      return { status: "invalid_shape", manifest: null, detail: "missing_required_fields" };
    }
    if (shape.formatVersion !== ACTIVATION_MANIFEST_FORMAT_VERSION) {
      return {
        status: "unknown_format",
        manifest: null,
        detail: `formatVersion=${shape.formatVersion}`,
      };
    }
    const ok = await verifyManifestChecksum(shape);
    if (!ok) {
      return { status: "checksum_mismatch", manifest: null, detail: "checksum_mismatch" };
    }
    return { status: "ok", manifest: shape };
  },

  async writeBodyWithFs(
    absolutePath: string,
    body: ManifestChecksumBody,
    fs: ManifestFsPort,
  ): Promise<LocalJournalActivationManifest> {
    const manifest = await attachManifestChecksum(body);
    const json = `${JSON.stringify(manifest, null, 2)}\n`;
    await fs.atomicReplaceText(absolutePath, json);
    return manifest;
  },

  async readNative(): Promise<ManifestReadResult> {
    const path = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return this.readWithFs(path, fs);
  },

  async writeBodyNative(body: ManifestChecksumBody): Promise<LocalJournalActivationManifest> {
    const path = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return this.writeBodyWithFs(path, body, fs);
  },
};
