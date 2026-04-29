import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

// 日本語PDFで英語用の自動ハイフネーションが走らないよう、グローバルに無効化する
Font.registerHyphenationCallback((word: string) => [word]);

function getRepoFontPath(filename: string): string {
  // フォントはこのリポジトリ配下にコピーして同梱する（Vercelの node_modules pruning を避ける）
  return path.join(process.cwd(), "src/components/pdf/assets/fonts", filename);
}

export function ensureJapaneseFont(): void {
  if (registered) return;

  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: getRepoFontPath("noto-sans-jp-400-normal.woff2"), fontWeight: 400 },
      { src: getRepoFontPath("noto-sans-jp-700-normal.woff2"), fontWeight: 700 },
    ],
  });
  registered = true;
}
