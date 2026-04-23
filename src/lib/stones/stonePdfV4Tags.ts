import type { StonePdfV4Entry } from "./stonePdfV4Types";

/**
 * 鑑定書 PDF の日本語キーワードから、既存の選定・鑑定スコア（英語タグ）へ近い値を推定する。
 */
export function inferEnglishTagsFromPdf(entry: StonePdfV4Entry): string[] {
  const tags = new Set<string>();
  const blob = [
    ...entry.headlineKeywords,
    ...entry.numerologyKeywords,
    entry.tagline,
    entry.featureText.slice(0, 500),
  ].join("\n");

  if (/愛|恋|慈|家族|情熱|優し|思いやり|癒し|包容|友愛/.test(blob)) tags.add("love");
  if (/調和|協調|平和|円満|共感|円滑/.test(blob)) tags.add("harmony");
  if (/直感|精神|霊|洞察|真理|神秘|宇宙|ひらめき|インスピレーション/.test(blob)) tags.add("spirit");
  if (/積極|先駆|開拓|自信|行動力/.test(blob)) tags.add("initiative");
  if (/リーダー|統率|牽引|統師/.test(blob)) tags.add("leadership");
  if (/安定|堅実|地に足|忍耐|継続|着実|グラウンド/.test(blob)) tags.add("stability");
  if (/パワー|強靭|意志|決断|集中/.test(blob)) tags.add("power");
  if (/ビジネス|仕事|成功|金運|実り|商談|受験/.test(blob)) tags.add("business");
  if (/表現|創造|喜び|明るさ|芸術/.test(blob)) tags.add("expression");
  if (/真実|正直|分析|知性|論理/.test(blob)) tags.add("truth");
  if (/築く|構築|ビルダー|基盤|大きな夢/.test(blob)) tags.add("builder");
  if (/コミュニケーション|伝える|語り|発信/.test(blob)) tags.add("communication");
  if (/信念|前向き|勇気/.test(blob)) tags.add("confidence");
  if (/分析|思考|論理/.test(blob)) tags.add("analysis");
  if (/守る|防御|魔除け|保護|厄/.test(blob)) tags.add("protection");
  if (/変化|機敏|自由|旅|チャレンジ/.test(blob)) tags.add("change");
  if (/活力|エネルギー|元気|活性/.test(blob)) tags.add("vitality");
  if (/大地|足元|ルーツ|地に足/.test(blob)) tags.add("grounding");
  if (/叡智|智慧|学び|知性/.test(blob)) tags.add("wisdom");
  if (/平和|静けさ|安らぎ/.test(blob)) tags.add("peace");
  if (/チャネル|受信|潜在/.test(blob)) tags.add("channel");

  if (entry.targetNumber === 11 || entry.targetNumber === 22 || entry.targetNumber === 33) {
    tags.add("master");
  }

  if (tags.size === 0) tags.add("expression");

  return [...tags];
}
