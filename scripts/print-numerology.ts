/**
 * ターミナルから数秘コア5項目を素早く出す（Excel・旧鑑定書との突合用）
 *
 * 使い方:
 *   npx tsx scripts/print-numerology.ts 1990-05-21 "YAMADA TARO"
 *   ローマ字を省略すると、日付のみの数秘になります。
 */

import { computeNumerology } from "../src/lib/numerology/compute";
import { snapshotFromNumerology } from "../src/lib/verification/coreFive";

function main() {
  const [ymd, ...romanParts] = process.argv.slice(2);
  if (!ymd) {
    console.error(
      '使い方: npx tsx scripts/print-numerology.ts YYYY-MM-DD "ROMAN NAME"\n例: npx tsx scripts/print-numerology.ts 1990-05-21 "YAMADA TARO"',
    );
    process.exit(1);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) {
    console.error("日付は YYYY-MM-DD 形式で指定してください。");
    process.exit(1);
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const romanRaw = romanParts.join(" ").trim();
  const romanName = romanRaw.length ? romanRaw : null;

  const result = computeNumerology({
    birthDate: { year, month, day },
    romanName,
  });
  const core = snapshotFromNumerology(result);
  console.log(JSON.stringify({ input: { birthDate: `${year}-${m[2]}-${m[3]}`, romanName }, core }, null, 2));
}

main();
