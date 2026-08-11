/**
 * LJD SecureKeyStore — platform-neutral facade (Phase 4B-3B PoC).
 * iOS: Security.framework via LjdLocalSecurity (explicit WhenUnlocked).
 * Android: future Keystore adapter — Domain must not call Keychain APIs.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity } from "ljd-local-security";

export type SecureKeyMeta = {
  stored: boolean;
  exists: boolean;
  accessibility: string | null;
  byteLength: number | null;
  randomSource?: string;
};

const POC_ACCOUNT = "ljd.security.poc.db-key";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("SecureKeyStore PoC is native-only.");
  }
}

/** Generate a random secret. Caller receives the value once — never log it. */
export async function generateRandomSecret(byteLength = 32): Promise<{
  secret: string;
  byteLength: number;
  randomSource: string;
}> {
  assertNative();
  const result = await LjdLocalSecurity.generateSecret({ byteLength });
  return {
    secret: result.secret,
    byteLength: result.byteLength,
    randomSource: result.randomSource,
  };
}

export async function setSecret(account: string, secret: string): Promise<SecureKeyMeta> {
  assertNative();
  const result = await LjdLocalSecurity.setSecret({ account, secret });
  return {
    stored: result.stored,
    exists: true,
    accessibility: result.accessibility,
    byteLength: result.byteLength,
  };
}

export async function getSecret(account: string): Promise<{
  found: boolean;
  secret: string | null;
  accessibility: string | null;
  byteLength: number | null;
}> {
  assertNative();
  const result = await LjdLocalSecurity.getSecret({ account });
  return {
    found: result.found,
    secret: result.found ? (result.secret ?? null) : null,
    accessibility: result.accessibility ?? null,
    byteLength: result.byteLength ?? null,
  };
}

export async function existsSecret(account: string): Promise<SecureKeyMeta> {
  assertNative();
  const result = await LjdLocalSecurity.existsSecret({ account });
  return {
    stored: result.exists,
    exists: result.exists,
    accessibility: result.accessibility ?? null,
    byteLength: null,
  };
}

export async function deleteSecret(account: string): Promise<boolean> {
  assertNative();
  const result = await LjdLocalSecurity.deleteSecret({ account });
  return result.deleted;
}

export const SecureKeyStore = {
  POC_ACCOUNT,
  generateRandomSecret,
  set: setSecret,
  get: getSecret,
  exists: existsSecret,
  delete: deleteSecret,
} as const;

export type SecureKeyStorePort = typeof SecureKeyStore;
