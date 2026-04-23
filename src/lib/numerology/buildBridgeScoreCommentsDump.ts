import {
  bridgeProfiles,
  DESTINY_BIRTHDAY_SCORE_LABEL_BY_PERCENT,
  DESTINY_PERSONALITY_SCORE_LABEL_BY_PERCENT,
  DESTINY_SOUL_SCORE_LABEL_BY_PERCENT,
  LIFE_PATH_BIRTHDAY_SCORE_LABEL_BY_PERCENT,
  LIFE_PATH_DESTINY_SCORE_LABEL_BY_PERCENT,
  LIFE_PATH_PERSONALITY_SCORE_LABEL_BY_PERCENT,
  LIFE_PATH_SOUL_SCORE_LABEL_BY_PERCENT,
  PERSONALITY_BIRTHDAY_SCORE_LABEL_BY_PERCENT,
  SOUL_BIRTHDAY_SCORE_LABEL_BY_PERCENT,
  SOUL_PERSONALITY_SCORE_LABEL_BY_PERCENT,
} from "./bridgeProfiles";

const PERCENTS = [20, 40, 60, 80, 100] as const;

function sep(title: string): string {
  return `\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}\n\n`;
}

function dumpPercentTable(
  parts: string[],
  title: string,
  map: Record<number, string>,
): void {
  parts.push(`--- ${title} ---\n`);
  for (const p of PERCENTS) {
    const line = map[p];
    parts.push(`${p}% … ${line != null && line !== "" ? line : "（未定義）"}\n`);
  }
  parts.push("\n");
}

/**
 * ブリッジの「一致度」に付く短文コメントだけを並べる（校正・ピンポイント差し替え用）。
 * - 各章タイプごとの参照テーブル（20〜100%）
 * - bridgeProfiles の pairKey ごとの実表示ラベル（本文は含めない）
 */
export function buildBridgeScoreCommentsDump(): string {
  const parts: string[] = [];
  const push = (s: string) => parts.push(s);

  push(sep("参照テーブル（章タイプ × 一致度％）"));
  dumpPercentTable(parts, "LP×D（ライフパス × ディスティニー）", LIFE_PATH_DESTINY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "LP×S（ライフパス × ソウル）", LIFE_PATH_SOUL_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "LP×P（ライフパス × パーソナリティ）", LIFE_PATH_PERSONALITY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "LP×BD（ライフパス × バースデー）", LIFE_PATH_BIRTHDAY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "D×S（ディスティニー × ソウル）", DESTINY_SOUL_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "D×P（ディスティニー × パーソナリティ）", DESTINY_PERSONALITY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "D×BD（ディスティニー × バースデー）", DESTINY_BIRTHDAY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "S×P（ソウル × パーソナリティ）", SOUL_PERSONALITY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "S×BD（ソウル × バースデー）", SOUL_BIRTHDAY_SCORE_LABEL_BY_PERCENT);
  dumpPercentTable(parts, "P×BD（パーソナリティ × バースデー）", PERSONALITY_BIRTHDAY_SCORE_LABEL_BY_PERCENT);

  push(sep("pairKey ごとの表示ラベル（bridgeProfiles.scoreLabel）"));
  push(
    "pairKey はふたつのコアを 1 桁に揃えたうえで大きい方を先に並べた 2 桁（同値は 00）。\n" +
      "PDF ではこのラベルがそのまま一致度コメントとして使われます（本文はこの一覧には含めません）。\n\n" +
      "【bridgeNumber と鑑定書ブリッジ章の対応（buildPdfBridgeBlocks の並び・1 始まり）】\n" +
      "0 … 同値ペア用（特別）\n" +
      "1 … LP×D / 2 … LP×S / 3 … LP×P / 4 … LP×BD\n" +
      "5 … D×S / 6 … D×P / 7 … D×BD\n" +
      "8 … S×P / 9 … S×BD / 10 … P×BD\n\n",
  );

  const keys = Object.keys(bridgeProfiles).sort();
  for (const pk of keys) {
    const row = bridgeProfiles[pk];
    if (!row) continue;
    push(`〈${pk}〉 bridgeNumber=${row.bridgeNumber}  一致度 ${row.scorePercent}% … ${row.scoreLabel}\n`);
  }

  return parts.join("");
}
