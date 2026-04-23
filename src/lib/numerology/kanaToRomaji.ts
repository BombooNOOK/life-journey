/**
 * ふりがな（ひらがな）→ ヘボン式ローマ字（大文字）。
 * 「ん」の後が母音・y で始まる音なら n'、後が b/m/p で始まる音なら唇音同化で m。
 * 将来の例外辞書追加を想定し、変換入口を分離。
 */

const PAIRS: [string, string][] = [
  ["きゃ", "kya"],
  ["きゅ", "kyu"],
  ["きょ", "kyo"],
  ["ぎゃ", "gya"],
  ["ぎゅ", "gyu"],
  ["ぎょ", "gyo"],
  ["しゃ", "sha"],
  ["しゅ", "shu"],
  ["しょ", "sho"],
  ["じゃ", "ja"],
  ["じゅ", "ju"],
  ["じょ", "jo"],
  ["ちゃ", "cha"],
  ["ちゅ", "chu"],
  ["ちょ", "cho"],
  ["にゃ", "nya"],
  ["にゅ", "nyu"],
  ["にょ", "nyo"],
  ["ひゃ", "hya"],
  ["ひゅ", "hyu"],
  ["ひょ", "hyo"],
  ["びゃ", "bya"],
  ["びゅ", "byu"],
  ["びょ", "byo"],
  ["ぴゃ", "pya"],
  ["ぴゅ", "pyu"],
  ["ぴょ", "pyo"],
  ["みゃ", "mya"],
  ["みゅ", "myu"],
  ["みょ", "myo"],
  ["りゃ", "rya"],
  ["りゅ", "ryu"],
  ["りょ", "ryo"],
  ["ぁ", "a"],
  ["ぃ", "i"],
  ["ぅ", "u"],
  ["ぇ", "e"],
  ["ぉ", "o"],
  ["ゔぁ", "va"],
  ["ゔぃ", "vi"],
  ["ゔぇ", "ve"],
  ["ゔぉ", "vo"],
];

const SINGLE: [string, string][] = [
  ["あ", "a"],
  ["い", "i"],
  ["う", "u"],
  ["え", "e"],
  ["お", "o"],
  ["か", "ka"],
  ["き", "ki"],
  ["く", "ku"],
  ["け", "ke"],
  ["こ", "ko"],
  ["が", "ga"],
  ["ぎ", "gi"],
  ["ぐ", "gu"],
  ["げ", "ge"],
  ["ご", "go"],
  ["さ", "sa"],
  ["し", "shi"],
  ["す", "su"],
  ["せ", "se"],
  ["そ", "so"],
  ["ざ", "za"],
  ["じ", "ji"],
  ["ず", "zu"],
  ["ぜ", "ze"],
  ["ぞ", "zo"],
  ["た", "ta"],
  ["ち", "chi"],
  ["つ", "tsu"],
  ["て", "te"],
  ["と", "to"],
  ["だ", "da"],
  ["ぢ", "ji"],
  ["づ", "zu"],
  ["で", "de"],
  ["ど", "do"],
  ["な", "na"],
  ["に", "ni"],
  ["ぬ", "nu"],
  ["ね", "ne"],
  ["の", "no"],
  ["は", "ha"],
  ["ひ", "hi"],
  ["ふ", "fu"],
  ["へ", "he"],
  ["ほ", "ho"],
  ["ば", "ba"],
  ["び", "bi"],
  ["ぶ", "bu"],
  ["べ", "be"],
  ["ぼ", "bo"],
  ["ぱ", "pa"],
  ["ぴ", "pi"],
  ["ぷ", "pu"],
  ["ぺ", "pe"],
  ["ぽ", "po"],
  ["ま", "ma"],
  ["み", "mi"],
  ["む", "mu"],
  ["め", "me"],
  ["も", "mo"],
  ["や", "ya"],
  ["ゆ", "yu"],
  ["よ", "yo"],
  ["ら", "ra"],
  ["り", "ri"],
  ["る", "ru"],
  ["れ", "re"],
  ["ろ", "ro"],
  ["わ", "wa"],
  ["を", "wo"],
  ["ん", "n"],
  ["ゐ", "i"],
  ["ゑ", "e"],
  ["ゔ", "vu"],
];

const LONGEST_FIRST: [string, string][] = [...PAIRS, ...SINGLE].sort(
  (a, b) => b[0].length - a[0].length,
);

/** 長音記号（全角ダッシュ）。かな入力でもよく使われる */
const PROLONGED_SOUND_MARK = "\u30FC";

const VOWEL_KANA: Record<"a" | "i" | "u" | "e" | "o", string> = {
  a: "あ",
  i: "い",
  u: "う",
  e: "え",
  o: "お",
};

function moraLastVowelLetter(mora: string): keyof typeof VOWEL_KANA | null {
  if (mora === "っ") return null;
  const entry = LONGEST_FIRST.find(([k]) => k === mora);
  if (!entry) return null;
  const romaji = entry[1];
  const vowels = romaji.match(/[aeiou]/gi);
  if (!vowels || vowels.length === 0) return null;
  const last = vowels[vowels.length - 1].toLowerCase();
  if (last === "a" || last === "i" || last === "u" || last === "e" || last === "o") {
    return last;
  }
  return null;
}

function vowelKanaSuffixForPrefix(prefix: string): string | null {
  if (prefix.length === 0) return null;
  for (let len = 2; len >= 1; len--) {
    const start = prefix.length - len;
    if (start < 0) continue;
    const slice = prefix.slice(start);
    if (slice === "っ") {
      return vowelKanaSuffixForPrefix(prefix.slice(0, start));
    }
    if (LONGEST_FIRST.some(([k]) => k === slice)) {
      const v = moraLastVowelLetter(slice);
      return v ? VOWEL_KANA[v] : null;
    }
  }
  return null;
}

function advanceOneMoraLength(s: string, i: number): number {
  const ch = s[i];
  if (ch === "っ") return 1;
  if (ch === "ん") return 1;
  return matchMora(s, i).len;
}

/**
 * ふりがな中の「ー」を、直前の音節の母音に対応するひらがな1文字へ展開する（例: びりー→びりい、あーむ→ああむ）。
 * ローマ字変換・数秘の前にかけ、入力表記ゆれを吸収する。
 */
export function normalizeProlongedSoundMarksInHiragana(kana: string): string {
  const t = kana.trim();
  if (!t) return "";
  let out = "";
  let i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (ch === PROLONGED_SOUND_MARK || ch === "ー") {
      const vk = vowelKanaSuffixForPrefix(out);
      if (!vk) {
        throw new Error("長音記号「ー」の直前に、母音を持つ音がありません。");
      }
      out += vk;
      i += 1;
      continue;
    }
    const step = advanceOneMoraLength(t, i);
    out += t.slice(i, i + step);
    i += step;
  }
  return out;
}

function matchMora(s: string, start: number): { romaji: string; len: number } {
  for (const [k, v] of LONGEST_FIRST) {
    if (s.startsWith(k, start)) {
      return { romaji: v, len: k.length };
    }
  }
  throw new Error(`未対応の文字がふりがなに含まれています: ${s[start]}`);
}

function doubleSokuon(romaji: string): string {
  if (romaji.startsWith("ch")) return "c" + romaji;
  if (romaji.startsWith("sh")) return "s" + romaji;
  if (romaji.startsWith("ts")) return "t" + romaji;
  if (romaji.length > 0) return romaji[0] + romaji;
  return romaji;
}

export interface RomanizedNameParts {
  lastNameRoman: string;
  firstNameRoman: string;
  /** 数秘入力: 姓・名の順（例: YAMADA TARO） */
  romanNameForNumerology: string;
  /** 表示用: 姓・名の順（現状は同一値） */
  romanNameForDisplay: string;
}

function nextStartsWithVowelOrY(next: string): boolean {
  return /^[aeiouy]/.test(next);
}

/** ヘボン式: んの後が b / m / p 行（唇音）のとき n は m に同化する */
function nAssimilatesToMBeforeNextMora(nextRomaji: string): boolean {
  const c = nextRomaji.charAt(0).toLowerCase();
  return c === "b" || c === "m" || c === "p";
}

export function hiraganaToHepburn(kana: string): string {
  const s = normalizeProlongedSoundMarksInHiragana(kana);
  if (!s) return "";
  let i = 0;
  let out = "";
  while (i < s.length) {
    const ch = s[i];
    if (ch === "っ") {
      if (i + 1 >= s.length) {
        throw new Error("小文字の「っ」が末尾にあります。");
      }
      const next = matchMora(s, i + 1);
      out += doubleSokuon(next.romaji);
      i += 1 + next.len;
      continue;
    }
    if (ch === "ん") {
      if (i + 1 >= s.length) {
        out += "n";
        i += 1;
        continue;
      }
      const next = matchMora(s, i + 1).romaji;
      if (nAssimilatesToMBeforeNextMora(next)) {
        out += "m";
        i += 1;
        continue;
      }
      out += nextStartsWithVowelOrY(next) ? "n'" : "n";
      i += 1;
      continue;
    }
    const m = matchMora(s, i);
    out += m.romaji;
    i += m.len;
  }

  // 長音の簡易正規化（ヘボン式表記寄り、マクロンは使わない）
  out = out
    .replace(/ou/g, "o")
    .replace(/oo/g, "o")
    .replace(/uu/g, "u");
  return out.toUpperCase();
}

export function romanizeFromKanaParts(lastNameKana: string, firstNameKana: string): RomanizedNameParts {
  const lastNameRoman = hiraganaToHepburn(lastNameKana);
  const firstNameRoman = hiraganaToHepburn(firstNameKana);
  const romanNameForNumerology = [lastNameRoman, firstNameRoman].filter(Boolean).join(" ");
  const romanNameForDisplay = romanNameForNumerology;
  return { lastNameRoman, firstNameRoman, romanNameForNumerology, romanNameForDisplay };
}
