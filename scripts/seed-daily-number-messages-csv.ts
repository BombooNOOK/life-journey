/**
 * MESSAGE_SEEDS_VARIANT_A/B/C から docs/daily-number-messages-owl-base.csv を生成する。
 *
 *   npx tsx scripts/seed-daily-number-messages-csv.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { csvEscape } from "../src/lib/admin/post-atelier/daily-number/csvIO";
import { MESSAGE_SEEDS_VARIANT_A } from "./daily-number-messages-variant-a-data";
import { MESSAGE_SEEDS_VARIANT_B } from "./daily-number-messages-variant-b-data";
import { MESSAGE_SEEDS_VARIANT_C } from "./daily-number-messages-variant-c-data";

const LIFE_PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
const TODAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const VARIANTS = ["A", "B", "C"] as const;

const LP_COLORS: Record<number, string> = {
  1: "赤",
  2: "白",
  3: "黄色",
  4: "緑",
  5: "青",
  6: "ピンク",
  7: "紺・藍色",
  8: "オレンジ・茶色",
  9: "紫",
  11: "シルバー",
  22: "ゴールド",
  33: "レインボー",
};

const HEADER =
  "todayNumber,lifePathNumber,character,messageType,variant,colorName,body,action1,action2,notes";

const seedByKeyA = new Map(
  MESSAGE_SEEDS_VARIANT_A.map((seed) => [
    `${seed.todayNumber}:${seed.lifePathNumber}`,
    seed,
  ]),
);

const seedByKeyB = new Map(
  MESSAGE_SEEDS_VARIANT_B.map((seed) => [
    `${seed.todayNumber}:${seed.lifePathNumber}`,
    seed,
  ]),
);

const seedByKeyC = new Map(
  MESSAGE_SEEDS_VARIANT_C.map((seed) => [
    `${seed.todayNumber}:${seed.lifePathNumber}`,
    seed,
  ]),
);

const rows: string[] = [HEADER];

for (const todayNumber of TODAY_NUMBERS) {
  for (const lifePathNumber of LIFE_PATHS) {
    for (const variant of VARIANTS) {
      const key = `${todayNumber}:${lifePathNumber}`;
      const seed =
        variant === "A"
          ? seedByKeyA.get(key)
          : variant === "B"
            ? seedByKeyB.get(key)
            : variant === "C"
              ? seedByKeyC.get(key)
              : undefined;
      const colorName = LP_COLORS[lifePathNumber] ?? "";
      const notes = `UD${todayNumber}×LP${lifePathNumber}×owl base variant ${variant}`;

      rows.push(
        [
          String(todayNumber),
          String(lifePathNumber),
          "owl",
          "base",
          variant,
          colorName,
          seed?.body ?? "",
          seed?.action1 ?? "",
          seed?.action2 ?? "",
          notes,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }
}

const outPath = path.join(process.cwd(), "docs", "daily-number-messages-owl-base.csv");
writeFileSync(outPath, `${rows.join("\n")}\n`, "utf8");

const filledA = MESSAGE_SEEDS_VARIANT_A.length;
const filledB = MESSAGE_SEEDS_VARIANT_B.length;
const filledC = MESSAGE_SEEDS_VARIANT_C.length;
const filledTotal = filledA + filledB + filledC;
console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
console.log(`  variant A filled: ${filledA}`);
console.log(`  variant B filled: ${filledB}`);
console.log(`  variant C filled: ${filledC}`);
console.log(`  total filled messages: ${filledTotal}`);
console.log(`  expected total: ${TODAY_NUMBERS.length * LIFE_PATHS.length * VARIANTS.length}`);
