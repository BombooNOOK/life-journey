/**
 * Local Journal generation registry (4B-4K).
 * Lifecycle metadata only — never journal body / photo / secrets.
 * Not wired to production Journal save.
 */

import {
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
} from "@/lib/local-first/journal/activation/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

/** PoC DB name under Application Support (plain SQLite). Formal name TBD. */
export const LOCAL_GENERATION_REGISTRY_POC_DB_NAME =
  "ljd_local_generation_registry_poc" as const;

export const REGISTRY_FORMAT_VERSION = 1 as const;

/** Current encrypted candidate pair (4B-4A). Rename forbidden this phase. */
export const REGISTRY_CANDIDATE_DATABASE_ID = TECHNICAL_ACTIVE_DATABASE_ID;
export const REGISTRY_CANDIDATE_MEDIA_ROOT_ID = TECHNICAL_ACTIVE_MEDIA_ROOT_ID;

/**
 * Manifest `generation` field audit (4B-4K):
 * - type: small integer storage ordinal (currently 2)
 * - NOT an opaque ULID / stable generationId
 * - stored as legacyGenerationAlias only — never as registry generationId
 */
export const MANIFEST_STORAGE_GENERATION_ORDINAL = TECHNICAL_CANDIDATE_GENERATION;

export const LIFECYCLE_STATES = [
  "staged",
  "ready",
  "technical_active",
  "previous",
  "retirement_blocked",
  "retired",
  "quarantined",
] as const;

export type GenerationLifecycleState = (typeof LIFECYCLE_STATES)[number];

export const ROUTING_ALLOWED_LIFECYCLE_STATES = ["technical_active"] as const;

export type RoutingAllowedLifecycleState =
  (typeof ROUTING_ALLOWED_LIFECYCLE_STATES)[number];

export const INTEGRITY_STATUSES = ["ok", "unknown", "failed"] as const;

export type GenerationIntegrityStatus = (typeof INTEGRITY_STATUSES)[number];

export type GenerationRegistryRow = {
  generationId: string;
  databaseId: string;
  mediaRootId: string;
  schemaVersion: number;
  lifecycleState: GenerationLifecycleState;
  integrityStatus: GenerationIntegrityStatus;
  /** Compatibility only — manifest storage generation ordinal as string. */
  legacyGenerationAlias: string | null;
  createdAt: string;
  activatedAt: string | null;
  previousAt: string | null;
  retiredAt: string | null;
  quarantinedAt: string | null;
  registryFormatVersion: typeof REGISTRY_FORMAT_VERSION;
};

export type InitializeCandidateResult = {
  row: GenerationRegistryRow;
  created: boolean;
};

/** Fields forbidden in registry persistence (defense-in-depth). */
export const REGISTRY_FORBIDDEN_PERSISTED_KEYS = [
  "content",
  "body",
  "photo",
  "passphrase",
  "password",
  "secret",
  "email",
  "cookie",
  "payload",
] as const;

export function isPlaintextActualDatabaseId(databaseId: string): boolean {
  return databaseId === LOCAL_JOURNAL_DB_NAME;
}

export function isValidLifecycleState(value: string): value is GenerationLifecycleState {
  return (LIFECYCLE_STATES as readonly string[]).includes(value);
}

export function isRoutingAllowedState(
  state: GenerationLifecycleState,
): state is RoutingAllowedLifecycleState {
  return (ROUTING_ALLOWED_LIFECYCLE_STATES as readonly string[]).includes(state);
}

export function isValidSchemaVersion(schemaVersion: number): boolean {
  return schemaVersion === EXPECTED_JOURNAL_SCHEMA_VERSION;
}

export function legacyAliasFromManifestGeneration(generation: number): string {
  return `manifest-generation:${generation}`;
}
