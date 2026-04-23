import { birthdayData } from "./birthdayData";
import {
  bridgeIntro,
  bridgeMeaning,
  bridgeProfiles,
  destinyBirthdayBridgeIntro,
  destinyPersonalityBridgeIntro,
  destinySoulBridgeIntro,
  DESTINY_BIRTHDAY_BRIDGE_HELP,
  DESTINY_PERSONALITY_BRIDGE_HELP,
  DESTINY_SOUL_BRIDGE_HELP,
  lifePathBirthdayBridgeIntro,
  lifePathPersonalityBridgeIntro,
  lifePathSoulBridgeIntro,
  LIFE_PATH_BIRTHDAY_BRIDGE_HELP,
  LIFE_PATH_PERSONALITY_BRIDGE_HELP,
  LIFE_PATH_SOUL_BRIDGE_HELP,
  personalityBirthdayBridgeIntro,
  PERSONALITY_BIRTHDAY_BRIDGE_HELP,
  soulBirthdayBridgeIntro,
  soulPersonalityBridgeIntro,
  SOUL_BIRTHDAY_BRIDGE_HELP,
  SOUL_PERSONALITY_BRIDGE_HELP,
} from "./bridgeProfiles";
import { bridgeReferenceIntro } from "./bridgeReferenceData";
import { personalDayMonthLines, type DayNumber, type MonthNumber } from "./data/personalDayLines";
import { personalMonthData } from "./data/personalMonthData";
import { personalYearData } from "./data/personalYearCycleData";
import { destinyData } from "./destinyData";
import type { LifePathSectionKey } from "./lifePathData";
import { lifePathData, lifePathSectionOrder } from "./lifePathData";
import { maturityData } from "./maturityData";
import { personalityData } from "./personalityData";
import { soulData } from "./soulData";

const SECTION_LABEL: Record<LifePathSectionKey, string> = {
  basic: "基本",
  love: "恋愛",
  work: "仕事",
  money: "お金",
  relationship: "対人",
  health: "健康",
};

function sortNumericKeys<T extends Record<string, unknown>>(obj: T): number[] {
  return Object.keys(obj)
    .map((k) => Number(k))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

function sep(title: string): string {
  return `\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}\n\n`;
}

/** 鑑定書差し込み用の本文系を、ソース別に1本のプレーンテキストに並べる（校正・一括チェック用） */
export function buildNumerologyBodyTextDump(): string {
  const parts: string[] = [];
  const push = (s: string) => parts.push(s);

  push(sep("ライフパス（各ナンバー × 6セクション）"));
  for (const n of sortNumericKeys(lifePathData)) {
    const row = lifePathData[n];
    if (!row) continue;
    push(`【LP ${n}】${row.title}\n\n`);
    for (const key of lifePathSectionOrder) {
      push(`〈${SECTION_LABEL[key]}〉\n${row.sections[key].trim()}\n\n`);
    }
  }

  function dumpArticleMap(name: string, data: Record<number, { title: string; article: string }>) {
    push(sep(name));
    for (const n of sortNumericKeys(data)) {
      const row = data[n];
      if (!row) continue;
      push(`【${n}】${row.title}\n\n${row.article.trim()}\n\n`);
    }
  }

  dumpArticleMap("ディスティニー・ナンバー", destinyData);
  dumpArticleMap("ソウル・ナンバー", soulData);
  dumpArticleMap("パーソナリティ・ナンバー", personalityData);

  push(sep("マチュリティ・ナンバー"));
  for (const n of sortNumericKeys(maturityData as Record<string, unknown>)) {
    const row = maturityData[n];
    if (!row) continue;
    push(`【${n}】${row.title}\n\n${row.article.trim()}\n\n`);
  }

  push(sep("バースデー・ナンバー（強み・テーマ・本文）"));
  for (const n of sortNumericKeys(birthdayData)) {
    const row = birthdayData[n];
    if (!row) continue;
    push(`【${n}】強み: ${row.strength} / テーマ: ${row.theme}\n\n${row.article.trim()}\n\n`);
  }

  push(sep("パーソナルイヤー（テーマ・副題・本文）"));
  for (const n of sortNumericKeys(personalYearData)) {
    const row = personalYearData[n];
    if (!row) continue;
    push(`【PY ${n}】${row.theme}\n副題: ${row.subtitle.replace(/\n/g, " ")}\n\n${row.article.trim()}\n\n`);
  }

  push(sep("パーソナルマンス（テーマ・副題・本文）"));
  for (const n of sortNumericKeys(personalMonthData)) {
    const row = personalMonthData[n];
    if (!row) continue;
    push(`【PM ${n}】${row.theme}\n副題: ${row.subtitle.replace(/\n/g, " ")}\n\n${row.article.trim()}\n\n`);
  }

  const bridgeIntros: { label: string; title: string; lead: string; article: string }[] = [
    { label: "LP×D", ...bridgeIntro },
    { label: "LP×S", ...lifePathSoulBridgeIntro },
    { label: "LP×P", ...lifePathPersonalityBridgeIntro },
    { label: "LP×BD", ...lifePathBirthdayBridgeIntro },
    { label: "D×S", ...destinySoulBridgeIntro },
    { label: "D×P", ...destinyPersonalityBridgeIntro },
    { label: "D×BD", ...destinyBirthdayBridgeIntro },
    { label: "S×P", ...soulPersonalityBridgeIntro },
    { label: "S×BD", ...soulBirthdayBridgeIntro },
    { label: "P×BD", ...personalityBirthdayBridgeIntro },
  ];

  push(sep("ブリッジ各章の導入（見出し・リード・本文）"));
  for (const b of bridgeIntros) {
    push(`〈${b.label}〉${b.title}\nリード: ${b.lead.trim()}\n\n${b.article.trim()}\n\n`);
  }

  push(sep("ブリッジ章末の短い補足（HELP）"));
  const helps: [string, string][] = [
    ["LP×S", LIFE_PATH_SOUL_BRIDGE_HELP],
    ["LP×P", LIFE_PATH_PERSONALITY_BRIDGE_HELP],
    ["LP×BD", LIFE_PATH_BIRTHDAY_BRIDGE_HELP],
    ["D×S", DESTINY_SOUL_BRIDGE_HELP],
    ["D×P", DESTINY_PERSONALITY_BRIDGE_HELP],
    ["D×BD", DESTINY_BIRTHDAY_BRIDGE_HELP],
    ["S×P", SOUL_PERSONALITY_BRIDGE_HELP],
    ["S×BD", SOUL_BIRTHDAY_BRIDGE_HELP],
    ["P×BD", PERSONALITY_BIRTHDAY_BRIDGE_HELP],
  ];
  for (const [label, text] of helps) {
    push(`〈${label}〉\n${text.trim()}\n\n`);
  }

  push(sep("ブリッジナンバー意味（短文・参考ページ用）"));
  for (const n of sortNumericKeys(bridgeMeaning as Record<string, unknown>)) {
    push(`【B ${n}】${bridgeMeaning[n].trim()}\n`);
  }
  push("\n");

  push(sep("参考ページの見出し・リード（bridgeReferenceIntro）"));
  push(`${bridgeReferenceIntro.title}\n${bridgeReferenceIntro.lead}\n\n`);

  push(sep("bridgeProfiles（pairKey ごとの本文・一致度ラベル付き）"));
  const pairKeys = Object.keys(bridgeProfiles).sort();
  for (const pk of pairKeys) {
    const row = bridgeProfiles[pk];
    if (!row) continue;
    push(
      `〈pairKey ${pk}〉 bridgeNumber=${row.bridgeNumber} score=${row.scorePercent}% / ${row.scoreLabel}\n\n${row.article.trim()}\n\n`,
    );
  }

  push(sep("パーソナルデイ一言（月1–9 × 日1–9 × 候補4）"));
  for (let m = 1; m <= 9; m++) {
    const mm = m as MonthNumber;
    for (let d = 1; d <= 9; d++) {
      const dd = d as DayNumber;
      const lines = personalDayMonthLines[mm][dd];
      lines.forEach((line, i) => {
        push(`〈PM${m}×PD${d} 候補${i + 1}〉${line.trim()}\n`);
      });
    }
  }
  push("\n");

  return parts.join("");
}
