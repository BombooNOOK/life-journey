#!/usr/bin/env node
/**
 * Firebase のサービスアカウント JSON を Vercel 用に整形する。
 *
 * 使い方:
 *   node scripts/prepare-firebase-service-account-for-vercel.mjs ~/Downloads/your-key.json
 *
 * 出力された base64 文字列を Vercel の FIREBASE_SERVICE_ACCOUNT_JSON に貼る。
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("使い方: node scripts/prepare-firebase-service-account-for-vercel.mjs <service-account.json>");
  process.exit(1);
}

const raw = readFileSync(resolve(inputPath), "utf8");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("JSON として読み込めませんでした:", inputPath);
  process.exit(1);
}

for (const key of ["project_id", "client_email", "private_key"]) {
  if (!parsed[key]) {
    console.error(`必須フィールドがありません: ${key}`);
    process.exit(1);
  }
}

const compactJson = JSON.stringify(parsed);
const base64 = Buffer.from(compactJson, "utf8").toString("base64");

console.log("");
console.log("=== Vercel 設定用 ===");
console.log("変数名: FIREBASE_SERVICE_ACCOUNT_JSON");
console.log("環境: Production（Preview にも同じ値を入れると安全）");
console.log("");
console.log("以下をコピーして Vercel → Settings → Environment Variables に貼り付け:");
console.log("");
console.log(base64);
console.log("");
console.log("設定後、Production を Redeploy してください。");
console.log("");
