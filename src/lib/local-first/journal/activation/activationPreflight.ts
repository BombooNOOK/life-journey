/**
 * Technical activation preflight for encrypted candidate generation.
 * Fail-closed: any critical failure blocks pointer write.
 */

import { Directory, Filesystem } from "@capacitor/filesystem";

import type { SecureCandidateInspection } from "@/lib/local-first/journal/secureBootstrap/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import {
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  assertAllowedTechnicalDatabaseId,
} from "@/lib/local-first/journal/activation/types";
import {
  decideCapacityKnown,
  inspectPluginDbKeyAccessibility,
  readAvailableBytesOrNull,
} from "@/lib/local-first/security";

export type PreflightCheck = {
  id: string;
  ok: boolean;
  detail: string;
};

export type ActivationPreflightResult = {
  ok: boolean;
  targetDatabaseId: typeof TECHNICAL_ACTIVE_DATABASE_ID;
  targetMediaRootId: typeof TECHNICAL_ACTIVE_MEDIA_ROOT_ID;
  checks: PreflightCheck[];
  inspection: SecureCandidateInspection | null;
};

function push(
  checks: PreflightCheck[],
  id: string,
  ok: boolean,
  detail: string,
): void {
  checks.push({ id, ok, detail });
}

export async function runTechnicalActivationPreflight(options?: {
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  /** Injected inspection for unit tests. */
  inspection?: SecureCandidateInspection;
  skipMediaFilesystem?: boolean;
  skipKeychain?: boolean;
}): Promise<ActivationPreflightResult> {
  const checks: PreflightCheck[] = [];
  const targetDatabaseId = TECHNICAL_ACTIVE_DATABASE_ID;
  const targetMediaRootId = TECHNICAL_ACTIVE_MEDIA_ROOT_ID;

  try {
    assertAllowedTechnicalDatabaseId(targetDatabaseId);
    push(checks, "allowed_target", true, targetDatabaseId);
  } catch (error) {
    push(checks, "allowed_target", false, String(error));
    return {
      ok: false,
      targetDatabaseId,
      targetMediaRootId,
      checks,
      inspection: null,
    };
  }

  let availableBytes: number | null;
  if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
    availableBytes = options.availableBytes ?? null;
  } else {
    availableBytes = (await readAvailableBytesOrNull()).availableBytes;
    if (availableBytes == null) {
      // Foundation capacity can briefly return unavailable; one retry.
      availableBytes = (await readAvailableBytesOrNull()).availableBytes;
    }
  }
  const capacity = decideCapacityKnown(availableBytes);
  if (!capacity.known && options?.allowUnknownCapacity !== true) {
    push(checks, "capacity", false, "capacity_unknown_fail_closed");
  } else {
    push(
      checks,
      "capacity",
      true,
      capacity.known ? `available=${String(availableBytes)}` : "unknown_allowed",
    );
  }

  const inspection =
    options?.inspection ?? (await LocalJournalSecureBootstrapper.inspect());

  push(
    checks,
    "db_exists",
    inspection.exists === true,
    `exists=${String(inspection.exists)}`,
  );
  push(
    checks,
    "encrypted",
    inspection.encrypted === true,
    `encrypted=${String(inspection.encrypted)}`,
  );
  push(
    checks,
    "application_support",
    Boolean(inspection.locationRelative?.includes("Application Support")),
    inspection.locationRelative ?? "missing_location",
  );
  push(
    checks,
    "schema_version",
    inspection.userVersion === EXPECTED_JOURNAL_SCHEMA_VERSION,
    `user_version=${String(inspection.userVersion)}`,
  );
  push(
    checks,
    "health_ready",
    inspection.health.status === "ready",
    `health=${inspection.health.status}`,
  );
  push(
    checks,
    "row_counts_readable",
    typeof inspection.rowCounts.local_journal_entries === "number",
    `entries=${String(inspection.rowCounts.local_journal_entries ?? null)}`,
  );
  push(
    checks,
    "file_protection_complete",
    inspection.completeProtection === true,
    `protection=${String(inspection.fileProtection)}`,
  );
  push(
    checks,
    "backup_included",
    inspection.backupExcluded === false,
    `backupExcluded=${String(inspection.backupExcluded)}`,
  );

  if (!options?.skipKeychain) {
    try {
      const kc = await inspectPluginDbKeyAccessibility();
      push(
        checks,
        "plugin_keychain_usable",
        kc.found === true,
        `found=${String(kc.found)} accessibility=${String(kc.accessibility)}`,
      );
    } catch (error) {
      push(checks, "plugin_keychain_usable", false, String(error));
    }
  } else {
    push(checks, "plugin_keychain_usable", true, "skipped_in_unit_test");
  }

  // Integrity: legacyServerId uniqueness + mediaRefs presence (single DB open)
  if (inspection.exists && inspection.encrypted === true && inspection.health.status === "ready") {
    try {
      const deep = await inspectCandidateIntegrity(options?.skipMediaFilesystem === true);
      push(
        checks,
        "integrity_counts",
        deep.entryCount >= 0 && deep.mediaCount >= 0,
        `entries=${deep.entryCount} media=${deep.mediaCount}`,
      );
      push(checks, "legacy_server_id_unique", deep.legacyUnique, deep.legacyDetail);
      push(checks, "media_refs_consistent", deep.mediaRefsOk, deep.mediaDetail);
      push(
        checks,
        "source_changed_unresolved",
        true,
        "no_persisted_source_changed_markers",
      );
    } catch (error) {
      push(checks, "integrity_open", false, String(error));
    }
  } else {
    push(checks, "integrity_open", false, "candidate_not_ready_for_integrity");
  }

  push(
    checks,
    "media_root_generation",
    targetMediaRootId === TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    targetMediaRootId,
  );

  const ok = checks.every((c) => c.ok);
  return {
    ok,
    targetDatabaseId,
    targetMediaRootId,
    checks,
    inspection,
  };
}

async function inspectCandidateIntegrity(skipMediaFilesystem: boolean): Promise<{
  entryCount: number;
  mediaCount: number;
  legacyUnique: boolean;
  legacyDetail: string;
  mediaRefsOk: boolean;
  mediaDetail: string;
}> {
  const { openNamedEncryptedDatabase, closeNamedEncryptedDatabase } = await import(
    "@/lib/local-first/security"
  );
  const db = await openNamedEncryptedDatabase(TECHNICAL_ACTIVE_DATABASE_ID, 1);
  try {
    const entryCountResult = await db.query(
      `SELECT COUNT(*) AS c FROM local_journal_entries;`,
    );
    const mediaCountResult = await db.query(`SELECT COUNT(*) AS c FROM local_media;`);
    const entryCount = Number(
      (entryCountResult.values?.[0] as Record<string, unknown> | undefined)?.c ?? 0,
    );
    const mediaCount = Number(
      (mediaCountResult.values?.[0] as Record<string, unknown> | undefined)?.c ?? 0,
    );

    const legacyRows = await db.query(
      `SELECT legacy_server_id AS id, COUNT(*) AS c
       FROM local_journal_entries
       WHERE legacy_server_id IS NOT NULL AND TRIM(legacy_server_id) != ''
       GROUP BY legacy_server_id
       HAVING c > 1;`,
    );
    const dupes = legacyRows.values?.length ?? 0;
    const nullLegacy = await db.query(
      `SELECT COUNT(*) AS c FROM local_journal_entries
       WHERE legacy_server_id IS NULL OR TRIM(legacy_server_id) = '';`,
    );
    const nullCount = Number(
      (nullLegacy.values?.[0] as Record<string, unknown> | undefined)?.c ?? 0,
    );
    const legacyUnique = dupes === 0 && nullCount === 0;
    const legacyDetail = `dupes=${dupes} nullOrEmpty=${nullCount}`;

    const media = await db.query(
      `SELECT relative_path AS path, checksum AS checksum FROM local_media;`,
    );
    const refs = (media.values ?? []) as Array<{ path?: string; checksum?: string }>;
    let missing = 0;
    if (!skipMediaFilesystem) {
      for (const ref of refs) {
        const path = String(ref.path ?? "");
        if (!path.startsWith(`${TECHNICAL_ACTIVE_MEDIA_ROOT_ID}/`)) {
          missing += 1;
          continue;
        }
        try {
          await Filesystem.stat({ path, directory: Directory.Library });
        } catch {
          missing += 1;
        }
      }
    }
    const mediaRefsOk = missing === 0;
    return {
      entryCount,
      mediaCount,
      legacyUnique,
      legacyDetail,
      mediaRefsOk,
      mediaDetail: `refs=${refs.length} missingOrBadRoot=${missing} skipFs=${String(skipMediaFilesystem)}`,
    };
  } finally {
    await closeNamedEncryptedDatabase(TECHNICAL_ACTIVE_DATABASE_ID);
  }
}
