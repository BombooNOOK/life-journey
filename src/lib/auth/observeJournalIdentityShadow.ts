/**
 * Journal identity shadow observer (AI-X6.2).
 *
 * OBSERVE ONLY. Never changes actorKey, lookup, HTTP status, or response body.
 * Never creates identity/claim/product rows.
 *
 * Server-side only. Do not import from client bundles.
 */

import { isIdentityShadowDiagnosticsEnabled } from "@/lib/auth/identityShadowDiagnosticsGate";
import {
  compareLegacyCookieActorToStableResolution,
  type JournalIdentityShadowCompareResult,
  type JournalIdentityShadowState,
} from "@/lib/auth/journalIdentityShadowCompare";
import {
  resolveVerifiedViewerActorIdentity,
  type ResolveVerifiedViewerActorIdentityDeps,
} from "@/lib/auth/resolveVerifiedViewerActorIdentity";

export type JournalIdentityShadowRoute =
  | "journal.save"
  | "journal.save_operations.lookup"
  | "journal.save_capability";

export type JournalIdentityShadowSafeReport = JournalIdentityShadowCompareResult & {
  route: JournalIdentityShadowRoute;
  /** Present only when already available on the request path (non-PII opaque id). */
  saveOperationId?: string;
};

export type ObserveJournalIdentityShadowInput = {
  route: JournalIdentityShadowRoute;
  /** Normalized cookie-email actorKey currently used as write/lookup authority. */
  legacyCookieActorKey: string;
  saveOperationId?: string;
};

export type ObserveJournalIdentityShadowDeps = ResolveVerifiedViewerActorIdentityDeps & {
  isEnabled?: () => boolean;
  /** Injected for tests; default writes a PII-free structured line. */
  emit?: (report: JournalIdentityShadowSafeReport) => void;
};

function defaultEmit(report: JournalIdentityShadowSafeReport): void {
  // Structured, PII-free. Never include email/UID/actorKey/claims/tokens/payload.
  console.info(
    "[ljd-identity-shadow]",
    JSON.stringify({
      state: report.state,
      route: report.route,
      hasVerifiedSession: report.hasVerifiedSession,
      identityBound: report.identityBound,
      legacyClaimCount: report.legacyClaimCount,
      cookieActorAuthorized: report.cookieActorAuthorized,
      cookieActorKind: report.cookieActorKind,
      ...(report.saveOperationId
        ? { saveOperationId: report.saveOperationId }
        : {}),
    }),
  );
}

function errorReport(
  route: JournalIdentityShadowRoute,
  saveOperationId?: string,
): JournalIdentityShadowSafeReport {
  return {
    state: "shadow_observation_error" satisfies JournalIdentityShadowState,
    route,
    hasVerifiedSession: false,
    identityBound: false,
    legacyClaimCount: 0,
    cookieActorAuthorized: false,
    cookieActorKind: "unavailable",
    ...(saveOperationId ? { saveOperationId } : {}),
  };
}

/**
 * When flag OFF: returns null immediately (no resolver / no DB).
 * When flag ON: resolves + compares + emits safe diagnostics; never throws.
 */
export async function observeJournalIdentityShadow(
  input: ObserveJournalIdentityShadowInput,
  deps: ObserveJournalIdentityShadowDeps = {},
): Promise<JournalIdentityShadowSafeReport | null> {
  const isEnabled = deps.isEnabled ?? (() => isIdentityShadowDiagnosticsEnabled());
  if (!isEnabled()) {
    return null;
  }

  const emit = deps.emit ?? defaultEmit;

  try {
    const stableResolution = await resolveVerifiedViewerActorIdentity({
      getSession: deps.getSession,
      db: deps.db,
    });
    const compared = compareLegacyCookieActorToStableResolution({
      legacyCookieActorKey: input.legacyCookieActorKey,
      stableResolution,
    });
    const report: JournalIdentityShadowSafeReport = {
      ...compared,
      route: input.route,
      ...(input.saveOperationId
        ? { saveOperationId: input.saveOperationId }
        : {}),
    };
    emit(report);
    return report;
  } catch {
    const report = errorReport(input.route, input.saveOperationId);
    try {
      emit(report);
    } catch {
      // Logging must never affect the request.
    }
    return report;
  }
}
