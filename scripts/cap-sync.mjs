#!/usr/bin/env node
/**
 * Capacitor sync with optional remote WebView URL (Phase 4B-1 verification only).
 * Priority: CAPACITOR_SERVER_URL env > .env.local CAPACITOR_SERVER_URL > http://127.0.0.1:3000
 *
 * Remote loading is temporary shell verification — not the final Local-first architecture.
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

const platformArg = process.argv[2]; // optional: ios
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  readCapacitorServerUrlFromEnvLocal() ||
  "http://127.0.0.1:3000";

console.log(`[cap-sync] CAPACITOR_SERVER_URL=${serverUrl}`);
if (serverUrl.includes("vercel.app") === false && serverUrl.startsWith("https://") === false) {
  console.log(
    "[cap-sync] note: http remotes are for local Simulator/LAN smoke only (not production assumption).",
  );
}

const syncCmd = platformArg === "ios" ? "npx cap sync ios" : "npx cap sync";

execSync(syncCmd, {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CAPACITOR_SERVER_URL: serverUrl,
  },
});
