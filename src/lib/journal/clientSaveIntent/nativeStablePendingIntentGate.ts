/**
 * Native/client gate for durable Firebase UID pending-intent identity (AI-X6.6A / X6.6A2 / X6.6B).
 * Default OFF — legacy email actorKey behavior unchanged.
 *
 * Client-visible enablement (required for real UI / Capacitor WebView):
 *   NEXT_PUBLIC_LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED=YES|1
 *
 * Node / vitest alias (non-public; not visible to Next.js client bundles):
 *   LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED=YES|1
 *
 * Do NOT enable in Production until X6.6B device validation and coordinated
 * server stable JSO rollout gates are approved.
 */

export const NATIVE_STABLE_PENDING_INTENT_FLAG =
  "LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED" as const;

/** Next.js client / Capacitor remote-shell visible flag (AI-X6.6B precheck fix). */
export const NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG =
  "NEXT_PUBLIC_LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED" as const;

function readStablePendingIntentFlagValue(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): string {
  const client = (env[NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG] ?? "").trim();
  if (client) return client;
  return (env[NATIVE_STABLE_PENDING_INTENT_FLAG] ?? "").trim();
}

/**
 * Next.js only inlines NEXT_PUBLIC_* via static property access
 * (`process.env.NEXT_PUBLIC_…`), never `process.env[name]` / full `process.env`.
 */
function clientVisibleStableFlagEnv(): Record<string, string | undefined> {
  return {
    [NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG]:
      process.env.NEXT_PUBLIC_LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED,
    [NATIVE_STABLE_PENDING_INTENT_FLAG]:
      process.env.LJD_NATIVE_STABLE_PENDING_INTENT_ENABLED,
  };
}

export function isNativeStablePendingIntentEnabled(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>,
): boolean {
  const v = readStablePendingIntentFlagValue(env ?? clientVisibleStableFlagEnv());
  return v === "YES" || v === "1";
}
