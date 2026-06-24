/**
 * 伴走キャラ別読み解き原稿の文字数・製本読み解き欄はみ出しを一覧する。
 * 実行: npx tsx scripts/check-companion-comment-lengths.ts
 */
import { baseComments } from "../src/lib/diary-reading/baseComments";
import {
  calendarDayAccents,
  calendarMonthAccents,
  specialOverlapAccents,
} from "../src/lib/diary-reading/calendarAccents";
import { generateDiaryReading } from "../src/lib/diary-reading/generateDiaryReading";
import type { DiaryActionCategory, NumerologyNumber } from "../src/lib/diary-reading/types";
import { getCompanionAccentText } from "../src/lib/journal/commentCalendarAccentByCompanion";
import { calendarAccentDraftByCompanionPending } from "../src/lib/journal/commentCalendarAccentDraftByCompanion.pending";
import {
  getCompanionBaseCommentText,
  getCompanionFallbackBaseCommentText,
} from "../src/lib/journal/commentPersonalDayActivityByCompanion";
import { personalDayActivityDraftByCompanionPending } from "../src/lib/journal/commentPersonalDayActivityDraftByCompanion.pending";
import { resolveDiaryBookEntryV2CommentRenderLayout } from "../src/lib/journal/diaryBookEntryCommentWrap";
import { companionTypes, type CompanionType } from "../src/lib/journal/meta";

const NON_OWL_COMPANIONS = companionTypes.filter((c) => c !== "owl") as Exclude<
  CompanionType,
  "owl"
>[];

const BASE_TEMPLATE_IDS = Object.keys(personalDayActivityDraftByCompanionPending)
  .filter((id) => id !== "fallback_no_base_match")
  .sort();

const ACCENT_TEMPLATE_IDS = Object.keys(calendarAccentDraftByCompanionPending).sort();

const SCHEDULE_SUM = 29 + 29 + 26 + 26 + 27;

type LayoutRow = {
  id: string;
  companion: CompanionType;
  chars: number;
  owlChars: number;
  delta: number;
  lines: number;
  fontScale: number;
  overflows: boolean;
  kind: string;
};

function layoutOf(text: string) {
  return resolveDiaryBookEntryV2CommentRenderLayout(text);
}

function calendarConfigsForPersonalDay(pd: NumerologyNumber) {
  return [
    { calendarMonth: 6, calendarDay: 21, tag: "month-accent" },
    { calendarMonth: pd === 10 ? 1 : pd, calendarDay: 14, tag: "day-accent" },
    { calendarMonth: pd <= 9 ? pd : pd, calendarDay: pd, tag: "overlap-pd" },
    { calendarMonth: 3, calendarDay: 3, tag: "overlap-md" },
  ] as const;
}

function main() {
  const baseRows: LayoutRow[] = [];
  const accentRows: LayoutRow[] = [];
  const fullRows: LayoutRow[] = [];

  // --- ベース本文のみ ---
  for (const templateId of BASE_TEMPLATE_IDS) {
    const owlText = getCompanionBaseCommentText(templateId, "owl");
    const owlChars = owlText.length;
    for (const companion of companionTypes) {
      const text = getCompanionBaseCommentText(templateId, companion);
      const layout = layoutOf(text);
      baseRows.push({
        id: templateId,
        companion,
        chars: text.length,
        owlChars,
        delta: text.length - owlChars,
        lines: layout.lines.length,
        fontScale: layout.fontScale,
        overflows: layout.overflows,
        kind: "base",
      });
    }
  }

  // --- アクセントのみ ---
  const allOwlAccents = [
    ...calendarMonthAccents,
    ...calendarDayAccents,
    ...specialOverlapAccents,
  ];
  const owlAccentById = Object.fromEntries(allOwlAccents.map((a) => [a.id, a.text]));

  for (const accentId of ACCENT_TEMPLATE_IDS) {
    const owlText = getCompanionAccentText(accentId, "owl", owlAccentById[accentId]);
    const owlChars = owlText.length;
    for (const companion of companionTypes) {
      const text = getCompanionAccentText(accentId, companion, owlAccentById[accentId]);
      const layout = layoutOf(text);
      accentRows.push({
        id: accentId,
        companion,
        chars: text.length,
        owlChars,
        delta: text.length - owlChars,
        lines: layout.lines.length,
        fontScale: layout.fontScale,
        overflows: layout.overflows,
        kind: "accent",
      });
    }
  }

  // --- 全文（ベース＋アクセント）: 全 baseComments × 全キャラ × 複数暦設定 ---
  for (const base of baseComments) {
    for (const companion of companionTypes) {
      for (const cal of calendarConfigsForPersonalDay(base.personalDay)) {
        const { text, usedTemplateIds } = generateDiaryReading({
          actionCategory: base.actionCategory,
          mood: "calm",
          personalYear: 1,
          personalMonth: base.personalDay,
          personalDay: base.personalDay,
          calendarMonth: cal.calendarMonth,
          calendarDay: cal.calendarDay,
          companionType: companion,
        });
        const owlText = generateDiaryReading({
          actionCategory: base.actionCategory,
          mood: "calm",
          personalYear: 1,
          personalMonth: base.personalDay,
          personalDay: base.personalDay,
          calendarMonth: cal.calendarMonth,
          calendarDay: cal.calendarDay,
          companionType: "owl",
        }).text;
        const layout = layoutOf(text);
        fullRows.push({
          id: `${base.id}@${cal.tag}`,
          companion,
          chars: text.length,
          owlChars: owlText.length,
          delta: text.length - owlText.length,
          lines: layout.lines.length,
          fontScale: layout.fontScale,
          overflows: layout.overflows,
          kind: `full:${usedTemplateIds.join("+")}`,
        });
      }
    }
  }

  // フォールバック単体
  for (const companion of companionTypes) {
    const text = getCompanionFallbackBaseCommentText(companion);
    const layout = layoutOf(text);
    baseRows.push({
      id: "fallback_no_base_match",
      companion,
      chars: text.length,
      owlChars: getCompanionFallbackBaseCommentText("owl").length,
      delta: text.length - getCompanionFallbackBaseCommentText("owl").length,
      lines: layout.lines.length,
      fontScale: layout.fontScale,
      overflows: layout.overflows,
      kind: "fallback",
    });
  }

  const baseOverflow = baseRows.filter((r) => r.overflows);
  const accentOverflow = accentRows.filter((r) => r.overflows);
  const fullOverflow = fullRows.filter((r) => r.overflows);
  const fullWarning = fullRows.filter((r) => !r.overflows && (r.fontScale < 1 || r.lines >= 5));
  const baseLongVsOwl = baseRows.filter(
    (r) => r.companion !== "owl" && r.delta >= 8 && r.id !== "fallback_no_base_match",
  );
  const accentLongVsOwl = accentRows.filter((r) => r.companion !== "owl" && r.delta >= 8);

  console.log("=== 伴走キャラ別読み解き原稿：文字数チェック（No.001〜262 完了後）===\n");
  console.log(`ベース本文テンプレ: ${BASE_TEMPLATE_IDS.length} + fallback`);
  console.log(`アクセントテンプレ: ${ACCENT_TEMPLATE_IDS.length}`);
  console.log(`全文チェック組合せ: ${fullRows.length}（162×5×4暦設定）`);
  console.log(`製本欄目安: 約 ${SCHEDULE_SUM} 字 / 5行\n`);

  console.log("--- はみ出し件数 ---");
  console.log(`ベース本文のみ: ${baseOverflow.length} 件`);
  console.log(`アクセントのみ: ${accentOverflow.length} 件`);
  console.log(`全文（ベース＋アクセント）: ${fullOverflow.length} 件`);
  console.log(`全文・警告ゾーン（5行 or 縮小フォント）: ${fullWarning.length} 件`);
  console.log(`owl ベースのみはみ出し: ${baseRows.filter((r) => r.companion === "owl" && r.overflows && r.id !== "fallback_no_base_match").length} 件`);

  console.log("\n--- キャラ別平均（owl 比・ベース本文のみ）---");
  for (const companion of NON_OWL_COMPANIONS) {
    const rows = baseRows.filter(
      (r) => r.companion === companion && r.id !== "fallback_no_base_match",
    );
    const avg = rows.reduce((s, r) => s + r.delta, 0) / rows.length;
    const maxDelta = Math.max(...rows.map((r) => r.delta));
    const overflow = rows.filter((r) => r.overflows).length;
    console.log(
      `${companion}: 平均 +${avg.toFixed(1)} 字, 最大 +${maxDelta} 字, はみ出し ${overflow} 件`,
    );
  }

  console.log("\n--- キャラ別平均（owl 比・アクセントのみ）---");
  for (const companion of NON_OWL_COMPANIONS) {
    const rows = accentRows.filter((r) => r.companion === companion);
    const avg = rows.reduce((s, r) => s + r.delta, 0) / rows.length;
    const maxDelta = Math.max(...rows.map((r) => r.delta));
    const overflow = rows.filter((r) => r.overflows).length;
    console.log(
      `${companion}: 平均 +${avg.toFixed(1)} 字, 最大 +${maxDelta} 字, はみ出し ${overflow} 件`,
    );
  }

  printOverflowSection("【要修正】ベース本文のみ・製本欄はみ出し", baseOverflow);
  printOverflowSection("【要修正】アクセントのみ・製本欄はみ出し", accentOverflow);
  printOverflowSection("【要修正】全文・製本欄はみ出し", fullOverflow);

  if (fullWarning.length > 0) {
    console.log("\n=== 【参考】全文・警告ゾーン（はみ出しなし・ギリギリ）上位20件 ===\n");
    const sorted = [...fullWarning].sort((a, b) => b.chars - a.chars);
    for (const row of sorted.slice(0, 20)) {
      console.log(
        `${row.id} | ${row.companion} | ${row.chars}字 (owl ${row.owlChars}, +${row.delta}) | ${row.lines}行 scale ${row.fontScale}`,
      );
    }
    if (sorted.length > 20) console.log(`…他 ${sorted.length - 20} 件`);
  }

  console.log("\n=== 最長テキスト ===");
  const longestBase = [...baseRows].sort((a, b) => b.chars - a.chars)[0];
  const longestAccent = [...accentRows].sort((a, b) => b.chars - a.chars)[0];
  const longestFull = [...fullRows].sort((a, b) => b.chars - a.chars)[0];
  console.log(
    `ベース: ${longestBase.chars}字 ${longestBase.id} / ${longestBase.companion}${longestBase.overflows ? " ⚠️" : ""}`,
  );
  console.log(
    `アクセント: ${longestAccent.chars}字 ${longestAccent.id} / ${longestAccent.companion}${longestAccent.overflows ? " ⚠️" : ""}`,
  );
  console.log(
    `全文: ${longestFull.chars}字 ${longestFull.id} / ${longestFull.companion}${longestFull.overflows ? " ⚠️" : ""}`,
  );

  console.log("\n=== owl より +8 字以上（ベース・上位15）===");
  for (const row of [...baseLongVsOwl].sort((a, b) => b.delta - a.delta).slice(0, 15)) {
    console.log(
      `${row.id} | ${row.companion} | ${row.chars}字 (+${row.delta})${row.overflows ? " ⚠️" : ""}`,
    );
  }

  console.log("\n=== owl より +8 字以上（アクセント・上位15）===");
  for (const row of [...accentLongVsOwl].sort((a, b) => b.delta - a.delta).slice(0, 15)) {
    console.log(
      `${row.id} | ${row.companion} | ${row.chars}字 (+${row.delta})${row.overflows ? " ⚠️" : ""}`,
    );
  }

  if (baseOverflow.length + accentOverflow.length + fullOverflow.length === 0) {
    console.log("\n✓ 製本欄はみ出しは検出されませんでした。");
  }
}

function printOverflowSection(title: string, rows: LayoutRow[]) {
  if (rows.length === 0) return;
  console.log(`\n=== ${title} ===\n`);
  const sorted = [...rows].sort((a, b) => b.chars - a.chars);
  for (const row of sorted) {
    console.log(
      `${row.id} | ${row.companion} | ${row.chars}字 (owl ${row.owlChars}, +${row.delta}) | ${row.lines}行 scale ${row.fontScale}`,
    );
  }
}

main();
