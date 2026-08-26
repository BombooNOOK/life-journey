/**
 * Server-only gate for Journal identity shadow diagnostics (AI-X6.2).
 * Default OFF — observe only when explicitly enabled; never changes authority.
 *
 * Enable: LJD_IDENTITY_SHADOW_DIAGNOSTICS_ENABLED=YES|1
 *
 * Do NOT enable in Vercel Preview/Production for this phase.
 */

export const IDENTITY_SHADOW_DIAGNOSTICS_FLAG =
  "LJD_IDENTITY_SHADOW_DIAGNOSTICS_ENABLED" as const;

export function isIdentityShadowDiagnosticsEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = (env[IDENTITY_SHADOW_DIAGNOSTICS_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}
