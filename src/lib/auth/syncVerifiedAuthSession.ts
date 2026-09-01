/**
 * Parallel client sync for Firebase verified session (AI-8.1b).
 *
 * Does NOT replace legacy /api/auth/session or lj_user_email cookies.
 * ID token travels only in Authorization: Bearer. No email/uid body.
 * Tokens are never logged.
 */

import {
  getVerifiedAuthSessionClientSyncAvailability,
  type VerifiedAuthSessionClientSyncAvailability,
} from "@/lib/auth/verifiedAuthSessionClientGate";

export type VerifiedAuthSessionClientState =
  | "disabled"
  | "unavailable"
  | "idle"
  | "syncing"
  | "verified"
  | "failed"
  | "cleared";

export type VerifiedAuthSessionUser = {
  uid: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

type FetchLike = typeof fetch;

export type VerifiedAuthSessionSyncDeps = {
  fetchImpl?: FetchLike;
  getAvailability?: () => VerifiedAuthSessionClientSyncAvailability;
};

const VERIFIED_SESSION_PATH = "/api/auth/session/verified";

let sharedState: VerifiedAuthSessionClientState = "disabled";

export function getVerifiedAuthSessionClientState(): VerifiedAuthSessionClientState {
  return sharedState;
}

/** Test helper — reset module state between cases. */
export function resetVerifiedAuthSessionClientStateForTests(
  state: VerifiedAuthSessionClientState = "disabled",
): void {
  sharedState = state;
}

function setState(next: VerifiedAuthSessionClientState): void {
  sharedState = next;
}

export function createVerifiedAuthSessionSyncController(
  deps: VerifiedAuthSessionSyncDeps = {},
) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const getAvailability =
    deps.getAvailability ?? (() => getVerifiedAuthSessionClientSyncAvailability());

  /** Monotonic generation — only the latest event may commit state. */
  let generation = 0;
  /** Serialize handlers so onIdTokenChanged bursts do not parallel-POST. */
  let chain: Promise<void> = Promise.resolve();

  async function postVerifiedSession(idToken: string): Promise<boolean> {
    const res = await fetchImpl(VERIFIED_SESSION_PATH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      credentials: "same-origin",
    });
    return res.ok;
  }

  async function deleteVerifiedSession(): Promise<boolean> {
    const res = await fetchImpl(VERIFIED_SESSION_PATH, {
      method: "DELETE",
      credentials: "same-origin",
    });
    return res.ok;
  }

  async function runForUser(
    user: VerifiedAuthSessionUser | null,
    myGen: number,
  ): Promise<void> {
    // Superseded while queued — do not POST/DELETE for stale events.
    if (myGen !== generation) return;

    const availability = getAvailability();
    if (!availability.allowed) {
      setState(availability.reason);
      return;
    }

    if (!user) {
      setState("syncing");
      let ok = false;
      try {
        ok = await deleteVerifiedSession();
      } catch {
        ok = false;
      }
      if (myGen !== generation) return;
      // DELETE failure is observable (failed), not silent success.
      setState(ok ? "cleared" : "failed");
      return;
    }

    setState("syncing");
    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch {
      if (myGen !== generation) return;
      setState("failed");
      return;
    }
    if (myGen !== generation) return;
    if (!idToken) {
      setState("failed");
      return;
    }

    let ok = false;
    try {
      ok = await postVerifiedSession(idToken);
    } catch {
      ok = false;
    }
    if (myGen !== generation) return;
    setState(ok ? "verified" : "failed");
  }

  /**
   * Handle Firebase auth / ID-token events.
   * Queued serially; superseded generations do not POST and do not commit success.
   */
  function handleAuthUser(user: VerifiedAuthSessionUser | null): Promise<void> {
    const myGen = ++generation;
    const job = chain.then(() => runForUser(user, myGen));
    chain = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }

  /**
   * Best-effort clear that must not block legacy logout.
   * Failure → state "failed" (not silent success).
   */
  function clearAfterLegacySignOut(): Promise<void> {
    return handleAuthUser(null);
  }

  return {
    handleAuthUser,
    clearAfterLegacySignOut,
    getState: () => sharedState,
  };
}

/** Module singleton used by FirebaseAuthProvider. */
let singleton: ReturnType<typeof createVerifiedAuthSessionSyncController> | null =
  null;

export function getVerifiedAuthSessionSyncController(
  deps?: VerifiedAuthSessionSyncDeps,
): ReturnType<typeof createVerifiedAuthSessionSyncController> {
  if (deps) {
    return createVerifiedAuthSessionSyncController(deps);
  }
  if (!singleton) {
    singleton = createVerifiedAuthSessionSyncController();
  }
  return singleton;
}

/** Test helper — drop singleton. */
export function resetVerifiedAuthSessionSyncControllerForTests(): void {
  singleton = null;
  resetVerifiedAuthSessionClientStateForTests("disabled");
}
