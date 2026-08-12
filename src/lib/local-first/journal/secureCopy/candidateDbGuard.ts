import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import { SERVER_COPY_TARGET_DB_NAME } from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

const ALLOWED = new Set<string>([SERVER_COPY_TARGET_DB_NAME]);

export function assertAllowedCopyTargetDb(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "server copy refuses ljd_local_journal",
    );
  }
  if (!ALLOWED.has(name) || name !== LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME) {
    throw new LocalFirstSecurityError(
      "unknown",
      "server copy target is not the encrypted candidate allowlist",
    );
  }
}
