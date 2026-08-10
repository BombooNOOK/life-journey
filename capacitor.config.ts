/**
 * Phase 4B-1 Shell + Phase 4B-2A Local-first Storage Lab.
 *
 * FINAL Hybrid architecture (Local-first / device-primary) must NOT rely on
 * permanently loading production Vercel in a WebView. Remote `server.url` is a
 * temporary way to verify shell UX against the live Next app.
 *
 * Rules:
 * - Never hardcode production URLs here.
 * - Remote mode only when CAPACITOR_SERVER_URL is set (env / cap-sync script).
 * - Without CAPACITOR_SERVER_URL, WebView loads capacitor-www (Local Storage Lab
 *   / placeholder — not a complete production LJD UI).
 * - Prefer https for device verification (Preview). http cleartext is for local
 *   Simulator / LAN smoke only — not a production assumption.
 *
 * SQLite plugin (@capacitor-community/sqlite) is community-maintained and uses
 * SQLCipher even for no-encryption opens — production export-compliance follow-up.
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
      /** Align with Phase 3: life-record DB under Library, not Cache. */
      iosDatabaseLocation: "Library/CapacitorDatabase",
      /** PoC: no encryption productization yet (plugin still links SQLCipher). */
      iosIsEncryption: false,
    },
  },
};

export default config;
