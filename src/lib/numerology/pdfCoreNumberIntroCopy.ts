/**
 * コアナンバー中間扉（`core-number-first-bg.png` + 生成テキスト・6種共通背景）。
 * Canva: `core`（各ナンバーで文言のみ差し替え）
 */
export type CoreNumberIntroKey =
  | "lifePath"
  | "destiny"
  | "soul"
  | "personality"
  | "birthday"
  | "maturity";

export type CoreNumberIntroCopy = {
  frameTitle: string;
  label: string;
};

export const coreNumberIntroCopyJa: Record<CoreNumberIntroKey, CoreNumberIntroCopy> = {
  lifePath: {
    frameTitle: "ライフパス",
    label: "生まれ持った性質",
  },
  destiny: {
    frameTitle: "ディスティニー",
    label: "あなたに与えられた役割",
  },
  soul: {
    frameTitle: "ソウル",
    label: "心の奥にある願い",
  },
  personality: {
    frameTitle: "パーソナリティ",
    label: "外に伝わる印象",
  },
  birthday: {
    frameTitle: "バースデー",
    label: "もともと備わっている強み",
  },
  maturity: {
    frameTitle: "マチュリティ",
    label: "時間を重ねて育っていく力",
  },
};

export function getCoreNumberIntroCopy(key: CoreNumberIntroKey): CoreNumberIntroCopy {
  return coreNumberIntroCopyJa[key];
}
