/**
 * AI-X6.7B7D — Restore threat model + identity-safe authorization.
 *
 * Classification of current product restore (gate OFF):
 *   PARTIAL — imports into viewerEmail as NEW profile/entries; does not
 *   claim existing rows by email equality, but also has no provenance check.
 *
 * Identity mode (gate ON):
 *   - Require BOUND lifecycle subject
 *   - Never authorize because backup email == current email
 *   - If backup carries ownership.firebaseUid / stableActorKey and it mismatches
 *     current subject → DENY
 *   - Missing provenance → allow import INTO current identity only (new rows),
 *     with identityId dual-write; still not email-claim
 *
 * Backup format recommendation (future):
 *   document.ownership = {
 *     firebaseUid?: string,
 *     stableActorKey?: string, // firebase:<UID>
 *     historicalEmails?: string[], // metadata only
 *   }
 * Do NOT require raw AccountIdentity DB id for portability.
 */

import { normalizeEmail } from "@/lib/auth/viewer";
import { dualWriteIdentityIdOrNull } from "@/lib/account/p0IdentityOwnership";
import { isP0IdentityDualWriteEnabled } from "@/lib/account/p0IdentityDualWriteGate";
import { isIdentityRestoreAuthorityEnabled } from "@/lib/lifecycle/lifecycleIdentityGates";
import {
  resolveLifecycleSubject,
  type LifecycleSubject,
} from "@/lib/lifecycle/lifecycleSubject";
import type { JournalBackupDocument } from "@/lib/journal/journalBackupExport";

export type RestoreClassification =
  | "SAFE"
  | "UNSAFE"
  | "PARTIAL"
  | "NOT_IMPLEMENTED";

/** Gate-OFF product restore: PARTIAL (no email-claim, no provenance). */
export const CURRENT_RESTORE_CLASSIFICATION: RestoreClassification = "PARTIAL";

export type BackupOwnershipProvenance = {
  firebaseUid?: string | null;
  stableActorKey?: string | null;
  historicalEmails?: string[] | null;
};

export function extractBackupOwnershipProvenance(
  document: JournalBackupDocument & { ownership?: BackupOwnershipProvenance },
): BackupOwnershipProvenance | null {
  const o = document.ownership;
  if (!o) return null;
  return {
    firebaseUid: o.firebaseUid ?? null,
    stableActorKey: o.stableActorKey ?? null,
    historicalEmails: o.historicalEmails ?? null,
  };
}

export type RestoreAuthResult =
  | {
      ok: true;
      subject: Extract<LifecycleSubject, { state: "BOUND" }>;
      writeIdentityId: string | null;
      /** Explicit: email equality was NOT used as authority. */
      emailEqualityUsedAsAuthority: false;
    }
  | {
      ok: false;
      reason: string;
      state: string;
    };

/**
 * Authorize restore under identity mode.
 * UID-B with EMAIL-A cannot claim UID-A backup when provenance mismatches.
 */
export async function authorizeIdentityRestore(input: {
  viewerEmail: string;
  document: JournalBackupDocument & { ownership?: BackupOwnershipProvenance };
  subject?: LifecycleSubject;
}): Promise<RestoreAuthResult> {
  if (!isIdentityRestoreAuthorityEnabled()) {
    // Legacy: no identity gate — caller uses existing path.
    return {
      ok: false,
      reason: "legacy_gate_off",
      state: "LEGACY",
    };
  }

  const subject = input.subject ?? (await resolveLifecycleSubject());
  if (subject.state !== "BOUND") {
    return { ok: false, reason: subject.reason, state: subject.state };
  }

  const provenance = extractBackupOwnershipProvenance(input.document);
  if (provenance?.firebaseUid && provenance.firebaseUid !== subject.firebaseUid) {
    return {
      ok: false,
      reason: "backup_firebase_uid_mismatch",
      state: "NOT_OWNED",
    };
  }
  if (
    provenance?.stableActorKey &&
    provenance.stableActorKey !== subject.stableActorKey
  ) {
    return {
      ok: false,
      reason: "backup_stable_actor_key_mismatch",
      state: "NOT_OWNED",
    };
  }

  // Historical email in backup matching current email is NOT authority.
  const currentEmail = normalizeEmail(input.viewerEmail);
  const backupEmails = provenance?.historicalEmails ?? [];
  const emailMatch =
    currentEmail &&
    backupEmails.some((e) => e.trim().toLowerCase() === currentEmail);
  void emailMatch; // explicitly ignored as authority

  const writeIdentityId = dualWriteIdentityIdOrNull({
    dualWriteEnabled: true,
    ownership: {
      state: "BOUND",
      identityId: subject.identityId,
      firebaseUid: subject.firebaseUid,
      evidenceSource: "VERIFIED_FIREBASE_UID",
      legacyActorKeys: subject.legacyActorKeys,
      verifiedEmailMetadata: subject.verifiedEmailMetadata,
      reason: "lifecycle_restore",
    },
  });

  return {
    ok: true,
    subject,
    writeIdentityId:
      writeIdentityId ??
      (isP0IdentityDualWriteEnabled() ? subject.identityId : subject.identityId),
    emailEqualityUsedAsAuthority: false,
  };
}

export const BACKUP_OWNERSHIP_FORMAT_RECOMMENDATION = [
  "Add optional document.ownership.{firebaseUid,stableActorKey,historicalEmails}.",
  "historicalEmails are provenance/metadata only — never restore authority.",
  "Do not embed AccountIdentity.id as the sole portable owner key.",
  "Restore target identity always derives from verified UID of the importer.",
  "Mismatch of firebaseUid/stableActorKey → DENY (stolen backup).",
  "Absent provenance → import into current identity only; never claim by email.",
] as const;
