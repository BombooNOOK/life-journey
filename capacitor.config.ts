/**
 * Phase 4B-1 Shell + Local-first foundation (Capacitor).
 *
 * FINAL Hybrid architecture (Local-first / device-primary) must NOT rely on
 * permanently loading production Vercel in a WebView. Remote `server.url` is a
 * temporary way to verify shell UX against the live Next app.
 *
 * Rules:
 * - Never hardcode production URLs here.
 * - Remote mode only when CAPACITOR_SERVER_URL is set (env / cap-sync script).
 * - Without CAPACITOR_SERVER_URL, WebView loads capacitor-www (developer
 *   Local Storage Diagnostics placeholder — not a complete production LJD UI).
 * - Prefer https for device verification (Preview). http cleartext is for local
 *   Simulator / LAN smoke only — not a production assumption.
 *
 * SQLite plugin (@capacitor-community/sqlite) is community-maintained and uses
 * SQLCipher even for no-encryption opens — production export-compliance follow-up.
 *
 * 4B-3E: iosIsEncryption enables plugin secret APIs. ljd_local_journal still
 * opens with no-encryption — do not auto-migrate existing plaintext DBs.
 */

import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() ?? "";
const useRemoteServer = serverUrl.length > 0;
const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "app.bamboonook.ljd",
  appName: "Life Journey Diary",
  webDir: "capacitor-www",
  ...(useRemoteServer
    ? {
        server: {
          url: serverUrl,
          cleartext: isHttp,
        },
      }
    : {}),
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    CapacitorSQLite: {
      /**
       * Relative container path. Absolute path is resolved at runtime via
       * FileManager (LjdLocalSecurity.resolveApplicationSupportLjdDir).
       */
      iosDatabaseLocation: "Library/Application Support/app.bamboonook.ljd",
      /** Enables setEncryptionSecret / SQLCipher APIs. Journal remains no-encryption. */
      iosIsEncryption: true,
      iosKeychainPrefix: "ljd",
    },
  },
};

export default config;
