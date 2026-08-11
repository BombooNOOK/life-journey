#!/usr/bin/env node
/**
 * Bundle developer Local Storage Diagnostics into capacitor-www (local asset mode).
 * Not the production Next.js app.
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "capacitor-www");

mkdirSync(outDir, { recursive: true });

execSync(
  [
    "npx",
    "esbuild",
    "src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts",
    "--bundle",
    "--format=iife",
    "--platform=browser",
    "--target=es2020",
    `--outfile=${path.join(outDir, "lab.js")}`,
    "--alias:@=./src",
  ].join(" "),
  { cwd: root, stdio: "inherit" },
);

console.log("[build:local-storage-diagnostics] wrote capacitor-www/lab.js");
