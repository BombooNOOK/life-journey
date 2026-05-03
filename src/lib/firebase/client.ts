import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";

function readConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    throw new Error(
      "Firebase の環境変数が不足しています。.env.local に NEXT_PUBLIC_FIREBASE_* を設定してください。",
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

let app: FirebaseApp | null = null;
/** `setPersistence` を複数回 await しても同じ Promise を共有する（Safari で初回タップが空振りしにくくする） */
let persistencePromise: Promise<void> | null = null;

function scheduleBrowserLocalPersistence(auth: Auth): void {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(() => {
      /* 失敗しても既定の永続化で続行 */
    });
  }
}

/** `getFirebaseAuth()` のあと、Google サインイン等の前に必ず await すること */
export async function waitForFirebaseAuthPersistence(auth: Auth): Promise<void> {
  scheduleBrowserLocalPersistence(auth);
  await persistencePromise;
}

/** ブラウザ専用。Server Component からは呼ばないでください。 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp はクライアント（ブラウザ）でのみ使えます。");
  }
  if (!app) {
    const existing = getApps()[0];
    app = existing ?? initializeApp(readConfig());
  }
  return app;
}

export type GetFirebaseAuthOptions = {
  /**
   * true のときは永続化を遅延する。Safari 等で `setPersistence` が先に走ると
   * `getRedirectResult` が取り込めなくなる事例があるため、リダイレクト戻りの初回処理で使う。
   */
  deferPersistence?: boolean;
};

export function getFirebaseAuth(options?: GetFirebaseAuthOptions): Auth {
  const auth = getAuth(getFirebaseApp());
  auth.languageCode = "ja";
  if (!options?.deferPersistence) {
    scheduleBrowserLocalPersistence(auth);
  }
  return auth;
}
