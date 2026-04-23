/**
 * 鑑定書に差し込む本文系データを、ソース別に1本のテキストへ並べる（校正・一括チェック用）。
 *
 * 使い方:
 *   npx tsx scripts/dump-numerology-body-text.ts
 *   npx tsx scripts/dump-numerology-body-text.ts /path/to/out.txt
 *
 * ブラウザでは /preview/all-bodies と同じ内容を表示できます。
 */

import fs from "node:fs";
import path from "node:path";

import { buildNumerologyBodyTextDump } from "../src/lib/numerology/buildNumerologyBodyTextDump";

function main() {
  const body = buildNumerologyBodyTextDump();
  const outArg = process.argv[2];
  const outPath = outArg
    ? path.resolve(outArg)
    : path.join(process.cwd(), "numerology-body-dump.txt");
  fs.writeFileSync(outPath, body, "utf8");
  console.error(`Wrote ${outPath} (${body.length} chars)`);
}

main();
