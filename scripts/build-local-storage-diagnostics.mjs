#!/usr/bin/env node
/**
 * Bundle developer Local Storage Diagnostics + AI-7 isolated recovery harness
 * into capacitor-www (local asset mode). Not the production Next.js app.
 *
 * NEXT_PUBLIC_AI7_DEVICE_HARNESS is compile-time injected into ai7-recovery.js
 * only. Production Next / Vercel builds do not use this script.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "capacitor-www");
const esbuildBin = path.join(root, "node_modules", ".bin", "esbuild");
const cryptoShim = "./scripts/ai7-local-assets-node-crypto-shim.js";

mkdirSync(outDir, { recursive: true });

function runEsbuild(args) {
  execFileSync(esbuildBin, args, { cwd: root, stdio: "inherit" });
}

runEsbuild([
  "src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts",
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=es2020",
  `--outfile=${path.join(outDir, "lab.js")}`,
  "--alias:@=./src",
  `--alias:node:crypto=${cryptoShim}`,
]);

runEsbuild([
  "src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/deviceUi.ts",
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=es2020",
  `--outfile=${path.join(outDir, "ai7-recovery.js")}`,
  "--alias:@=./src",
  `--alias:node:crypto=${cryptoShim}`,
  '--define:process.env.NODE_ENV="development"',
  '--define:process.env.NEXT_PUBLIC_AI7_DEVICE_HARNESS="YES"',
  '--banner:js=var process={env:{NODE_ENV:"development",NEXT_PUBLIC_AI7_DEVICE_HARNESS:"YES"}};',
]);

copyFileSync(
  path.join(
    root,
    "src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/ai7-recovery.html",
  ),
  path.join(outDir, "ai7-recovery.html"),
);

console.log("[build:local-storage-diagnostics] wrote capacitor-www/lab.js");
console.log("[build:local-storage-diagnostics] wrote capacitor-www/ai7-recovery.js");
console.log("[build:local-storage-diagnostics] wrote capacitor-www/ai7-recovery.html");
