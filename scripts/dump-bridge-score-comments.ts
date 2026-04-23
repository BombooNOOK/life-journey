/**
 * ブリッジ一致度コメントのみをプレーンテキストに出力（校正用）。
 *
 *   npx tsx scripts/dump-bridge-score-comments.ts
 *   npx tsx scripts/dump-bridge-score-comments.ts /path/to/out.txt
 *
 * ブラウザでは /preview/bridge-comments と同じ内容を表示できます。
 */

import fs from "node:fs";
import path from "node:path";

import { buildBridgeScoreCommentsDump } from "../src/lib/numerology/buildBridgeScoreCommentsDump";

function main() {
  const body = buildBridgeScoreCommentsDump();
  const outArg = process.argv[2];
  const outPath = outArg
    ? path.resolve(outArg)
    : path.join(process.cwd(), "bridge-score-comments-dump.txt");
  fs.writeFileSync(outPath, body, "utf8");
  console.error(`Wrote ${outPath} (${body.length} chars)`);
}

main();
