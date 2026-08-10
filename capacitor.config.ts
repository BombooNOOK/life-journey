import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Phase 4B-1 — Capacitor iOS shell (verification only).
 *
 * FINAL Hybrid architecture (Local-first / device-primary) must NOT rely on
 * permanently loading production Vercel in a WebView. Remote `server.url` is a
 * temporary way to verify shell UX against the live Next app until local UI /
 * SQLite / Filesystem land in later phases.
 *
 * Rules:
 * - Never hardcode production URLs here.
 * - Remote mode only when CAPACITOR_SERVER_URL is set (env / cap-sync script).
 * - Prefer https for device verification (Preview). http cleartext is for local
 *   Simulator / LAN smoke only — not a production assumption.
 *
 * Without CAPACITOR_SERVER_URL, WebView shows capacitor-www placeholder
 * (not a complete LJD build).
 */

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
};

export default config;
