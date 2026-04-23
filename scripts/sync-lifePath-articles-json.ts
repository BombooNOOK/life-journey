/**
 * data/lifePathArticles-for-rewrite.json を lifePathData と一致させる。
 * 実行: npx tsx scripts/sync-lifePath-articles-json.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { lifePathData, type LifePathArticle } from "../src/lib/numerology/lifePathData";

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

function main(): void {
  const out: Record<string, LifePathArticle> = {};
  for (const k of KEYS) {
    const a = lifePathData[k];
    if (a) out[String(k)] = a;
  }
  const target = path.join(process.cwd(), "data/lifePathArticles-for-rewrite.json");
  writeFileSync(target, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("wrote", target, "keys:", Object.keys(out).join(", "));
}

main();
