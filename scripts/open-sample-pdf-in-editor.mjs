/**
 * sample-booklet.pdf を Cursor / VS Code のエディターで開く（同ウィンドウのタブ想定）。
 * PATH に `cursor` または `code` が無い場合はパスだけ案内する。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const pdfPath = path.join(process.cwd(), "sample-booklet.pdf");

if (!fs.existsSync(pdfPath)) {
  console.error(`見つかりません: ${pdfPath}`);
  process.exit(1);
}

function tryOpen(bin) {
  const r = spawnSync(bin, [pdfPath], { stdio: "inherit" });
  return !r.error && (r.status === 0 || r.status === null);
}

if (tryOpen("cursor")) process.exit(0);
if (tryOpen("code")) process.exit(0);

console.error("");
console.error("エディターで開くには、次のどちらかを一度セットアップしてください。");
console.error("  Cursor: Command Palette → 「Shell Command: Install 'cursor' command in PATH」");
console.error("  VS Code: 同様に code コマンドを PATH に入れる");
console.error("");
console.error(`手動で開く場合: サイドバーから次のファイルをクリック →\n  ${pdfPath}`);
process.exit(0);
