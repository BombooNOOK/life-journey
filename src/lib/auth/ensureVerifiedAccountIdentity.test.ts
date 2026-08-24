import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_IDENTITY_EMAIL_STATUS } from "@/lib/auth/accountIdentityEmailStatus";
import {
  ensureVerifiedAccountIdentity,
  toPublicIdentityBindingResponse,
} from "@/lib/auth/ensureVerifiedAccountIdentity";
import { isIdentityBindingEnabled } from "@/lib/auth/identityBindingGate";

describe("identityBindingGate", () => {
  it("defaults OFF", () => {
    expect(isIdentityBindingEnabled({})).toBe(false);
    expect(isIdentityBindingEnabled({ LJD_IDENTITY_BINDING_ENABLED: "" })).toBe(false);
  });

  it("accepts YES|1", () => {
    expect(isIdentityBindingEnabled({ LJD_IDENTITY_BINDING_ENABLED: "YES" })).toBe(true);
    expect(isIdentityBindingEnabled({ LJD_IDENTITY_BINDING_ENABLED: "1" })).toBe(true);
  });
});

describe("ensureVerifiedAccountIdentity (unit)", () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const $transaction = vi.fn();

  const db = {
    accountIdentity: { findUnique, create },
    accountIdentityEmail: {},
    $transaction,
  };

  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    $transaction.mockReset();
  });

  it("disabled when binding flag OFF", async () => {
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => false,
      getSession: async () => ({ uid: "u1", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "disabled" });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("disabled when verified auth OFF", async () => {
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => false,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "u1", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "disabled" });
  });

  it("requires verified session (legacy cookie alone insufficient)", async () => {
    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => null,
      db: db as never,
    });
    expect(result).toEqual({ state: "verified_session_required" });
  });

  it("creates identity + primary in first bind path", async () => {
    findUnique.mockResolvedValue(null);
    $transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        accountIdentity: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "id-1" }),
        },
      };
      return fn(tx);
    });

    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "A@Example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "created", identityId: "id-1" });
  });

  it("match when primary equals verified email", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      emails: [
        {
          id: "e1",
          emailNormalized: "a@example.com",
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
        },
      ],
    });

    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "match", identityId: "id-1" });
    expect($transaction).not.toHaveBeenCalled();
  });

  it("email_mismatch preserves binding (no mutation path)", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      emails: [
        {
          id: "e1",
          emailNormalized: "old@example.com",
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
        },
      ],
    });

    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "new@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "email_mismatch", identityId: "id-1" });
    expect($transaction).not.toHaveBeenCalled();
  });

  it("incomplete_identity when no primary", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      emails: [],
    });

    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "incomplete_identity", identityId: "id-1" });
  });

  it("needs_operator_review when multiple primaries observed", async () => {
    findUnique.mockResolvedValue({
      id: "id-1",
      firebaseUid: "UID-A",
      emails: [
        { id: "e1", emailNormalized: "a@example.com", status: "primary" },
        { id: "e2", emailNormalized: "b@example.com", status: "primary" },
      ],
    });

    const result = await ensureVerifiedAccountIdentity({
      isVerifiedAuthEnabled: () => true,
      isBindingEnabled: () => true,
      getSession: async () => ({ uid: "UID-A", email: "a@example.com" }),
      db: db as never,
    });
    expect(result).toEqual({ state: "needs_operator_review", identityId: "id-1" });
  });
});

describe("toPublicIdentityBindingResponse", () => {
  it("never includes identityId/uid/email", () => {
    const publicCreated = toPublicIdentityBindingResponse({
      state: "created",
      identityId: "secret-id",
    });
    expect(publicCreated).toEqual({ code: "ok", state: "created", status: 200 });
    expect(JSON.stringify(publicCreated)).not.toContain("secret-id");

    const mismatch = toPublicIdentityBindingResponse({
      state: "email_mismatch",
      identityId: "secret-id",
    });
    expect(mismatch).toEqual({
      code: "review_required",
      state: "email_mismatch",
      status: 409,
    });
  });
});
