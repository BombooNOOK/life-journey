/**
 * Durable client Save Operation Intent — 4B-4AH.
 *
 * This is device metadata for remembering one client save operation. It is
 * deliberately separate from the Server JournalSaveOperation record, which
 * prevents duplicate server execution.
 *
 * Never persist journal text, photo data, cookies, or secrets here.
 */

export const CLIENT_SAVE_OPERATION_INTENT_DB_NAME =
  "ljd_client_save_operation_intent" as const;
export const CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION = 1 as const;

/**
 * Native secure-store admission is an independent prerequisite to server
 * capability. AI-3 must require both before it attaches saveOperationId.
 * Details are deliberately collapsed before reaching any UI surface.
 */
export type ClientSaveIntentStoreReadiness =
  | { status: "ready" }
  | { status: "unsupported_platform" }
  | { status: "secure_store_unavailable" }
  | { status: "database_unavailable" }
  | { status: "schema_error" };

export type ClientSaveOperationIntentStatus =
  | "prepared"
  | "awaiting_result"
  | "server_completed"
  | "completed"
  | "recovery_required"
  | "failed_final";

export type ClientSaveOperationIntentFailureCode =
  | "ACORN_INSUFFICIENT"
  | "IDEMPOTENCY_CONFLICT"
  | "SERVER_FAILED_FINAL"
  | "PAYLOAD_UNAVAILABLE"
  | "CAPABILITY_UNAVAILABLE"
  | null;

export type ClientSaveOperationIntent = {
  intentId: string;
  saveOperationId: string;
  /** Client-local ownership snapshot only. Server derives actorKey from cookie. */
  actorKey: string;
  /** Stable reference to a separately stored draft; never the draft payload. */
  draftRef: string | null;
  requestFingerprint: string;
  status: ClientSaveOperationIntentStatus;
  serverEntryId: string | null;
  failureCode: ClientSaveOperationIntentFailureCode;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
};

export type ClientSaveOperationIntentStore = {
  findByActorAndSaveOperationId(
    actorKey: string,
    saveOperationId: string,
  ): Promise<ClientSaveOperationIntent | null>;
  tryInsert(
    intent: ClientSaveOperationIntent,
  ): Promise<
    | { created: true; intent: ClientSaveOperationIntent }
    | { created: false; intent: ClientSaveOperationIntent }
  >;
  update(intent: ClientSaveOperationIntent): Promise<ClientSaveOperationIntent>;
  listRecoverableByActor(actorKey: string): Promise<ClientSaveOperationIntent[]>;
  deleteByActor(actorKey: string): Promise<number>;
};

export type ClientSaveIntentStoreBootstrapResult =
  | { status: "ready"; store: ClientSaveOperationIntentStore }
  | Exclude<ClientSaveIntentStoreReadiness, { status: "ready" }>;

export type ClientSaveIdempotencyCapability =
  | { enabled: false; reason: "server_capability_unavailable" | "not_eligible" }
  | {
      enabled: true;
      /** Account-scoped, server-authenticated eligibility; never a public global flag. */
      rollout: "account_scoped";
    };

export type ClientSaveIdempotencyCapabilityProvider = {
  getCapability(): Promise<ClientSaveIdempotencyCapability>;
};

export type ClientSaveOperationResult =
  | { kind: "completed"; serverEntryId: string }
  | { kind: "processing" }
  | { kind: "fingerprint_mismatch" }
  | { kind: "failed_final"; code: "ACORN_INSUFFICIENT" | "SERVER_FAILED_FINAL" }
  | { kind: "transport_failure" };

export type ClientSaveOperationTransport = {
  /**
   * Sends a fresh/replayed save only after a durable intent is present.
   * The caller's payload stays in memory and is never accepted by intent storage.
   */
  post(input: { saveOperationId: string }): Promise<ClientSaveOperationResult>;
  /** A future authenticated server result endpoint; absent in 4B-4AH Production. */
  lookup?(input: { saveOperationId: string }): Promise<ClientSaveOperationResult>;
};

export const CLIENT_SAVE_INTENT_FORBIDDEN_PERSISTED_KEYS = [
  "content",
  "body",
  "photo",
  "photoBase64",
  "photoDataUrl",
  "caption",
  "cookie",
  "token",
  "secret",
  "password",
] as const;
