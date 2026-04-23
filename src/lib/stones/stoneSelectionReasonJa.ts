import type { AppraisalCoreKey } from "./types";
import type { OrderPayload } from "@/lib/order/types";
import { focusThemeBonusForStoneId, isNeutralStoneFocusTheme } from "./stoneFocusTheme";
import { getStonePdfV4EntryById } from "./stonePdfV4Master";

const CORE: Record<AppraisalCoreKey, { label: string; lead: string }> = {
  lifePath: {
    label: "ライフ・パス",
    lead: "生まれ持った性質や、人生全体の土台となる進み方",
  },
  destiny: {
    label: "ディスティニー",
    lead: "この世で果たしたい役割や、目標としての使命の輪郭",
  },
  soul: {
    label: "ソウル",
    lead: "心の奥にある本音や、魂が望む願い",
  },
  personality: {
    label: "パーソナリティ",
    lead: "外に見える印象や、才能の出し方",
  },
  birthday: {
    label: "バースデー",
    lead: "生まれた日が示すテーマや、日々のリズム",
  },
};

/** 関心テーマごとに「あなたが今そこに置いている想い」を言語化 */
const THEME_WISH: Record<string, string> = {
  "夢・目標": "叶えたい夢や目標へ、確かな一歩を踏み出したい",
  "これからの人生": "これからの人生を、自分らしく前向きに描いていきたい",
  "恋愛・結婚": "愛情やパートナーシップを、もっと豊かに感じたい",
  "対人関係": "人とのつながりや信頼を、大切に育てていきたい",
  "家族": "家族や身近な人との絆を、安心して守っていきたい",
  "仕事・使命": "仕事や天職のテーマを、誇りを持って進めていきたい",
  "金運・豊かさ": "豊かさやチャンスを、生活の中に実感していきたい",
  "健康・癒し": "心身のバランスや癒しを、日常に取り戻したい",
  "厄除け・守り": "守りや安心感を、しっかり味方につけたい",
};

function themeWishPhrase(theme: string): string {
  return THEME_WISH[theme] ?? `${theme}というテーマを、今の自分の中心に置きたい`;
}

/** 原稿ベースのキーワードを「効能」のように並べる（最大4語） */
export function formatStoneEffectClause(stoneId: string | null): string {
  if (!stoneId) return "さまざまなパワー";
  const e = getStonePdfV4EntryById(stoneId);
  if (!e) return "さまざまなパワー";
  const pool = [...new Set([...e.headlineKeywords, ...e.numerologyKeywords])].filter(Boolean);
  if (pool.length > 0) {
    return pool
      .slice(0, 4)
      .map((s) => `「${s}」`)
      .join("や");
  }
  const one = e.tagline.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
  if (one.length > 0) return `「${one.slice(0, 36)}${one.length > 36 ? "…" : ""}」`;
  return "さまざまなパワー";
}

export interface AppraisalReasonArgs {
  key: AppraisalCoreKey;
  focusThemeLabel: string;
  focusThemeMatched: boolean;
  stoneId: string | null;
  stoneNameJa: string | null;
  number: number | null;
  color: string;
}

/**
 * 鑑定5コアの「選定理由」（ブラウザ・PDF詳細）。関心テーマ × 石の効能キーワードで説明する。
 */
export function buildAppraisalStoneReasonJa(args: AppraisalReasonArgs): string {
  const { key, focusThemeLabel, focusThemeMatched, stoneId, stoneNameJa, number, color } = args;
  const core = CORE[key];
  const n = number != null ? String(number) : "—";
  const name = stoneNameJa ?? "この石";
  const effects = formatStoneEffectClause(stoneId);
  const neutral = isNeutralStoneFocusTheme(focusThemeLabel);

  const head = `「${core.label}」は${core.lead}を表すナンバー${n}に結びつき、今回は色「${color}」に属する石の候補から選びました。`;

  if (neutral) {
    return `${head} そのなかで「${name}」は、鑑定原稿に${effects}と記される働きが、このコアのメッセージといちばん重なるため、今回の一石にしました。`;
  }

  const wish = themeWishPhrase(focusThemeLabel);

  if (focusThemeMatched) {
    return `${head} 最初に選んでいただいた関心「${focusThemeLabel}」は、${wish}という、いまのあなたのテーマに近いものです。同じ候補のなかで「${name}」を選んだのは、${effects}という石の持ち味が、その関心と深く重なり、まるでそっと寄り添うように響くからです。`;
  }

  return `${head} 関心「${focusThemeLabel}」—${wish}—に寄り添う石を探しました。キーワードの一致は控えめでも、${effects}というバランスがこのコアの役割と静かに共鳴する「${name}」が、条件を満たす候補のなかでいちばん自然にハマるため、今回の一石にしました。`;
}

/** 鑑定書「一覧」ページ用（5コア各行）— 詳細と同じ文面で統一 */
export function buildListOverviewRowReasonJa(args: AppraisalReasonArgs): string {
  return buildAppraisalStoneReasonJa(args);
}

/** お守り石（一覧ページ・チャーム行） */
export function buildCharmListReasonJa(order: OrderPayload): string {
  const theme = order.stoneFocusTheme;
  const charm = order.stones.charmStone;
  const name = charm.nameJa;
  const effects = formatStoneEffectClause(charm.id);
  const lp = order.numerology.lifePathNumber;
  const matched =
    !isNeutralStoneFocusTheme(theme) && focusThemeBonusForStoneId(charm.id, theme) > 0;

  if (isNeutralStoneFocusTheme(theme)) {
    return `ライフ・パス${lp}の色に属するお守り候補のなかで「${name}」を選びました。${effects}という支えが、メインの石を補い、日々を支えるパートナーになることを願っています。`;
  }

  if (matched) {
    return `関心「${theme}」を大切にされているあなたへ。5つのコアとは別枠の「お守り石」として「${name}」を添えました。${effects}という働きが、今のあなたの想いをそっと後押しし、持ち歩くたびに心がホッとするような守りになれば幸いです。`;
  }

  return `関心「${theme}」に寄り添う石を探しつつ、ライフ・パス${lp}の色の条件も外さないようにしました。お守りとして「${name}」を選んだのは、${effects}という味方が、メインの石と肩を並べて歩いてくれるからです。`;
}
