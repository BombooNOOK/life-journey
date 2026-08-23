import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createVerifiedAuthSessionSyncController,
  resetVerifiedAuthSessionSyncControllerForTests,
  type VerifiedAuthSessionUser,
} from "@/lib/auth/syncVerifiedAuthSession";
import {
  getVerifiedAuthSessionClientSyncAvailability,
  isCapacitorLocalAssetsContext,
  isVerifiedAuthSessionClientEnabled,
} from "@/lib/auth/verifiedAuthSessionClientGate";

function mockUser(
  uid: string,
  getIdToken: () => Promise<string>,
): VerifiedAuthSessionUser {
  return { uid, getIdToken };
}

describe("verifiedAuthSessionClientGate", () => {
  it("defaults OFF", () => {
    expect(isVerifiedAuthSessionClientEnabled({})).toBe(false);
    expect(
      isVerifiedAuthSessionClientEnabled({
        NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED: "YES",
      }),
    ).toBe(true);
  });

  it("local-assets (native + non-http) → unavailable", () => {
    expect(
      isCapacitorLocalAssetsContext({
        isNativePlatform: true,
        protocol: "capacitor:",
      }),
    ).toBe(true);
    expect(
      isCapacitorLocalAssetsContext({
        isNativePlatform: true,
        protocol: "https:",
      }),
    ).toBe(false);
    expect(
      getVerifiedAuthSessionClientSyncAvailability(
        { NEXT_PUBLIC_LJD_VERIFIED_AUTH_SESSION_ENABLED: "YES" },
        { isNativePlatform: true, protocol: "capacitor:" },
      ),
    ).toEqual({ allowed: false, reason: "unavailable" });
  });

  it("flag OFF → disabled even on browser", () => {
    expect(
      getVerifiedAuthSessionClientSyncAvailability(
        {},
        { isNativePlatform: false, protocol: "https:" },
      ),
    ).toEqual({ allowed: false, reason: "disabled" });
  });
});

describe("syncVerifiedAuthSession controller", () => {
  beforeEach(() => {
    resetVerifiedAuthSessionSyncControllerForTests();
  });

  it("flag OFF → verified POST 0", async () => {
    const fetchImpl = vi.fn();
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: false, reason: "disabled" }),
    });
    await controller.handleAuthUser(
      mockUser("u1", async () => "tok-1"),
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(controller.getState()).toBe("disabled");
  });

  it("local-assets → unavailable, no fetch", async () => {
    const fetchImpl = vi.fn();
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: false, reason: "unavailable" }),
    });
    await controller.handleAuthUser(mockUser("u1", async () => "tok"));
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(controller.getState()).toBe("unavailable");
  });

  it("authenticated + allowed → getIdToken → POST Bearer only, no body email/uid", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ code: "OK" }), { status: 200 }));
    const getIdToken = vi.fn(async () => "exact-id-token");
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });

    await controller.handleAuthUser(mockUser("uid-a", getIdToken));

    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("/api/auth/session/verified");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.headers).toEqual({ Authorization: "Bearer exact-id-token" });
    expect(init?.body).toBeUndefined();
    expect(controller.getState()).toBe("verified");
  });

  it("POST failure → failed state (no fake uid/email)", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 401 }));
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });
    await controller.handleAuthUser(mockUser("uid-a", async () => "tok"));
    expect(controller.getState()).toBe("failed");
  });

  it("user null → DELETE verified session", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ code: "OK" }), { status: 200 }));
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });
    await controller.handleAuthUser(null);
    expect(fetchImpl).toHaveBeenCalledWith("/api/auth/session/verified", {
      method: "DELETE",
      credentials: "same-origin",
    });
    expect(controller.getState()).toBe("cleared");
  });

  it("DELETE failure → failed (not silent success)", async () => {
    const fetchImpl = vi.fn(async () => new Response("err", { status: 500 }));
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });
    await controller.handleAuthUser(null);
    expect(controller.getState()).toBe("failed");
  });

  it("repeated onIdTokenChanged → serializes; no parallel POST storm", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const tokens = ["tok-a", "tok-a", "tok-a"];
    let tokenIdx = 0;
    const fetchImpl = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 20));
      inFlight -= 1;
      return new Response(JSON.stringify({ code: "OK" }), { status: 200 });
    });
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });

    const user = mockUser("uid-a", async () => tokens[Math.min(tokenIdx++, tokens.length - 1)]!);
    await Promise.all([
      controller.handleAuthUser(user),
      controller.handleAuthUser(user),
      controller.handleAuthUser(user),
    ]);

    expect(maxInFlight).toBe(1);
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(3);
    expect(controller.getState()).toBe("verified");
  });

  it("refreshed token → verified session re-issued with new Bearer", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ code: "OK" }), { status: 200 }));
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });

    await controller.handleAuthUser(mockUser("uid-a", async () => "token-v1"));
    await controller.handleAuthUser(mockUser("uid-a", async () => "token-v2"));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0]![1]?.headers).toEqual({
      Authorization: "Bearer token-v1",
    });
    expect(fetchImpl.mock.calls[1]![1]?.headers).toEqual({
      Authorization: "Bearer token-v2",
    });
    expect(controller.getState()).toBe("verified");
  });

  it("stale previous user response is not treated as current success", async () => {
    let resolveOldToken!: (value: string) => void;
    const oldTokenGate = new Promise<string>((r) => {
      resolveOldToken = r;
    });

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string>)?.Authorization;
      expect(auth).toBe("Bearer tok-new");
      return new Response(JSON.stringify({ code: "OK" }), { status: 200 });
    });

    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });

    const p1 = controller.handleAuthUser(
      mockUser("uid-old", () => oldTokenGate),
    );
    // Newer event while old getIdToken is still pending (queued behind, gen bumped).
    const p2 = controller.handleAuthUser(
      mockUser("uid-new", async () => "tok-new"),
    );
    resolveOldToken("tok-old");
    await Promise.all([p1, p2]);

    // Old generation skipped before POST; only new token posted.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![1]?.headers).toEqual({
      Authorization: "Bearer tok-new",
    });
    expect(controller.getState()).toBe("verified");
  });

  it("rapid same-user events coalesce via generation skip when possible", async () => {
    const fetchImpl = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return new Response(JSON.stringify({ code: "OK" }), { status: 200 });
    });
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });

    let n = 0;
    const user = mockUser("uid-a", async () => `tok-${++n}`);
    await Promise.all([
      controller.handleAuthUser(user),
      controller.handleAuthUser(user),
      controller.handleAuthUser(user),
    ]);

    // At most one in-flight POST at a time (serial chain); stale gens may skip.
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(3);
    expect(controller.getState()).toBe("verified");
  });

  it("getIdToken failure → failed; does not invent identity", async () => {
    const fetchImpl = vi.fn();
    const controller = createVerifiedAuthSessionSyncController({
      fetchImpl,
      getAvailability: () => ({ allowed: true }),
    });
    await controller.handleAuthUser(
      mockUser("uid-a", async () => {
        throw new Error("no_token");
      }),
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(controller.getState()).toBe("failed");
  });
});
