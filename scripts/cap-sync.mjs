#!/usr/bin/env node
/**
 * Capacitor sync with WebView URL from env.
 * Priority: CAPACITOR_SERVER_URL > .env.local > default local dev.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function readCapacitorServerUrlFromEnvLocal(): string | null {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return null;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^CAPACITOR_SERVER_URL=(.+)$/);
    if (!match) continue;
    const raw = match[1].trim();
    return raw.replace(/^["']|["']$/g, "");
  }
  return null;
}

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  readCapacitorServerUrlFromEnvLocal() ||
  "http://127.0.0.1:3000";

console.log(`[cap-sync] CAPACITOR_SERVER_URL=${serverUrl}`);

execSync("npx cap sync", {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CAPACITOR_SERVER_URL: serverUrl,
  },
});
