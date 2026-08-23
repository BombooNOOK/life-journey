/**
 * Pure stable actor-key helper for future idempotency identity (AI-8.1a).
 * Does NOT write to JournalSaveOperation / rollout / product tables yet.
 *
 * Format: `firebase:<UID>` — namespace avoids collision with normalized-email keys.
 * UID is not trimmed or rewritten (Firebase UIDs are opaque; empty rejects).
 */

const FIREBASE_ACTOR_KEY_PREFIX = "firebase:" as const;

export function buildFirebaseActorKey(uid: string): string {
  if (typeof uid !== "string" || uid.length === 0) {
    throw new Error("firebase_actor_key_uid_required");
  }
  return `${FIREBASE_ACTOR_KEY_PREFIX}${uid}`;
}

export function isFirebaseActorKey(actorKey: string): boolean {
  return typeof actorKey === "string" && actorKey.startsWith(FIREBASE_ACTOR_KEY_PREFIX);
}
