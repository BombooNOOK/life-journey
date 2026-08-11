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
 * At-rest encryption productization is intentionally NOT enabled yet.
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
       * Provisional location (Security SoT: formal path undecided until 4B-3B measure).
       * Candidate A for backup attribute PoC.
       */
      iosDatabaseLocation: "Library/CapacitorDatabase",
      /**
       * Enables SQLCipher plugin APIs for Security PoC (4B-3B).
       * Production journal connection remains mode "no-encryption".
       * Not a production encryption rollout.
       */
      iosIsEncryption: true,
      /**
       * Required by plugin for setEncryptionSecret / changeEncryptionSecret.
       * Plugin KeychainWrapper still omits kSecAttrAccessible (verdict B).
       */
      iosKeychainPrefix: "ljd",
    },
  },
};

export default config;
