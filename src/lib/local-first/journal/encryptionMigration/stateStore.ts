import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import type {
  EncryptionMigrationPhase,
  EncryptionMigrationState,
} from "@/lib/local-first/journal/encryptionMigration/types";
import {
  ENC_MIG_FIXTURE_PLAIN_DB,
  ENC_MIG_FIXTURE_PROMOTED_DB,
  ENC_MIG_FIXTURE_STAGING_DB,
} from "@/lib/local-first/journal/encryptionMigration/types";

export const ENC_MIG_STATE_RELATIVE = "ljd/security-poc/enc-mig-state.json";

export function createInitialState(
  overrides?: Partial<EncryptionMigrationState>,
): EncryptionMigrationState {
  return {
    phase: "not_started",
    sourceDb: ENC_MIG_FIXTURE_PLAIN_DB,
    stagingDb: ENC_MIG_FIXTURE_STAGING_DB,
    promotedDb: ENC_MIG_FIXTURE_PROMOTED_DB,
    updatedAt: new Date().toISOString(),
    lastError: null,
    sourcePreserved: true,
    secretStoredInLog: false,
    ...overrides,
  };
}

export function canExplicitResume(phase: EncryptionMigrationPhase): boolean {
  return phase === "staging" || phase === "verified" || phase === "failed";
}

export function canExplicitRollback(phase: EncryptionMigrationPhase): boolean {
  return phase === "staging" || phase === "verified" || phase === "failed" || phase === "promoted";
}

export function shouldNoOp(phase: EncryptionMigrationPhase): boolean {
  return phase === "promoted";
}

/** Kill/resume: never auto-run. Diagnostics decide resume vs rollback. */
export function describeKillResume(phase: EncryptionMigrationPhase): {
  canResume: boolean;
  canRollback: boolean;
  autoRun: false;
} {
  return {
    canResume: canExplicitResume(phase),
    canRollback: canExplicitRollback(phase),
    autoRun: false,
  };
}

export async function readMigrationState(): Promise<EncryptionMigrationState> {
  try {
    const file = await Filesystem.readFile({
      path: ENC_MIG_STATE_RELATIVE,
      directory: Directory.Library,
      encoding: Encoding.UTF8,
    });
    const parsed = JSON.parse(String(file.data)) as EncryptionMigrationState;
    if (!parsed?.phase) return createInitialState();
    return { ...createInitialState(), ...parsed, sourcePreserved: true, secretStoredInLog: false };
  } catch {
    return createInitialState();
  }
}

export async function writeMigrationState(
  state: EncryptionMigrationState,
): Promise<void> {
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  const safe: EncryptionMigrationState = {
    ...state,
    updatedAt: new Date().toISOString(),
    sourcePreserved: true,
    secretStoredInLog: false,
    lastError: state.lastError,
  };
  await Filesystem.writeFile({
    path: ENC_MIG_STATE_RELATIVE,
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(safe, null, 2),
  });
}
