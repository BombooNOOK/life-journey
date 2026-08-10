#!/usr/bin/env node
/**
 * Capacitor sync helper.
 *
 * Modes:
 * - Default / remote: CAPACITOR_SERVER_URL env > .env.local > http://127.0.0.1:3000
 *   (Phase 4B-1 shell verification against Next — temporary)
 * - Local assets (Phase 4B-2A): CAPACITOR_LOCAL_ASSETS=1 or --local-assets
 *   → no server.url; WebView loads capacitor-www Storage Lab
 *
 * Do not hardcode production hosts.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function readCapacitorServerUrlFromEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return null;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^CAPACITOR_SERVER_URL=(.+)$/);
    if (!match) continue;
    return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const argv = process.argv.slice(2);
const localAssets =
  process.env.CAPACITOR_LOCAL_ASSETS === "1" || argv.includes("--local-assets");
const platformArg = argv.find((a) => a === "ios" || a === "android");

const env = { ...process.env };

if (localAssets) {
  delete env.CAPACITOR_SERVER_URL;
  console.log(
    "[cap-sync] local asset mode (no CAPACITOR_SERVER_URL) — capacitor-www Storage Lab",
  );
} else {
  const serverUrl =
    process.env.CAPACITOR_SERVER_URL?.trim() ||
    readCapacitorServerUrlFromEnvLocal() ||
    "http://127.0.0.1:3000";
  env.CAPACITOR_SERVER_URL = serverUrl;
  console.log(`[cap-sync] CAPACITOR_SERVER_URL=${serverUrl}`);
  if (serverUrl.startsWith("http://")) {
    console.log(
      "[cap-sync] note: http remotes are for local Simulator/LAN smoke only (not production assumption).",
    );
  }
}

const syncCmd = platformArg === "ios" ? "npx cap sync ios" : "npx cap sync";

execSync(syncCmd, {
  cwd: root,
  stdio: "inherit",
  env,
});
