#!/usr/bin/env node
/**
 * Bundle Phase 4B-2A Local Storage Lab into capacitor-www (local asset mode).
 * Not the production Next.js app.
 */
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "capacitor-www");
const assetsDir = path.join(outDir, "assets");

mkdirSync(assetsDir, { recursive: true });

copyFileSync(
  path.join(root, "public/images/journal/save-transition-deco-acorn.png"),
  path.join(assetsDir, "poc-seed-acorn.png"),
);

execSync(
  [
    "npx",
    "esbuild",
    "src/lib/local-first/poc/localStorageLabMain.ts",
    "--bundle",
    "--format=iife",
    "--platform=browser",
    "--target=es2020",
    `--outfile=${path.join(outDir, "lab.js")}`,
    "--alias:@=./src",
  ].join(" "),
  { cwd: root, stdio: "inherit" },
);

console.log("[build-local-storage-lab] wrote capacitor-www/lab.js + assets/poc-seed-acorn.png");
