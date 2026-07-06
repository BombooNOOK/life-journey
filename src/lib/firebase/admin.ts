import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | undefined;

function parseServiceAccountJson(): Record<string, string> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }

  const candidates = [raw];
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (decoded.startsWith("{")) {
      candidates.unshift(decoded);
    }
  } catch {
    // base64 でなければそのまま JSON として扱う
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Record<string, string>;
    } catch {
      continue;
    }
  }

  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON");
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0]!;
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert(parseServiceAccountJson()),
  });
  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

function isFirebaseUserNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code) === "auth/user-not-found"
  );
}

/** Firebase Authentication のユーザーをメールで削除する（見つからなければ成功扱い） */
export async function deleteFirebaseAuthUserByEmail(email: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
  } catch (error) {
    if (isFirebaseUserNotFoundError(error)) return;
    throw error;
  }
}
