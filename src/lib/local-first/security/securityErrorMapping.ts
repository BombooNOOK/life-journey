import {
  LocalFirstSecurityError,
  type SecurityErrorCode,
} from "@/lib/local-first/security/types";
import { safeErrorMessage } from "@/lib/local-first/security/noSecretLog";

export function mapSecurityError(error: unknown): LocalFirstSecurityError {
  if (error instanceof LocalFirstSecurityError) return error;
  const message = safeErrorMessage(error);
  let code: SecurityErrorCode = "unknown";
  if (/native-only|native only/i.test(message)) code = "native_only";
  else if (/path required/i.test(message)) code = "path_required";
  else if (/journal_encryption_forbidden|must not be opened encrypted/i.test(message)) {
    code = "journal_encryption_forbidden";
  } else if (/not implemented on web|unimplemented/i.test(message)) {
    code = "bridge_unimplemented";
  }
  return new LocalFirstSecurityError(code, message);
}
