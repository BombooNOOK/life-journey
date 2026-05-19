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
      { src: getRepoFontPath("NotoSansCJKjp-Regular.otf"), fontWeight: 400, fontStyle: "normal" },
      {
        src: getRepoFontPath("NotoSansCJKjp-Regular.otf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
      { src: getRepoFontPath("NotoSansCJKjp-Bold.otf"), fontWeight: 700, fontStyle: "normal" },
    ],
  });

  Font.register({
    family: "LibreBaskerville",
    fonts: [
      {
        src: getRepoFontPath("LibreBaskerville-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: getRepoFontPath("LibreBaskerville-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  });

  registered = true;
}
