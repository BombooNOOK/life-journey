/**
 * Client-side gate for Firebase verified session sync (AI-8.1b).
 *
 * Public flag (default OFF):
 *   NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 *
 * Server still enforces LJD_VERIFIED_AUTH_SESSION_ENABLED on the endpoint.
 * Both must be ON for a verified session to actually establish.
 */

export const VERIFIED_AUTH_SESSION_CLIENT_FLAG =
  "NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED" as const;

export type VerifiedAuthSessionClientSyncAvailability =
  | { allowed: true }
  | { allowed: false; reason: "disabled" | "unavailable" };

export function isVerifiedAuthSessionClientEnabled(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED:
      process.env.NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED,
  },
): boolean {
  const v = (env.NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED ?? "").trim();
  return v === "YES" || v === "1";
}

/**
 * Capacitor local-assets (capacitor-www) has no Next API.
 * Remote `server.url` uses http(s) → same-origin verified sync may run.
 */
export function isCapacitorLocalAssetsContext(
  opts: {
    isNativePlatform?: boolean;
    protocol?: string;
  } = {},
): boolean {
  const isNative =
    opts.isNativePlatform ??
    (typeof window !== "undefined" &&
      (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { Capacitor } = require("@capacitor/core") as {
            Capacitor: { isNativePlatform: () => boolean };
          };
          return Capacitor.isNativePlatform();
        } catch {
          return false;
        }
      })());

  if (!isNative) return false;

  const protocol =
    opts.protocol ??
    (typeof window !== "undefined" ? window.location.protocol : "https:");

  return protocol !== "http:" && protocol !== "https:";
}

export function getVerifiedAuthSessionClientSyncAvailability(
  env?: Record<string, string | undefined>,
  context?: { isNativePlatform?: boolean; protocol?: string },
): VerifiedAuthSessionClientSyncAvailability {
  if (!isVerifiedAuthSessionClientEnabled(env)) {
    return { allowed: false, reason: "disabled" };
  }
  if (isCapacitorLocalAssetsContext(context)) {
    return { allowed: false, reason: "unavailable" };
  }
  return { allowed: true };
}

export function isVerifiedAuthSessionClientSyncAllowed(
  env?: Record<string, string | undefined>,
  context?: { isNativePlatform?: boolean; protocol?: string },
): boolean {
  return getVerifiedAuthSessionClientSyncAvailability(env, context).allowed;
}
