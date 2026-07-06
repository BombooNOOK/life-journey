import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByEmail = vi.fn();
const deleteUser = vi.fn();
const getAuth = vi.fn(() => ({ getUserByEmail, deleteUser }));
const initializeApp = vi.fn(() => ({ name: "test-app" }));
const getApps = vi.fn(() => []);

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn((value: unknown) => value),
  getApps,
  initializeApp,
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth,
}));

describe("firebase admin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    getApps.mockReturnValue([]);
  });

  it("isFirebaseAdminConfigured は環境変数の有無を返す", async () => {
    const { isFirebaseAdminConfigured } = await import("@/lib/firebase/admin");
    expect(isFirebaseAdminConfigured()).toBe(false);

    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "demo",
      client_email: "demo@demo.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n",
    });
    expect(isFirebaseAdminConfigured()).toBe(true);
  });

  it("deleteFirebaseAuthUserByEmail は uid で削除する", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "demo",
      client_email: "demo@demo.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n",
    });
    getUserByEmail.mockResolvedValue({ uid: "uid-123" });
    deleteUser.mockResolvedValue(undefined);

    const { deleteFirebaseAuthUserByEmail } = await import("@/lib/firebase/admin");
    await deleteFirebaseAuthUserByEmail("test@example.com");

    expect(getUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(deleteUser).toHaveBeenCalledWith("uid-123");
  });

  it("deleteFirebaseAuthUserByEmail は user-not-found を無視する", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "demo",
      client_email: "demo@demo.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n",
    });
    getUserByEmail.mockRejectedValue({ code: "auth/user-not-found" });

    const { deleteFirebaseAuthUserByEmail } = await import("@/lib/firebase/admin");
    await expect(deleteFirebaseAuthUserByEmail("missing@example.com")).resolves.toBeUndefined();
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
