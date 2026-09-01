import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const syncCookies = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/clientCookies", () => ({
  syncLjAuthClientCookies: syncCookies,
}));

describe("localE2eHarness/clientSession runtime guard", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    syncCookies.mockReset();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("isLocalE2eClientRuntimeEnabled is false under production NODE_ENV", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { isLocalE2eClientRuntimeEnabled } = await import("./clientSession");
    expect(isLocalE2eClientRuntimeEnabled()).toBe(false);
    expect(isLocalE2eClientRuntimeEnabled("production")).toBe(false);
    expect(isLocalE2eClientRuntimeEnabled("development")).toBe(true);
  });

  it("production: getLocalE2eClientSession stays null and does not read sessionStorage", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const getItem = vi.fn(() =>
      JSON.stringify({ email: "local-e2e-actor@ljd.local" }),
    );
    const setItem = vi.fn();
    const removeItem = vi.fn();
    vi.stubGlobal("sessionStorage", { getItem, setItem, removeItem });
    const mod = await import("./clientSession");
    mod.setLocalE2eClientSessionForTest("local-e2e-actor@ljd.local");
    expect(mod.getLocalE2eClientSession()).toBeNull();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("production: restore / activate / clear never fetch", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const mod = await import("./clientSession");
    await expect(mod.restoreLocalE2eClientSessionCookies()).resolves.toBe(false);
    await expect(mod.activateLocalE2eClientSessionViaBridge()).resolves.toEqual({
      ok: false,
      reason: "local_e2e_client_runtime_disabled",
    });
    await mod.clearLocalE2eClientSession();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(syncCookies).not.toHaveBeenCalled();
  });

  it("development: restore fetches when an in-memory session exists", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const mod = await import("./clientSession");
    mod.setLocalE2eClientSessionForTest("local-e2e-actor@ljd.local");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ email: "local-e2e-actor@ljd.local" }),
    });
    await expect(mod.restoreLocalE2eClientSessionCookies()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/local-e2e/session",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mod.getLocalE2eClientSession()?.email).toBe("local-e2e-actor@ljd.local");
  });

  it("resolveFirebaseAuthEffectiveUser never stubs under production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { resolveFirebaseAuthEffectiveUser } = await import("./clientSession");
    const firebaseUser = { uid: "fb-1" };
    const stub = { uid: "stub" };
    expect(
      resolveFirebaseAuthEffectiveUser({
        firebaseUser: null,
        localE2eEmail: "local-e2e-actor@ljd.local",
        buildLocalE2eUser: () => stub,
      }),
    ).toBeNull();
    expect(
      resolveFirebaseAuthEffectiveUser({
        firebaseUser,
        localE2eEmail: "local-e2e-actor@ljd.local",
        buildLocalE2eUser: () => stub,
      }),
    ).toBe(firebaseUser);
  });

  it("resolveFirebaseAuthEffectiveUser stubs only in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { resolveFirebaseAuthEffectiveUser } = await import("./clientSession");
    const stub = { uid: "stub" };
    expect(
      resolveFirebaseAuthEffectiveUser({
        firebaseUser: null,
        localE2eEmail: "local-e2e-actor@ljd.local",
        buildLocalE2eUser: () => stub,
      }),
    ).toBe(stub);
  });
});
