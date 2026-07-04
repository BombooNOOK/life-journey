import { bridgeGuideCopyJa } from "@/lib/numerology/pdfBridgeGuideCopy";
import {
  getCoreNumberGuideCopy,
  type CoreNumberGuideKey,
} from "@/lib/numerology/pdfCoreNumberGuideCopy";
import {
  coreNumberIntroCopyJa,
  type CoreNumberIntroKey,
} from "@/lib/numerology/pdfCoreNumberIntroCopy";
import {
  getPersonalCycleGuideCopy,
  type PersonalCycleGuideKey,
} from "@/lib/numerology/pdfPersonalCycleGuideCopy";

export type NumberGuideCategoryId = "core" | "other" | "sns";

export type NumberGuideCategory = {
  id: NumberGuideCategoryId;
  title: string;
};

export const NUMBER_GUIDE_CATEGORIES: NumberGuideCategory[] = [
  { id: "core", title: "コアナンバー" },
  { id: "other", title: "その他のナンバー" },
  { id: "sns", title: "SNSのみ" },
];

export type NumberGuideEntryId =
  | CoreNumberGuideKey
  | "bridge"
  | PersonalCycleGuideKey;

type NumberGuideEntryBase = {
  id: NumberGuideEntryId;
  categoryId: NumberGuideCategoryId;
  /** アンカー・目次用の表示名 */
  listLabel: string;
  subtitle: string;
  ljdUsage: string;
  diaryHint: string | null;
};

type CoreNumberGuideEntry = NumberGuideEntryBase & {
  source: "core";
  coreKey: CoreNumberGuideKey;
  introKey?: CoreNumberIntroKey;
};

type BridgeGuideEntry = NumberGuideEntryBase & {
  source: "bridge";
};

type PersonalCycleGuideEntry = NumberGuideEntryBase & {
  source: "personalCycle";
  cycleKey: PersonalCycleGuideKey;
};

export type NumberGuideEntry = CoreNumberGuideEntry | BridgeGuideEntry | PersonalCycleGuideEntry;

const KANTEI_DIARY_HINT =
  "日記の数字欄には直接は出ませんが、鑑定書や読み解きを読んだあと、日記を見返すときの視点の土台になります。";

export const NUMBER_GUIDE_ENTRIES: NumberGuideEntry[] = [
  {
    id: "lifePath",
    categoryId: "core",
    source: "core",
    coreKey: "lifePath",
    introKey: "lifePath",
    listLabel: "ライフ・パス・ナンバー",
    subtitle: coreNumberIntroCopyJa.lifePath.label,
    ljdUsage:
      "無料鑑定の鑑定書で最初に読むナンバーです。日記を保存したあとに届く読み解きコメントの土台にもなります。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "destiny",
    categoryId: "core",
    source: "core",
    coreKey: "destiny",
    introKey: "destiny",
    listLabel: "ディスティニー・ナンバー",
    subtitle: coreNumberIntroCopyJa.destiny.label,
    ljdUsage: "鑑定書の第1章で、あなたに育っていく役割を読み解きます。読み解きコメントにも活かされます。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "soul",
    categoryId: "core",
    source: "core",
    coreKey: "soul",
    introKey: "soul",
    listLabel: "ソウル・ナンバー",
    subtitle: coreNumberIntroCopyJa.soul.label,
    ljdUsage: "鑑定書で、心の奥にある願いを見つめます。読み解きコメントの背景にもなります。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "personality",
    categoryId: "core",
    source: "core",
    coreKey: "personality",
    introKey: "personality",
    listLabel: "パーソナリティ・ナンバー",
    subtitle: coreNumberIntroCopyJa.personality.label,
    ljdUsage: "鑑定書で、周りから見られやすい印象を見つめます。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "birthday",
    categoryId: "core",
    source: "core",
    coreKey: "birthday",
    introKey: "birthday",
    listLabel: "バースデー・ナンバー",
    subtitle: coreNumberIntroCopyJa.birthday.label,
    ljdUsage: "鑑定書で、もともと備わっている強みを見つめます。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "maturity",
    categoryId: "other",
    source: "core",
    coreKey: "maturity",
    introKey: "maturity",
    listLabel: "マチュリティ・ナンバー",
    subtitle: coreNumberIntroCopyJa.maturity.label,
    ljdUsage: "鑑定書で、時間を重ねて育っていく方向を見つめます。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "personalYear",
    categoryId: "other",
    source: "core",
    coreKey: "personalYear",
    listLabel: "パーソナル・イヤー・ナンバー",
    subtitle: "この一年の流れ",
    ljdUsage: "日記を書く日に「今年のすうじ」として表示されます。",
    diaryHint:
      "年のすうじは、この一年を通して育っていくテーマを表します。書き残した日記を、年単位で振り返るヒントとして使えます。",
  },
  {
    id: "personalMonth",
    categoryId: "other",
    source: "personalCycle",
    cycleKey: "personalMonth",
    listLabel: "パーソナル・マンス・ナンバー",
    subtitle: "この月の流れ",
    ljdUsage: "日記を書く日に「今月のすうじ」として表示されます。",
    diaryHint:
      "月のすうじは、今月の中で意識しやすい流れを表します。月ごとの記録を見返すときの手がかりになります。",
  },
  {
    id: "personalDay",
    categoryId: "other",
    source: "personalCycle",
    cycleKey: "personalDay",
    listLabel: "パーソナル・デー・ナンバー",
    subtitle: "今日の流れ",
    ljdUsage: "日記を書く日に「今日のすうじ」として表示されます。",
    diaryHint:
      "今日のすうじは、この一日を振り返るための小さなテーマです。上の「1〜9のすうじ」で、それぞれのテーマの意味を確認できます。",
  },
  {
    id: "bridge",
    categoryId: "other",
    source: "bridge",
    listLabel: "ブリッジ・ナンバー",
    subtitle: "数字同士の関係",
    ljdUsage:
      "鑑定書の第3章で、コアナンバー同士のあいだにある関係を読み解きます。日記の数字欄には直接は出ません。",
    diaryHint: KANTEI_DIARY_HINT,
  },
  {
    id: "universal",
    categoryId: "sns",
    source: "personalCycle",
    cycleKey: "universal",
    listLabel: "ユニバーサル・ナンバー",
    subtitle: "その日みんなで共有する流れ",
    ljdUsage:
      "日記では使いません。BambooNOOKのSNS「あなたのすうじで読む 今日のこころ予報」で「今日のすうじ」として紹介しています。",
    diaryHint: null,
  },
];

export type ResolvedNumberGuideContent = {
  title: string;
  body: string;
};

export function resolveNumberGuideContent(entry: NumberGuideEntry): ResolvedNumberGuideContent {
  if (entry.source === "core") {
    const copy = getCoreNumberGuideCopy(entry.coreKey);
    return { title: copy.title, body: copy.body };
  }
  if (entry.source === "bridge") {
    const page1 = bridgeGuideCopyJa.page1;
    const page2 = bridgeGuideCopyJa.page2;
    return {
      title: page1.title ?? "ブリッジ・ナンバー",
      body: `${page1.body}\n\n${page2.body}`,
    };
  }
  const copy = getPersonalCycleGuideCopy(entry.cycleKey);
  return { title: copy.title, body: copy.body };
}

export function numberGuideEntriesForCategory(categoryId: NumberGuideCategoryId): NumberGuideEntry[] {
  return NUMBER_GUIDE_ENTRIES.filter((entry) => entry.categoryId === categoryId);
}

export function numberGuideAnchorId(entryId: NumberGuideEntryId): string {
  return `number-guide-${entryId}`;
}
