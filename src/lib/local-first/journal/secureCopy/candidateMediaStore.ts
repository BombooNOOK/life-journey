/**
 * Filesystem media for the encrypted candidate only.
 * Never writes under the active journal media root.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

import { LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import type { CandidateMediaPort } from "@/lib/local-first/journal/secureCopy/types";
import { SECURE_CANDIDATE_MEDIA_ROOT } from "@/lib/local-first/journal/secureCopy/types";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("candidate media store is native-only");
  }
}

function assertCandidateRelativePath(relativePath: string): void {
  if (!relativePath.startsWith(`${SECURE_CANDIDATE_MEDIA_ROOT}/`)) {
    throw new Error("candidate media path must stay in journal-secure-candidate namespace");
  }
  if (relativePath.startsWith(`${LOCAL_JOURNAL_MEDIA_ROOT}/`)) {
    throw new Error("candidate media store refuses active journal media root");
  }
  if (relativePath.startsWith("/") || relativePath.includes("..")) {
    throw new Error("absolute or parent media paths are forbidden");
  }
}

export async function createNativeCandidateMediaStore(): Promise<CandidateMediaPort> {
  assertNative();
  try {
    await Filesystem.mkdir({
      path: SECURE_CANDIDATE_MEDIA_ROOT,
      directory: Directory.Library,
      recursive: true,
    });
  } catch {
    /* exists */
  }
  return {
    root: SECURE_CANDIDATE_MEDIA_ROOT,
    async write(fileName: string, base64: string): Promise<string> {
      const relativePath = `${SECURE_CANDIDATE_MEDIA_ROOT}/${fileName}`;
      assertCandidateRelativePath(relativePath);
      await Filesystem.writeFile({
        path: relativePath,
        data: base64,
        directory: Directory.Library,
      });
      return relativePath;
    },
    async readBase64(relativePath: string): Promise<string> {
      assertCandidateRelativePath(relativePath);
      const result = await Filesystem.readFile({
        path: relativePath,
        directory: Directory.Library,
      });
      if (typeof result.data !== "string" || !result.data) {
        throw new Error("candidate media read returned empty data");
      }
      return result.data;
    },
    async delete(relativePath: string): Promise<void> {
      assertCandidateRelativePath(relativePath);
      try {
        await Filesystem.deleteFile({
          path: relativePath,
          directory: Directory.Library,
        });
      } catch {
        /* missing */
      }
    },
  };
}
