/**
 * Native/client gate for durable Firebase UID pending-intent identity (AI-X6.6A).
 * Default OFF — legacy email actorKey behavior unchanged.
 *
 * Enable: LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED=YES|1
 *
 * Do NOT enable in Production until X6.6B device validation and coordinated
 * server stable JSO rollout gates are approved.
 */

export const NATIVE_STABLE_PENDING_INTENT_FLAG =
  "LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED" as const;

export function isNativeStablePendingIntentEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[NATIVE_STABLE_PENDING_INTENT_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
